import * as Notifications from "expo-notifications";

export const scheduleLocalNotification = async (
  title: string,
  body: string,
  triggerAt?: Date,
) => {
  const triggerDate = triggerAt && triggerAt > new Date() ? triggerAt : new Date(Date.now() + 3000);

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return true;
};
