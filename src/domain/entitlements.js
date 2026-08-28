export const ENTITLEMENT_LIMITS = {
  FREE: {
    MAX_LISTS: 9,
    MAX_ACTIVE_TASKS_PER_LIST: 99,
    MAX_SUBTASKS_PER_TASK: 19,
    MAX_REMINDERS_PER_TASK: 2,
    MAX_HABITS: 5,
    HAS_ADVANCED_STATS: false,
    CAN_EXPORT_DATA: false,
    MAX_ATTACHMENT_QUOTA_MB: 0
  },
  PREMIUM: {
    MAX_LISTS: 299,
    MAX_ACTIVE_TASKS_PER_LIST: 999,
    MAX_SUBTASKS_PER_TASK: 199,
    MAX_REMINDERS_PER_TASK: 5,
    MAX_HABITS: 299,
    HAS_ADVANCED_STATS: true,
    CAN_EXPORT_DATA: true,
    MAX_ATTACHMENT_QUOTA_MB: 2048
  }
};

export function getLimits(isPremium) {
  return isPremium ? ENTITLEMENT_LIMITS.PREMIUM : ENTITLEMENT_LIMITS.FREE;
}

export function checkEntitlement(capability, currentCount, isPremium) {
  const limits = getLimits(isPremium);

  switch (capability) {
    case 'lists': {
      const allowed = currentCount < limits.MAX_LISTS;
      return { allowed, max: limits.MAX_LISTS, current: currentCount, errorKey: 'limit_lists_reached' };
    }
    case 'tasks_per_list': {
      const allowed = currentCount < limits.MAX_ACTIVE_TASKS_PER_LIST;
      return { allowed, max: limits.MAX_ACTIVE_TASKS_PER_LIST, current: currentCount, errorKey: 'limit_tasks_reached' };
    }
    case 'subtasks': {
      const allowed = currentCount < limits.MAX_SUBTASKS_PER_TASK;
      return { allowed, max: limits.MAX_SUBTASKS_PER_TASK, current: currentCount, errorKey: 'limit_subtasks_reached' };
    }
    case 'reminders': {
      const allowed = currentCount < limits.MAX_REMINDERS_PER_TASK;
      return { allowed, max: limits.MAX_REMINDERS_PER_TASK, current: currentCount, errorKey: 'limit_reminders_reached' };
    }
    case 'habits': {
      const allowed = currentCount < limits.MAX_HABITS;
      return { allowed, max: limits.MAX_HABITS, current: currentCount, errorKey: 'limit_habits_reached' };
    }
    case 'data_export': {
      return { allowed: limits.CAN_EXPORT_DATA, max: 1, current: 0, errorKey: 'premium_feature_export' };
    }
    case 'advanced_stats': {
      return { allowed: limits.HAS_ADVANCED_STATS, max: 1, current: 0, errorKey: 'premium_feature_stats' };
    }
    default:
      return { allowed: true, max: 999999, current: currentCount };
  }
}
