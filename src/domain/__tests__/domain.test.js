import { describe, it, expect } from 'vitest';
import { handleSubtaskToggle, handleParentStatusChange, isTaskOverdue, TASK_STATUS } from '../taskRules.js';
import { generateOccurrences, applyOccurrenceEdit, RECURRENCE_FREQ, RECURRENCE_END, EDIT_SCOPE } from '../recurrenceEngine.js';
import { calculateHabitStats } from '../habitStreak.js';
import { reconstructPomodoroState, POMODORO_STATUS, POMODORO_MODE } from '../pomodoroReconstruction.js';
import { checkEntitlement } from '../entitlements.js';

describe('Task & Subtask Bidirectional Rules', () => {
  it('automatically marks parent DONE when all subtasks are completed', () => {
    const parentTask = { id: 't1', status: TASK_STATUS.IN_PROGRESS };
    const subtasks = [
      { id: 's1', is_completed: true },
      { id: 's2', is_completed: false }
    ];

    const result = handleSubtaskToggle(parentTask, subtasks, 's2');
    expect(result.updatedParentStatus).toBe(TASK_STATUS.DONE);
    expect(result.updatedSubtasks.every(st => st.is_completed)).toBe(true);
  });

  it('reopens parent to IN_PROGRESS when a subtask is reopened on a DONE parent', () => {
    const parentTask = { id: 't1', status: TASK_STATUS.DONE };
    const subtasks = [
      { id: 's1', is_completed: true },
      { id: 's2', is_completed: true }
    ];

    const result = handleSubtaskToggle(parentTask, subtasks, 's2');
    expect(result.updatedParentStatus).toBe(TASK_STATUS.IN_PROGRESS);
    expect(result.updatedSubtasks.find(st => st.id === 's1').is_completed).toBe(true);
    expect(result.updatedSubtasks.find(st => st.id === 's2').is_completed).toBe(false);
  });

  it('marks all subtasks DONE when parent is manually marked DONE', () => {
    const parentTask = { id: 't1', status: TASK_STATUS.TODO };
    const subtasks = [
      { id: 's1', is_completed: false },
      { id: 's2', is_completed: false }
    ];

    const result = handleParentStatusChange(parentTask, subtasks, TASK_STATUS.DONE);
    expect(result.updatedParentStatus).toBe(TASK_STATUS.DONE);
    expect(result.updatedSubtasks.every(st => st.is_completed)).toBe(true);
  });

  it('reopens parent to IN_PROGRESS and marks all subtasks incomplete when DONE parent is reopened', () => {
    const parentTask = { id: 't1', status: TASK_STATUS.DONE };
    const subtasks = [
      { id: 's1', is_completed: true },
      { id: 's2', is_completed: true }
    ];

    const result = handleParentStatusChange(parentTask, subtasks, TASK_STATUS.TODO);
    expect(result.updatedParentStatus).toBe(TASK_STATUS.IN_PROGRESS);
    expect(result.updatedSubtasks.every(st => !st.is_completed)).toBe(true);
  });

  it('correctly calculates overdue status', () => {
    const now = new Date(2026, 7, 24, 15, 0, 0);
    expect(isTaskOverdue('2026-08-23', null, TASK_STATUS.TODO, now)).toBe(true);
    expect(isTaskOverdue('2026-08-25', null, TASK_STATUS.TODO, now)).toBe(false);
    expect(isTaskOverdue('2026-08-24', '14:00', TASK_STATUS.TODO, now)).toBe(true);
    expect(isTaskOverdue('2026-08-24', '16:00', TASK_STATUS.TODO, now)).toBe(false);
    expect(isTaskOverdue('2026-08-23', null, TASK_STATUS.DONE, now)).toBe(false);
  });
});

describe('Recurrence Engine', () => {
  it('generates independent occurrence records according to frequency and count', () => {
    const rule = {
      id: 'rule_1',
      task_id: 't_rec',
      frequency: RECURRENCE_FREQ.DAILY,
      interval: 1,
      end_type: RECURRENCE_END.COUNT,
      end_count: 3,
      timezone: 'Africa/Cairo'
    };

    const occs = generateOccurrences(rule, '2026-08-24', '09:00');
    expect(occs.length).toBe(3);
    expect(occs[0].scheduled_date).toBe('2026-08-24');
    expect(occs[1].scheduled_date).toBe('2026-08-25');
    expect(occs[2].scheduled_date).toBe('2026-08-26');
    expect(occs[0].timezone).toBe('Africa/Cairo');
  });

  it('correctly scopes edits to this occurrence, future occurrences, or all occurrences', () => {
    const occurrences = [
      { id: 'occ_0', title: 'Original 0' },
      { id: 'occ_1', title: 'Original 1' },
      { id: 'occ_2', title: 'Original 2' }
    ];

    const singleEdited = applyOccurrenceEdit(occurrences, 'occ_1', { title: 'Edited 1' }, EDIT_SCOPE.THIS_OCCURRENCE);
    expect(singleEdited[0].title).toBe('Original 0');
    expect(singleEdited[1].title).toBe('Edited 1');
    expect(singleEdited[2].title).toBe('Original 2');

    const futureEdited = applyOccurrenceEdit(occurrences, 'occ_1', { title: 'Edited Future' }, EDIT_SCOPE.THIS_AND_FUTURE);
    expect(futureEdited[0].title).toBe('Original 0');
    expect(futureEdited[1].title).toBe('Edited Future');
    expect(futureEdited[2].title).toBe('Edited Future');
  });
});

describe('Habit Streak Engine', () => {
  it('calculates active streak correctly when completed today', () => {
    const refDate = new Date(2026, 7, 24);
    const completions = ['2026-08-24', '2026-08-23', '2026-08-22'];
    const stats = calculateHabitStats(completions, refDate);
    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
    expect(stats.isCompletedToday).toBe(true);
  });

  it('preserves streak from yesterday if today is not completed yet', () => {
    const refDate = new Date(2026, 7, 24);
    const completions = ['2026-08-23', '2026-08-22'];
    const stats = calculateHabitStats(completions, refDate);
    expect(stats.currentStreak).toBe(2);
    expect(stats.isCompletedToday).toBe(false);
  });
});

describe('Pomodoro Server-Authoritative Session Reconstruction', () => {
  it('reconstructs running timer state from start timestamp', () => {
    const startTime = new Date(2026, 7, 24, 12, 0, 0);
    const checkTime = new Date(2026, 7, 24, 12, 5, 0);

    const session = {
      id: 'p1',
      mode: POMODORO_MODE.FOCUS,
      planned_duration: 25 * 60,
      elapsed_seconds: 0,
      status: POMODORO_STATUS.RUNNING,
      started_at: startTime.toISOString()
    };

    const state = reconstructPomodoroState(session, checkTime);
    expect(state.status).toBe(POMODORO_STATUS.RUNNING);
    expect(state.elapsedSeconds).toBe(300);
    expect(state.remainingSeconds).toBe(1200);
    expect(state.isFinished).toBe(false);
  });

  it('detects when timer completed while user was away from site', () => {
    const startTime = new Date(2026, 7, 24, 12, 0, 0);
    const checkTime = new Date(2026, 7, 24, 12, 30, 0);

    const session = {
      id: 'p1',
      mode: POMODORO_MODE.FOCUS,
      planned_duration: 25 * 60,
      elapsed_seconds: 0,
      status: POMODORO_STATUS.RUNNING,
      started_at: startTime.toISOString()
    };

    const state = reconstructPomodoroState(session, checkTime);
    expect(state.status).toBe(POMODORO_STATUS.COMPLETED);
    expect(state.remainingSeconds).toBe(0);
    expect(state.isFinished).toBe(true);
  });
});

describe('Free vs Premium Entitlements', () => {
  it('enforces free tier limits accurately', () => {
    expect(checkEntitlement('lists', 9, false).allowed).toBe(false);
    expect(checkEntitlement('lists', 8, false).allowed).toBe(true);

    expect(checkEntitlement('habits', 5, false).allowed).toBe(false);
    expect(checkEntitlement('habits', 4, false).allowed).toBe(true);

    expect(checkEntitlement('subtasks', 19, false).allowed).toBe(false);
    expect(checkEntitlement('subtasks', 18, false).allowed).toBe(true);

    expect(checkEntitlement('reminders', 2, false).allowed).toBe(false);
    expect(checkEntitlement('reminders', 1, false).allowed).toBe(true);

    expect(checkEntitlement('data_export', 0, false).allowed).toBe(false);
  });

  it('allows expanded capacity on premium tier', () => {
    expect(checkEntitlement('lists', 150, true).allowed).toBe(true);
    expect(checkEntitlement('habits', 50, true).allowed).toBe(true);
    expect(checkEntitlement('subtasks', 50, true).allowed).toBe(true);
    expect(checkEntitlement('reminders', 4, true).allowed).toBe(true);
    expect(checkEntitlement('data_export', 0, true).allowed).toBe(true);
  });
});
