export const motivationalQuotes = [
  "Consistency beats talent when talent does not work hard.",
  "The secret to getting ahead is getting started.",
  "Success is the sum of small efforts repeated day after day.",
  "Don't watch the clock; do what it does. Keep going.",
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "Hard work beats talent when talent doesn't work hard.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The only impossible journey is the one you never begin.",
  "It does not matter how slowly you go as long as you do not stop.",
  "The expert in anything was once a beginner.",
  "Dream big, start small, act now.",
  "Discipline is the bridge between goals and accomplishment.",
  "Your only limit is your mind.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Focus on progress, not perfection.",
  "Every expert was once a beginner. Every pro was once an amateur.",
  "The pain of discipline is nothing compared to the pain of regret.",
  "Success doesn't come from what you do occasionally, it comes from what you do consistently.",
  "A little progress each day adds up to big results.",
  "The harder you work, the luckier you get.",
  "Don't limit your challenges, challenge your limits.",
  "Today's effort is tomorrow's success.",
  "Small steps every day lead to big achievements.",
  "Be stronger than your excuses.",
  "The difference between ordinary and extraordinary is that little extra.",
  "Your future is created by what you do today, not tomorrow.",
  "Stay focused and never give up.",
  "Knowledge is power. Practice is mastery.",
];

export const dailyReminders = [
  "Finish one difficult topic today.",
  "Review your weak areas for 30 minutes.",
  "Practice at least 10 PYQs today.",
  "Take breaks to stay fresh and focused.",
  "Revise yesterday's topics before starting new ones.",
  "Stay hydrated and take care of your health.",
  "Quality of study matters more than quantity.",
  "Challenge yourself with a hard problem today.",
  "Teach someone what you learned yesterday.",
  "Trust the process and keep moving forward.",
];

export function getQuoteOfTheDay(): string {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return motivationalQuotes[dayOfYear % motivationalQuotes.length];
}

export function getDailyReminder(): string {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return dailyReminders[dayOfYear % dailyReminders.length];
}

export function getMilestoneMessage(percentage: number): { message: string; emoji: string } {
  if (percentage >= 100) {
    return { message: "Amazing work! You've completed your preparation!", emoji: "🏆" };
  } else if (percentage >= 75) {
    return { message: "Final push! You're almost there!", emoji: "🚀" };
  } else if (percentage >= 50) {
    return { message: "Halfway there! Keep up the momentum!", emoji: "💪" };
  } else if (percentage >= 25) {
    return { message: "Good start! You're building great habits!", emoji: "✨" };
  } else if (percentage > 0) {
    return { message: "Every journey begins with a single step!", emoji: "🌱" };
  }
  return { message: "Start your journey today!", emoji: "🎯" };
}
