/**
 * Calculates a user's daily consecutive streak based on submission/upload dates.
 * 
 * Rules:
 * 1. Collect unique calendar dates (YYYY-MM-DD) from all user submissions (or uploads).
 * 2. If user uploaded today (YYYY-MM-DD):
 *    Start counting consecutive days backwards from today.
 * 3. Else if user uploaded yesterday (YYYY-MM-DD):
 *    Start counting consecutive days backwards from yesterday (active streak pending today's upload).
 * 4. Otherwise (user did not upload today AND did not upload yesterday):
 *    The streak is broken -> returns 0!
 */
export function calculateDailyStreak(submissionDates: (Date | string | number | null | undefined)[]): number {
  if (!submissionDates || submissionDates.length === 0) {
    return 0;
  }

  const activeDates = new Set<string>();

  for (const dateVal of submissionDates) {
    if (!dateVal) continue;
    try {
      let d: Date;
      if (typeof dateVal === "object" && dateVal !== null && "toDate" in (dateVal as any) && typeof (dateVal as any).toDate === "function") {
        d = (dateVal as any).toDate();
      } else {
        d = new Date(dateVal as any);
      }

      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        activeDates.add(`${year}-${month}-${day}`);
      }
    } catch {
      // Ignore invalid date formats
    }
  }

  if (activeDates.size === 0) {
    return 0;
  }

  const now = new Date();
  const getFormattedDate = (dt: Date) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = getFormattedDate(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getFormattedDate(yesterday);

  let checkDate: Date | null = null;

  if (activeDates.has(todayStr)) {
    checkDate = new Date(now);
  } else if (activeDates.has(yesterdayStr)) {
    checkDate = yesterday;
  } else {
    // User did not upload today AND did not upload yesterday -> streak resets to 0!
    return 0;
  }

  let streak = 0;
  while (checkDate) {
    const dateStr = getFormattedDate(checkDate);
    if (activeDates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
