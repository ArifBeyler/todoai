import * as Notifications from "expo-notifications";

export const usePushNotifications = () => ({
  requestPermissions: async () => {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  },
});
