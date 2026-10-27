export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-sip', name: 'First Sip', description: 'Log your first drink.', icon: '💧' },
  { id: 'goal-getter', name: 'Goal Getter', description: 'Reach your daily target for the first time.', icon: '🎯' },
  { id: 'spread-out', name: 'Steady Sipper', description: 'Log drinks in at least 4 different hours of one day.', icon: '⏱️' },
  { id: 'early-bird', name: 'Early Bird', description: 'Log a drink before 9:00 in the morning.', icon: '🌅' },
  { id: 'streak-3', name: 'Three-Day Flow', description: 'Reach your goal 3 days in a row.', icon: '🌊' },
  { id: 'streak-7', name: 'Week of Waves', description: 'Reach your goal 7 days in a row.', icon: '🐬' },
  { id: 'streak-30', name: 'Ocean Habit', description: 'Reach your goal 30 days in a row.', icon: '🐳' },
  { id: 'week-warrior', name: 'Week Warrior', description: 'Reach your goal on 5 of the last 7 days.', icon: '🛡️' },
  { id: 'ten-liters', name: 'Ten Litres Logged', description: 'Track 10 L in total.', icon: '🪣' },
  { id: 'hundred-liters', name: 'Hundred Litres Logged', description: 'Track 100 L in total.', icon: '🏞️' },
];
