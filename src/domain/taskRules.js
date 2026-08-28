export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done'
};

export const TASK_PRIORITY = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

export function handleSubtaskToggle(parentTask, subtasks, subtaskIdToToggle) {
  const updatedSubtasks = subtasks.map(st => {
    if (st.id === subtaskIdToToggle) {
      return { ...st, is_completed: !st.is_completed };
    }
    return st;
  });

  const total = updatedSubtasks.length;
  const completedCount = updatedSubtasks.filter(st => st.is_completed).length;

  let newParentStatus = parentTask.status;

  if (total > 0 && completedCount === total) {
    newParentStatus = TASK_STATUS.DONE;
  } else if (parentTask.status === TASK_STATUS.DONE && completedCount < total) {
    newParentStatus = TASK_STATUS.IN_PROGRESS;
  } else if (parentTask.status === TASK_STATUS.TODO && completedCount > 0) {
    newParentStatus = TASK_STATUS.IN_PROGRESS;
  }

  return {
    updatedSubtasks,
    updatedParentStatus: newParentStatus
  };
}

export function handleParentStatusChange(parentTask, subtasks, newStatus) {
  let updatedParentStatus = newStatus;
  let updatedSubtasks = [...subtasks];

  if (newStatus === TASK_STATUS.DONE) {
    updatedSubtasks = subtasks.map(st => ({ ...st, is_completed: true }));
  } else if (parentTask.status === TASK_STATUS.DONE && (newStatus === TASK_STATUS.TODO || newStatus === TASK_STATUS.IN_PROGRESS)) {
    updatedParentStatus = TASK_STATUS.IN_PROGRESS;
    updatedSubtasks = subtasks.map(st => ({ ...st, is_completed: false }));
  }

  return {
    updatedParentStatus,
    updatedSubtasks
  };
}

export function isTaskOverdue(dueDate, dueTime, status, now = new Date()) {
  if (!dueDate || status === TASK_STATUS.DONE) return false;
  
  const dateParts = dueDate.split('-').map(Number);
  let dueDateTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

  if (dueTime) {
    const [hours, mins] = dueTime.split(':').map(Number);
    dueDateTime.setHours(hours, mins, 0, 0);
  } else {
    dueDateTime.setHours(23, 59, 59, 999);
  }

  return now > dueDateTime;
}
