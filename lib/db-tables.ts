/**
 * Centralized database table names for Supabase.
 * Use these constants to prevent schema cache errors (PGRST205).
 */
export const TABLES = {
  NOTIFICATIONS: 'notifications',
  EMAIL_LOGS: 'email_logs',
  NOTIFICATION_PREFERENCES: 'notification_preferences',
  USERS: 'User', // Existing User table
  SUBMISSIONS: 'Submission', // Existing Submission table
  POINTS_HISTORY: 'PointsHistory', // Existing PointsHistory table
  REWARD: 'Reward', // Existing Reward table
  REWARD_REDEMPTION: 'RewardRedemption', // Existing RewardRedemption table
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];
