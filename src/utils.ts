// ISO-8601 filter i.e. 2022-W21
// Week number according to the ISO-8601 standard, weeks starting on Monday.
// The first week of the year is the week that contains that year's first Thursday (='First 4-day week').

export const getMondayOfWeek = (year: number, weekNumber: number): Date => {
  // First monday of week
  // Check which dow is jan first (0 sunday, 6 saturday)
  const janFirst = new Date(Date.UTC(year, 0, 1));
  let janFirstUTCDay = janFirst.getUTCDay();

  let firstWeekMonday = null;

  // check if week is longer than 4 days
  if (janFirstUTCDay > 0 && janFirstUTCDay <= 4) {
    // First week is this one, get monday
    firstWeekMonday = janFirst.setDate(2 - janFirstUTCDay);
  } else {
    // First week will be the next one, get monday
    janFirstUTCDay = janFirstUTCDay > 0 ? janFirstUTCDay : 7;
    firstWeekMonday = janFirst.setDate(9 - janFirstUTCDay);
  }

  // firstWeekMonday can be also in past year. Example first week monday of 2025 is december 30th 2024

  // Add 7 days for every week
  const weekMonday = firstWeekMonday + 7 * 86400000 * (weekNumber - 1);

  return new Date(weekMonday);
};
