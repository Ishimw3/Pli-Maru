import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure default handler when app is running in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.DEFAULT,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function syncDailyReminder(
  enabled: boolean,
  time: { hour: number; minute: number }
) {
  if (Platform.OS === 'web') return;

  try {
    // Cancel existing daily notification before scheduling new one
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!enabled) return;

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Pli Maru',
        body: 'Moment pour votre habitude.',
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
      },
    });
  } catch {
    // Fail silently in non-supported environments
  }
}
