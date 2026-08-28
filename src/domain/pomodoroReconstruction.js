export const POMODORO_STATUS = {
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const POMODORO_MODE = {
  FOCUS: 'focus',
  SHORT_BREAK: 'short_break',
  LONG_BREAK: 'long_break',
  INFINITE: 'infinite'
};

export function reconstructPomodoroState(session, currentTime = new Date()) {
  if (!session) {
    return {
      status: POMODORO_STATUS.PAUSED,
      elapsedSeconds: 0,
      remainingSeconds: 25 * 60,
      isFinished: false,
      mode: POMODORO_MODE.FOCUS,
      taskId: null,
      taskTitleSnapshot: null
    };
  }

  const plannedDuration = session.planned_duration || (25 * 60);
  const mode = session.mode || POMODORO_MODE.FOCUS;
  const taskId = session.task_id || null;
  const taskTitleSnapshot = session.task_title_snapshot || null;

  if (session.status === POMODORO_STATUS.COMPLETED) {
    return {
      status: POMODORO_STATUS.COMPLETED,
      elapsedSeconds: plannedDuration,
      remainingSeconds: 0,
      isFinished: true,
      mode,
      taskId,
      taskTitleSnapshot
    };
  }

  if (session.status === POMODORO_STATUS.PAUSED || session.status === POMODORO_STATUS.CANCELLED) {
    if (mode === POMODORO_MODE.INFINITE) {
      return {
        status: session.status,
        elapsedSeconds: session.elapsed_seconds || 0,
        remainingSeconds: 0,
        isFinished: false,
        mode,
        taskId,
        taskTitleSnapshot
      };
    }
    const elapsed = Math.min(session.elapsed_seconds || 0, plannedDuration);
    return {
      status: session.status,
      elapsedSeconds: elapsed,
      remainingSeconds: Math.max(0, plannedDuration - elapsed),
      isFinished: false,
      mode,
      taskId,
      taskTitleSnapshot
    };
  }

  const startedAt = new Date(session.started_at).getTime();
  const now = currentTime.getTime();
  const diffSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const priorElapsed = session.elapsed_seconds || 0;
  const totalElapsed = priorElapsed + diffSeconds;

  if (mode === POMODORO_MODE.INFINITE) {
    return {
      status: POMODORO_STATUS.RUNNING,
      elapsedSeconds: totalElapsed,
      remainingSeconds: 0,
      isFinished: false,
      mode,
      taskId,
      taskTitleSnapshot
    };
  }

  if (totalElapsed >= plannedDuration) {
    return {
      status: POMODORO_STATUS.COMPLETED,
      elapsedSeconds: plannedDuration,
      remainingSeconds: 0,
      isFinished: true,
      mode,
      taskId,
      taskTitleSnapshot
    };
  }

  return {
    status: POMODORO_STATUS.RUNNING,
    elapsedSeconds: totalElapsed,
    remainingSeconds: plannedDuration - totalElapsed,
    isFinished: false,
    mode,
    taskId,
    taskTitleSnapshot
  };
}
