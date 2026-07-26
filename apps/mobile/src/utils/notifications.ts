import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type Cadence = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface NotificationRule {
  id: string;
  habitId: string | null;
  habit?: { id: string; name: string } | null;
  cadence: Cadence;
  hour: number;
  minute: number;
  enabled: boolean;
}

function bodyForRule(rule: NotificationRule): string {
  if (rule.habit) return `Don't forget: ${rule.habit.name}`;
  switch (rule.cadence) {
    case "DAILY":
      return "Time for your daily check-in.";
    case "WEEKLY":
      return "How did this week go? Log your habits.";
    case "MONTHLY":
      return "Wrap up the month — check your habits.";
    case "YEARLY":
      return "Reflect on the year — check your habits.";
  }
}

// Native MONTHLY triggers fire on a fixed day-of-month and silently skip any
// month shorter than that (day 31 never fires in February), so "end of
// month" can't be a repeating native trigger — instead we compute the real
// last day of the current (or next, if already past) month and schedule a
// one-off DATE trigger. syncScheduledNotifications reschedules this on every
// app open, so it self-heals as long as the app opens at least once between
// month-ends.
function nextEndOfMonth(hour: number, minute: number): Date {
  const now = new Date();
  let candidate = new Date(now.getFullYear(), now.getMonth() + 1, 0, hour, minute, 0);
  if (candidate <= now) {
    candidate = new Date(now.getFullYear(), now.getMonth() + 2, 0, hour, minute, 0);
  }
  return candidate;
}

// Cancels every locally scheduled notification and reschedules from the
// current rule set — simplest way to keep the OS schedule in sync without
// tracking individual notification IDs against rule edits/deletes.
export async function syncScheduledNotifications(rules: NotificationRule[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const rule of rules) {
    if (!rule.enabled) continue;
    const content = { title: "New Me", body: bodyForRule(rule) };

    if (rule.cadence === "DAILY") {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: rule.hour,
          minute: rule.minute,
        },
      });
    } else if (rule.cadence === "WEEKLY") {
      // weekday 1 = Sunday — last day of the Monday-start week used elsewhere in this app
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1,
          hour: rule.hour,
          minute: rule.minute,
        },
      });
    } else if (rule.cadence === "YEARLY") {
      // Dec 31 always exists, so this can be a real repeating native trigger
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.YEARLY,
          month: 11,
          day: 31,
          hour: rule.hour,
          minute: rule.minute,
        },
      });
    } else if (rule.cadence === "MONTHLY") {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: nextEndOfMonth(rule.hour, rule.minute),
        },
      });
    }
  }
}
