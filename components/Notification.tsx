import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert } from 'react-native';

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
  
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Reminder",
          body: title ? `Don't forget about: ${title}` : "You have a reminder!",
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: reminderDate,
        },
      });
  
  
      // Return the notification ID so it can be stored
      return notificationId;
  
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }
  

export async function cancelPushNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }