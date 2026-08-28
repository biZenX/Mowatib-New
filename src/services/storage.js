import { handleSubtaskToggle, handleParentStatusChange, TASK_STATUS, TASK_PRIORITY } from '../domain/taskRules.js';
import { generateOccurrences, applyOccurrenceEdit, applyOccurrenceDelete, EDIT_SCOPE, DELETE_SCOPE } from '../domain/recurrenceEngine.js';
import { checkEntitlement } from '../domain/entitlements.js';
import { calculateHabitStats } from '../domain/habitStreak.js';
import { reconstructPomodoroState, POMODORO_STATUS, POMODORO_MODE } from '../domain/pomodoroReconstruction.js';
import { notificationService } from './notifications.js';

const STORAGE_KEY_PREFIX = 'mowatib_v2_';

const DEFAULT_SETTINGS = {
  theme: 'light',
  language: 'ar',
  focusTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  sessionLength: 4,
  dailyGoalMinutes: 100,
  alarmSound: 'zen-bowl',
  alarmVolume: 80,
  vibration: true,
  notificationsEnabled: false,
  isPremium: false
};

const DEFAULT_LISTS = [
  { id: 'list_study', name: 'المواد الدراسية (Study)', color: '#4C662B', icon: 'school', position: 0, deleted_at: null },
  { id: 'list_personal', name: 'شخصي (Personal)', color: '#7C4DFF', icon: 'person', position: 1, deleted_at: null }
];

const DEFAULT_TAGS = [
  { id: 'tag_urgent', name: 'عاجل (Urgent)', color: '#BA1A1A' },
  { id: 'tag_exam', name: 'امتحانات (Exams)', color: '#4C662B' },
  { id: 'tag_project', name: 'مشروع (Project)', color: '#0288D1' }
];

const DEFAULT_TASKS = [];

const DEFAULT_HABITS = [];

const DEFAULT_NOTES = [];

class StorageService {
  constructor() {
    this.settings = this.load('settings', DEFAULT_SETTINGS);
    this.lists = this.load('lists', DEFAULT_LISTS);
    this.tags = this.load('tags', DEFAULT_TAGS);
    this.tasks = this.load('tasks', DEFAULT_TASKS);
    this.notes = this.load('notes', DEFAULT_NOTES);
    this.habits = this.load('habits', DEFAULT_HABITS);
    this.habitCompletions = this.load('habit_completions', {});
    this.activePomodoro = this.load('active_pomodoro', null);
    if (this.activePomodoro && (this.activePomodoro.planned_duration > 86400 || this.activePomodoro.planned_duration === 999999)) {
      this.activePomodoro = null;
      this.save('active_pomodoro', null);
    }
    this.pomodoroHistory = this.load('pomodoro_history', []);
    this.notifications = this.load('notifications', [
      {
        id: 'notif_welcome',
        title: 'مرحباً بك في مواظب! 🎉',
        body: 'ابدأ بتنظيم مهامك الدراسية وعاداتك وجلسات التركيز الآن.',
        timestamp: new Date().toISOString(),
        isRead: false
      }
    ]);
    
    this.purgeExpiredTrash();
    this.reconstructReminderSchedule();
  }

  load(key, defaultValue) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      console.error(`Failed to load ${key} from storage:`, e);
      return defaultValue;
    }
  }

  save(key, value) {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save ${key} to storage:`, e);
    }
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.save('settings', this.settings);
    return this.settings;
  }

  getLists() {
    return this.lists.filter(l => !l.deleted_at);
  }

  createList(name, color = '#4C662B', icon = 'list') {
    const activeLists = this.getLists();
    const check = checkEntitlement('lists', activeLists.length, this.settings.isPremium);
    if (!check.allowed) {
      throw new Error(check.errorKey);
    }

    const newList = {
      id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      color,
      icon,
      position: activeLists.length,
      created_at: new Date().toISOString(),
      deleted_at: null
    };

    this.lists.push(newList);
    this.save('lists', this.lists);
    return newList;
  }

  updateList(listId, patch) {
    this.lists = this.lists.map(l => l.id === listId ? { ...l, ...patch } : l);
    this.save('lists', this.lists);
  }

  deleteList(listId) {
    const now = new Date().toISOString();
    this.lists = this.lists.map(l => l.id === listId ? { ...l, deleted_at: now } : l);
    this.tasks = this.tasks.map(t => t.list_id === listId ? { ...t, list_id: null } : t);
    this.save('lists', this.lists);
    this.save('tasks', this.tasks);
  }

  getActiveTasks(listId = undefined) {
    return this.tasks.filter(t => {
      if (t.deleted_at) return false;
      if (listId === 'inbox') return t.list_id === null;
      if (listId !== undefined) return t.list_id === listId;
      return true;
    });
  }

  createTask(taskData) {
    const listId = taskData.list_id || null;
    const activeListTasks = this.tasks.filter(t => !t.deleted_at && t.list_id === listId && t.status !== TASK_STATUS.DONE);
    const check = checkEntitlement('tasks_per_list', activeListTasks.length, this.settings.isPremium);
    if (!check.allowed) {
      throw new Error(check.errorKey);
    }

    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      list_id: listId,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      priority: taskData.priority || TASK_PRIORITY.NONE,
      status: taskData.status || TASK_STATUS.TODO,
      due_date: taskData.due_date || null,
      due_time: taskData.due_time || null,
      position: this.tasks.length,
      tags: taskData.tags || [],
      subtasks: taskData.subtasks || [],
      reminders: taskData.reminders || [],
      recurrence: taskData.recurrence || null,
      created_at: new Date().toISOString(),
      deleted_at: null
    };

    if (newTask.subtasks.length > 0) {
      const subtaskCheck = checkEntitlement('subtasks', newTask.subtasks.length, this.settings.isPremium);
      if (!subtaskCheck.allowed) {
        throw new Error(subtaskCheck.errorKey);
      }
    }

    this.tasks.push(newTask);
    this.save('tasks', this.tasks);
    this.reconstructReminderSchedule();
    return newTask;
  }

  updateTask(taskId, patch) {
    this.tasks = this.tasks.map(t => {
      if (t.id === taskId) {
        let updated = { ...t, ...patch };
        if (patch.status && patch.status !== t.status) {
          const { updatedParentStatus, updatedSubtasks } = handleParentStatusChange(t, updated.subtasks || [], patch.status);
          updated.status = updatedParentStatus;
          updated.subtasks = updatedSubtasks;
        }
        return updated;
      }
      return t;
    });
    this.save('tasks', this.tasks);
    this.reconstructReminderSchedule();
  }

  toggleSubtask(taskId, subtaskId) {
    this.tasks = this.tasks.map(t => {
      if (t.id === taskId) {
        const { updatedSubtasks, updatedParentStatus } = handleSubtaskToggle(t, t.subtasks || [], subtaskId);
        return {
          ...t,
          subtasks: updatedSubtasks,
          status: updatedParentStatus
        };
      }
      return t;
    });
    this.save('tasks', this.tasks);
    this.reconstructReminderSchedule();
  }

  deleteTask(taskId) {
    const now = new Date().toISOString();
    this.tasks = this.tasks.map(t => t.id === taskId ? { ...t, deleted_at: now } : t);
    this.save('tasks', this.tasks);
    this.reconstructReminderSchedule();
  }

  getNotes() {
    return this.notes.filter(n => !n.deleted_at);
  }

  createNote(title = '', content = '') {
    const newNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      content,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null
    };
    this.notes.unshift(newNote);
    this.save('notes', this.notes);
    return newNote;
  }

  updateNote(noteId, patch) {
    this.notes = this.notes.map(n => n.id === noteId ? { ...n, ...patch, updated_at: new Date().toISOString() } : n);
    this.save('notes', this.notes);
  }

  deleteNote(noteId) {
    const now = new Date().toISOString();
    this.notes = this.notes.map(n => n.id === noteId ? { ...n, deleted_at: now } : n);
    this.save('notes', this.notes);
  }

  getHabits() {
    return this.habits.filter(h => !h.deleted_at);
  }

  createHabit(habitData) {
    const activeHabits = this.getHabits();
    const check = checkEntitlement('habits', activeHabits.length, this.settings.isPremium);
    if (!check.allowed) {
      throw new Error(check.errorKey);
    }

    const newHabit = {
      id: `habit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: habitData.title || 'Untitled Habit',
      icon: habitData.icon || 'star',
      color: habitData.color || '#4C662B',
      frequency: habitData.frequency || 'daily',
      target_days_per_week: habitData.target_days_per_week || 7,
      created_at: new Date().toISOString(),
      deleted_at: null
    };

    this.habits.push(newHabit);
    this.save('habits', this.habits);
    return newHabit;
  }

  updateHabit(habitId, patch) {
    this.habits = this.habits.map(h => h.id === habitId ? { ...h, ...patch } : h);
    this.save('habits', this.habits);
  }

  deleteHabit(habitId) {
    const now = new Date().toISOString();
    this.habits = this.habits.map(h => h.id === habitId ? { ...h, deleted_at: now } : h);
    this.save('habits', this.habits);
  }

  toggleHabitCompletion(habitId, dateStr = new Date().toISOString().split('T')[0]) {
    const completions = this.habitCompletions[habitId] || [];
    const exists = completions.includes(dateStr);
    let updated;
    if (exists) {
      updated = completions.filter(d => d !== dateStr);
    } else {
      updated = [...completions, dateStr];
    }
    this.habitCompletions = { ...this.habitCompletions, [habitId]: updated };
    this.save('habit_completions', this.habitCompletions);
    return !exists;
  }

  getHabitStats(habitId) {
    const completions = this.habitCompletions[habitId] || [];
    return calculateHabitStats(completions);
  }

  startPomodoro(mode = POMODORO_MODE.FOCUS, plannedDuration = 25 * 60, taskId = null) {
    let taskTitleSnapshot = null;
    if (taskId) {
      const task = this.tasks.find(t => t.id === taskId);
      taskTitleSnapshot = task ? task.title : 'Deleted Task';
    }

    const session = {
      id: `pomo_${Date.now()}`,
      mode,
      planned_duration: mode === POMODORO_MODE.INFINITE ? 0 : plannedDuration,
      elapsed_seconds: 0,
      status: POMODORO_STATUS.RUNNING,
      started_at: new Date().toISOString(),
      task_id: taskId,
      task_title_snapshot: taskTitleSnapshot
    };

    this.activePomodoro = session;
    this.save('active_pomodoro', this.activePomodoro);
    return session;
  }

  pausePomodoro() {
    if (!this.activePomodoro || this.activePomodoro.status !== POMODORO_STATUS.RUNNING) return;
    const reconstructed = reconstructPomodoroState(this.activePomodoro);
    this.activePomodoro = {
      ...this.activePomodoro,
      status: POMODORO_STATUS.PAUSED,
      elapsed_seconds: reconstructed.elapsedSeconds
    };
    this.save('active_pomodoro', this.activePomodoro);
  }

  resumePomodoro() {
    if (!this.activePomodoro || this.activePomodoro.status !== POMODORO_STATUS.PAUSED) return;
    this.activePomodoro = {
      ...this.activePomodoro,
      status: POMODORO_STATUS.RUNNING,
      started_at: new Date().toISOString()
    };
    this.save('active_pomodoro', this.activePomodoro);
  }

  completePomodoro() {
    if (!this.activePomodoro) return;
    const completedSession = {
      ...this.activePomodoro,
      status: POMODORO_STATUS.COMPLETED,
      completed_at: new Date().toISOString(),
      elapsed_seconds: this.activePomodoro.planned_duration
    };

    this.pomodoroHistory.unshift(completedSession);
    this.activePomodoro = null;
    this.save('active_pomodoro', null);
    this.save('pomodoro_history', this.pomodoroHistory);
  }

  resetPomodoro() {
    this.activePomodoro = null;
    this.save('active_pomodoro', null);
  }

  getActivePomodoroState() {
    return reconstructPomodoroState(this.activePomodoro);
  }

  getPomodoroHistory() {
    return this.pomodoroHistory;
  }

  getTrashItems() {
    const trashedTasks = this.tasks.filter(t => t.deleted_at).map(t => ({ ...t, itemType: 'task' }));
    const trashedLists = this.lists.filter(l => l.deleted_at).map(l => ({ ...l, itemType: 'list' }));
    const trashedNotes = this.notes.filter(n => n.deleted_at).map(n => ({ ...n, itemType: 'note' }));
    const trashedHabits = this.habits.filter(h => h.deleted_at).map(h => ({ ...h, itemType: 'habit' }));

    return [...trashedTasks, ...trashedLists, ...trashedNotes, ...trashedHabits].sort((a, b) => {
      return new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime();
    });
  }

  restoreItem(itemType, itemId) {
    if (itemType === 'task') {
      this.tasks = this.tasks.map(t => t.id === itemId ? { ...t, deleted_at: null } : t);
      this.save('tasks', this.tasks);
    } else if (itemType === 'list') {
      this.lists = this.lists.map(l => l.id === itemId ? { ...l, deleted_at: null } : l);
      this.save('lists', this.lists);
    } else if (itemType === 'note') {
      this.notes = this.notes.map(n => n.id === itemId ? { ...n, deleted_at: null } : n);
      this.save('notes', this.notes);
    } else if (itemType === 'habit') {
      this.habits = this.habits.map(h => h.id === itemId ? { ...h, deleted_at: null } : h);
      this.save('habits', this.habits);
    }
  }

  emptyTrash() {
    this.tasks = this.tasks.filter(t => !t.deleted_at);
    this.lists = this.lists.filter(l => !l.deleted_at);
    this.notes = this.notes.filter(n => !n.deleted_at);
    this.habits = this.habits.filter(h => !h.deleted_at);
    this.save('tasks', this.tasks);
    this.save('lists', this.lists);
    this.save('notes', this.notes);
    this.save('habits', this.habits);
  }

  purgeExpiredTrash() {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.tasks = this.tasks.filter(t => !t.deleted_at || new Date(t.deleted_at).getTime() > sevenDaysAgo);
    this.lists = this.lists.filter(l => !l.deleted_at || new Date(l.deleted_at).getTime() > sevenDaysAgo);
    this.notes = this.notes.filter(n => !n.deleted_at || new Date(n.deleted_at).getTime() > sevenDaysAgo);
    this.habits = this.habits.filter(h => !h.deleted_at || new Date(h.deleted_at).getTime() > sevenDaysAgo);
    this.save('tasks', this.tasks);
    this.save('lists', this.lists);
    this.save('notes', this.notes);
    this.save('habits', this.habits);
  }

  getNotifications() {
    return this.notifications;
  }

  addNotification(notif) {
    this.notifications.unshift(notif);
    this.save('notifications', this.notifications);
  }

  markAllNotificationsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
    this.save('notifications', this.notifications);
  }

  clearNotifications() {
    this.notifications = [];
    this.save('notifications', this.notifications);
  }

  reconstructReminderSchedule() {
    const activeTasks = this.tasks.filter(t => !t.deleted_at && t.status !== TASK_STATUS.DONE && t.due_date);
    notificationService.scheduleTaskReminders(activeTasks);
  }

  exportData(format = 'json') {
    const check = checkEntitlement('data_export', 0, this.settings.isPremium);
    if (!check.allowed) {
      throw new Error(check.errorKey);
    }

    const exportPayload = {
      version: '2.0.0',
      exported_at: new Date().toISOString(),
      lists: this.lists,
      tasks: this.tasks,
      notes: this.notes,
      habits: this.habits,
      habit_completions: this.habitCompletions,
      pomodoro_history: this.pomodoroHistory,
      settings: this.settings
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      return URL.createObjectURL(blob);
    } else {
      let csv = 'ID,Title,Status,Priority,Due Date,List\n';
      this.tasks.forEach(t => {
        const list = this.lists.find(l => l.id === t.list_id);
        const listName = list ? list.name : 'Inbox';
        csv += `"${t.id}","${(t.title || '').replace(/"/g, '""')}","${t.status}","${t.priority}","${t.due_date || ''}","${listName}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      return URL.createObjectURL(blob);
    }
  }

  deleteAccountAndData() {
    localStorage.clear();
    this.settings = DEFAULT_SETTINGS;
    this.lists = [];
    this.tasks = [];
    this.notes = [];
    this.habits = [];
    this.habitCompletions = {};
    this.activePomodoro = null;
    this.pomodoroHistory = [];
  }

  generateInitialStats() {
    return [];
  }
}

export const storageService = new StorageService();
if (typeof window !== 'undefined') {
  window._storageService = storageService;
}
