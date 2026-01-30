/**
 * Time formatting utilities
 */

export function formatSessionDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m${remainingSeconds > 0 ? ` ${remainingSeconds}s` : ''}`;
  }

  return `${seconds}s`;
}

export function formatElapsed(startTime: Date, endTime?: Date): string {
  const end = endTime || new Date();
  const ms = end.getTime() - startTime.getTime();
  return formatSessionDuration(ms);
}
