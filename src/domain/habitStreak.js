function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateHabitStats(completionDates, referenceDate = new Date()) {
  const dateSet = new Set(completionDates || []);
  const todayStr = toDateKey(referenceDate);
  const isCompletedToday = dateSet.has(todayStr);

  let currentStreak = 0;
  let checkDate = new Date(referenceDate);

  if (!isCompletedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = toDateKey(checkDate);
    if (dateSet.has(key)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const sortedDates = Array.from(dateSet).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dateStr of sortedDates) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const currentDate = new Date(y, m - 1, d);

    if (prevDate) {
      const diffMs = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    prevDate = currentDate;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const last7Days = [];
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNamesAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    const dayOfWeek = d.getDay();

    last7Days.push({
      date: key,
      dayIndex: dayOfWeek,
      dayNameEn: dayNamesEn[dayOfWeek],
      dayNameAr: dayNamesAr[dayOfWeek],
      isCompleted: dateSet.has(key),
      isToday: i === 0
    });
  }

  return {
    currentStreak,
    longestStreak,
    isCompletedToday,
    last7Days
  };
}
