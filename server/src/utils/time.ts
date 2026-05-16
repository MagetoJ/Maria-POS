
/**
 * Utility for handling Kenyan Time (UTC+3)
 */

export function getKenyanTime(): Date {
  const now = new Date();
  // Kenya is UTC+3
  return new Date(now.getTime() + (3 * 60 * 60 * 1000));
}

export function getKenyanHour(): number {
  const now = new Date();
  // UTC hour + 3, handle wrap around
  return (now.getUTCHours() + 3) % 24;
}

export function isPast8AMKenyanTime(): boolean {
  const hour = getKenyanHour();
  return hour >= 8;
}

export function getStartOfKenyanToday(): Date {
  const now = new Date();
  // Adjust to Kenyan time first
  const kenyanNow = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  kenyanNow.setUTCHours(0, 0, 0, 0);
  // Convert back to UTC for DB queries if necessary, 
  // but usually we want the UTC timestamp that corresponds to 00:00 EAT
  // 00:00 EAT is 21:00 UTC of previous day
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(21, 0, 0, 0);
  if (now.getUTCHours() < 21) {
    startOfToday.setUTCDate(startOfToday.getUTCDate() - 1);
  }
  return startOfToday;
}
