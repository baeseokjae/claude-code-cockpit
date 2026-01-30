/**
 * Usage API response types
 */

export interface UsageData {
  planName: string;
  fiveHour: number;
  sevenDay: number;
  fiveHourResetAt: string | null;
  sevenDayResetAt: string | null;
}
