const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WEEKDAYS_SHORT_TO_LONG = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
} as const;

function dateToIsoString(d: Date): string {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const mm = (month < 10 ? "0" : "") + month;
  const dd = (date < 10 ? "0" : "") + date;
  return `${year}-${mm}-${dd}`;
}

function dateFromIsoString(d: string): Date {
  // The suffix ensures that the date is treated as local time, not UTC
  return new Date(d + "T00:00:00");
}

function dateToLongNumericString(d: Date, twoDigit?: boolean): string {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  if (twoDigit) {
    const mm = (month < 10 ? "0" : "") + month;
    const dd = (date < 10 ? "0" : "") + date;
    return `${mm}/${dd}/${year}`;
  }
  return `${month}/${date}/${year}`;
}

function dateToShortNumericString(d: Date): string {
  const month = d.getMonth() + 1;
  const date = d.getDate();
  return `${month}/${date}`;
}

function dateToLongHumanString(date: Date): string {
  const year = date.getFullYear();
  const month = MONTHS_LONG[date.getMonth()];
  const day = date.getDate();
  const prefix =
    day === 1 || day === 21 || day === 31 ? "st"
    : day === 2 || day === 22 ? "nd"
    : day === 3 || day === 23 ? "rd"
    : "th";
  return `${month} ${day}${prefix}, ${year}`;
}

function dateToShortTimeString(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours < 12 ? "am" : "pm";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes < 10 ? "0" : ""}${minutes}${ampm}`;
}

function dateToLongWeekday(date: Date): string {
  return WEEKDAYS_LONG[date.getDay()];
}
function dateToShortWeekday(date: Date): string {
  return WEEKDAYS_LONG[date.getDay()].slice(0, 3);
}

/**
 * Compares two dates and returns a human-readable string describing the difference
 * (considering only difference in whole days).
 */
function dateDiffString(date1: Date, date2: Date): string {
  const diffTime = date1.getTime() - date2.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays > 0) {
    if (diffDays === 1) return "tomorrow";
    if (diffDays < 50) return `in ${diffDays} days`;
    return `in ${Math.round(diffDays / 30)} months`;
  } else {
    if (diffDays === -1) return "yesterday";
    if (diffDays > -50) return `${-diffDays} days ago`;
    if (diffDays > -600) return `${Math.round(-diffDays / 30)} months ago`;
    return `${Math.round(-diffDays / 365)} years ago`;
  }
}

function datetimeToHumanString(date: Date): string {
  return `${dateToLongHumanString(date)} at ${dateToShortTimeString(date)}`;
}

function datetimeToShortString(date: Date): string {
  return `${dateToLongNumericString(date)} ${dateToShortTimeString(date)}`;
}

function weekdayShortToLong(weekday: string): string {
  const w = weekday.toLowerCase() as keyof typeof WEEKDAYS_SHORT_TO_LONG;
  const long = WEEKDAYS_SHORT_TO_LONG[w];
  if (!long) throw new Error(`Invalid weekday short: ${weekday}`);
  return long;
}

export {
  dateDiffString,
  dateFromIsoString,
  dateToIsoString,
  dateToLongNumericString,
  dateToShortNumericString,
  dateToShortWeekday,
  dateToLongHumanString,
  dateToLongWeekday,
  datetimeToHumanString,
  datetimeToShortString,
  weekdayShortToLong,
};
