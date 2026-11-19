const INDIA_OFFSET_MS = 19_800_000;

/**
 * Winter snowfall runs from 15 November to the last day of February, by the
 * date in India (the same clock as the daily board). Outside this window the
 * effect and its toggle are not rendered, so nobody has to remember to remove it.
 */
export function isSnowSeason(now = new Date()) {
  const india = new Date(now.getTime() + INDIA_OFFSET_MS);
  const month = india.getUTCMonth() + 1;
  const day = india.getUTCDate();
  if (month === 11) return day >= 15;
  return month === 12 || month === 1 || month === 2;
}

const STORAGE_KEY = "trendxee-snow";

/** Visitor preference. Snow is on unless the visitor turned it off. */
export function readSnowPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function writeSnowPreference(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    /* storage unavailable: the choice still applies for this visit */
  }
}
