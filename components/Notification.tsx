import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';

// Request permissions and schedule the notification
export async function schedulePushNotification(title: string, reminderDate: Date) {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Permission required', 'Please enable notifications in your settings.');
      return;
    }

    if (!Device.isDevice) {
      return;
    }

    // Validate that the reminder date is in the future
    const now = new Date();
    if (reminderDate <= now) {
      Alert.alert('Invalid date', 'Please select a future date for the reminder.');
      return;
    }

    // Set up the Android channel if needed
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Calculate seconds from now until the reminder time
    const seconds = Math.floor((reminderDate.getTime() - now.getTime()) / 1000);
    
    if (seconds <= 0) {
      console.error('Invalid reminder time - must be in the future');
      Alert.alert('Error', 'Please select a time in the future.');
      return;
    }
    
    console.log(`Scheduling notification for: ${reminderDate.toLocaleString()}`);
    console.log(`Current time: ${now.toLocaleString()}`);
    console.log(`Will trigger in ${seconds} seconds`);

    // On Android, use seconds-from-now trigger
    // On iOS, use the date directly
    const trigger = Platform.OS === 'android' 
      ? { seconds, channelId: 'reminders' }
      : { date: reminderDate };
      
    console.log('Trigger configuration:', JSON.stringify(trigger));

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Reminder",
        body: title ? `Don't forget about: ${title}` : "You have a reminder!",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {})
      },
      trigger: trigger,
    });

    console.log(`Notification scheduled with ID: ${notificationId}`);
    
    // Verify the notification was scheduled correctly
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`Total scheduled notifications: ${scheduledNotifications.length}`);
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    Alert.alert('Error', 'Failed to set reminder. Please try again.');
    return null;
  }
}

export async function cancelPushNotification(notificationId: string) {
  try {
    console.log(`Canceling notification with ID: ${notificationId}`);
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    
    // Verify cancellation
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`After cancellation: ${scheduledNotifications.length} notifications remaining`);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}