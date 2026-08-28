export const RECURRENCE_FREQ = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom'
};

export const RECURRENCE_END = {
  NEVER: 'never',
  COUNT: 'count',
  DATE: 'date'
};

export const EDIT_SCOPE = {
  THIS_OCCURRENCE: 'this_occurrence',
  THIS_AND_FUTURE: 'this_and_future',
  ALL_OCCURRENCES: 'all_occurrences'
};

export const DELETE_SCOPE = {
  THIS_OCCURRENCE: 'this_occurrence',
  THIS_AND_FUTURE: 'this_and_future',
  ALL_OCCURRENCES: 'all_occurrences'
};

export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateOccurrences(rule, startDate, startTime = null, maxGenerateCount = 60) {
  const occurrences = [];
  const startParts = startDate.split('-').map(Number);
  let currentDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  
  const interval = Math.max(1, rule.interval || 1);
  const targetCount = rule.end_type === RECURRENCE_END.COUNT ? (rule.end_count || 1) : maxGenerateCount;
  const endDateLimit = rule.end_type === RECURRENCE_END.DATE && rule.end_date ? new Date(rule.end_date) : null;

  let count = 0;

  while (count < targetCount && count < maxGenerateCount) {
    if (endDateLimit && currentDate > endDateLimit) {
      break;
    }

    occurrences.push({
      id: `occ_${Date.now()}_${count}_${Math.random().toString(36).substring(2, 7)}`,
      rule_id: rule.id,
      task_id: rule.task_id,
      scheduled_date: formatDate(currentDate),
      scheduled_time: startTime,
      status: 'todo',
      completed_at: null,
      timezone: rule.timezone || 'Africa/Cairo',
      occurrence_index: count,
      deleted_at: null
    });

    count++;

    if (rule.frequency === RECURRENCE_FREQ.DAILY) {
      currentDate.setDate(currentDate.getDate() + interval);
    } else if (rule.frequency === RECURRENCE_FREQ.WEEKLY) {
      currentDate.setDate(currentDate.getDate() + (7 * interval));
    } else if (rule.frequency === RECURRENCE_FREQ.MONTHLY) {
      currentDate.setMonth(currentDate.getMonth() + interval);
    } else {
      currentDate.setDate(currentDate.getDate() + interval);
    }
  }

  return occurrences;
}

export function applyOccurrenceEdit(occurrences, targetOccurrenceId, patchData, scope) {
  const targetIndex = occurrences.findIndex(o => o.id === targetOccurrenceId);
  if (targetIndex === -1) return occurrences;

  return occurrences.map((occ, idx) => {
    if (scope === EDIT_SCOPE.ALL_OCCURRENCES) {
      return { ...occ, ...patchData };
    }
    if (scope === EDIT_SCOPE.THIS_AND_FUTURE) {
      if (idx >= targetIndex) {
        return { ...occ, ...patchData };
      }
      return occ;
    }
    if (scope === EDIT_SCOPE.THIS_OCCURRENCE) {
      if (idx === targetIndex) {
        return { ...occ, ...patchData, is_exception: true };
      }
      return occ;
    }
    return occ;
  });
}

export function applyOccurrenceDelete(occurrences, targetOccurrenceId, scope) {
  const targetIndex = occurrences.findIndex(o => o.id === targetOccurrenceId);
  if (targetIndex === -1) return occurrences;

  const now = new Date().toISOString();

  return occurrences.map((occ, idx) => {
    if (scope === DELETE_SCOPE.ALL_OCCURRENCES) {
      return { ...occ, deleted_at: now };
    }
    if (scope === DELETE_SCOPE.THIS_AND_FUTURE) {
      if (idx >= targetIndex) {
        return { ...occ, deleted_at: now };
      }
      return occ;
    }
    if (scope === DELETE_SCOPE.THIS_OCCURRENCE) {
      if (idx === targetIndex) {
        return { ...occ, deleted_at: now };
      }
      return occ;
    }
    return occ;
  });
}
