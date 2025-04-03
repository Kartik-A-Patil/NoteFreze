import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { useEffect, useState, useRef, useContext } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { router, Stack } from 'expo-router';
import 'react-native-reanimated';
import { PaperProvider, Snackbar } from 'react-native-paper';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MenuProvider } from 'react-native-popup-menu';
import { TouchableOpacity, Text, View, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ContextProvider from '@/context/mainContext';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import {StatusBar} from 'expo-status-bar';
import Context from '@/context/createContext';

// Configure the notification handler at the top level - before any component code
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Additional setup for Android channels
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
  
  Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.HIGH, 
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

export default function RootLayout() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    DotFont: require('../assets/fonts/nothing-font.ttf'),
    TraceFont: require('../assets/fonts/TraceFont.ttf'),
    scoreboard: require('../assets/fonts/scoreboard.ttf'),
    PTMono: require('../assets/fonts/PTMono.ttf'),
    Ndot: require('../assets/fonts/ndot.ttf'),
    RobotoMono: require('../assets/fonts/RobotoMono.ttf'),
  });


  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const registerForPushNotifications = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) setExpoPushToken(token);
    };

    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
    });

    return () => {
      notificationListener.current && Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current && Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  if (!loaded) {
    return null; // Wait for fonts to load
  }

  return (
    <ContextProvider>
      <MainLayout />
    </ContextProvider>
  );
}
const MainLayout = () => {
  const colorScheme = useColorScheme();
  const { visible, onDismissSnackBar, SnackBarAction, SnackBarMsg } = useContext(Context);

  return (
    <ThemeProvider value={DarkTheme}>
      <PaperProvider>
        <MenuProvider>
          <StatusBar style='light' />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: colorScheme === 'dark' ? '#000' : '#000',
              },
              headerTintColor: colorScheme === 'dark' ? '#fff' : '#fff',
              headerRight: () => (
                <TouchableOpacity style={{ marginRight: 15 }} onPress={() => router.navigate('/setting')}>
                  <Ionicons name="settings-outline" size={26} color={colorScheme === 'dark' ? '#fff' : '#fff'} />
                </TouchableOpacity>
              ),
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                headerTitle: 'NoteFreze',
                headerTitleStyle: { fontSize: 22, fontFamily: 'Ndot' },
                headerBackVisible: false // Add this line to hide the back button
              }}
            />
            <Stack.Screen name="note/[noteId]" options={{ headerTitle: '' }} />
            <Stack.Screen name="setting" options={{ headerTitle: '', headerRight: () => null }} />
            <Stack.Screen name="bin" options={{ headerTitle: '', headerRight: () => null }} />
          </Stack>
          <Snackbar
            visible={visible}
            onDismiss={onDismissSnackBar}
            style={{ backgroundColor: '#fff' }}
            duration={3000}
           >
            <Text style={{color:'#000'}}>
              {SnackBarMsg}
            </Text>
          </Snackbar>
        </MenuProvider>
      </PaperProvider>
    </ThemeProvider>
  )
}
// Function to register for push notifications
async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
    paddingTop: 100
  },
  logo: {
    fontSize: 20,
    fontFamily: 'Ndot',
    color: '#fff',
    marginBottom: 15
  },
  Text: {
    color: '#888',
    fontSize: 18,
  },
  retryButton: {
    padding: 10,
    borderRadius: 5,
    position: 'absolute',
    top: '50%',

  },
  retryButtonText: {
    color: '#fff',
    fontSize: 18,

  },
});
