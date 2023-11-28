import React, { useState, useContext, useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import AddNote from './components/addnote';
import HomeScreen from './components/home'
import Setting from './components/setting';
import UpdateNoteScreen from './components/update';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MenuProvider } from 'react-native-popup-menu';
const Stack = createNativeStackNavigator();
import ContextProvider from './context/MainContextProvider';
import Toast from './components/toast';
import BinScreen from './components/bin';
import mainContext from './context/maincontext';


const App = () => {
  return (
    <ContextProvider>
      <InnerComponent />
    </ContextProvider>
  );
};

const InnerComponent = () => {

  const { toastMassage, toastFunction, moveToBin, restoreFromBin, restoreAllFromBin, moveAllNotesToBin, setToastVisible, toastVisible } = useContext(mainContext);
  const Theme = { "colors": { "background": "rgb(27,27,29)", "border": "rgb(39, 39, 41)", "card": "rgb(18, 18, 18)", "notification": "rgb(255, 69, 58)", "primary": "rgb(10, 132, 255)", "text": "rgb(229, 229, 231)" }, "dark": true }
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer theme={Theme}>
        <MenuProvider>
          <Stack.Navigator
            screenOptions={() => ({
              headerStyle: {
                backgroundColor: 'rgb(27,27,29)',
                elevation: 0, // Remove box shadow on Android
                shadowOpacity: 0, // Remove box shadow on iOS
              },
              headerTintColor: 'white',
              headerTitleStyle: {
                fontSize: 22
              },
            })}
          >
            
            
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen name="AddNote" component={AddNote} options={{ title: '' }} />
            <Stack.Screen name="UpdateNote" component={UpdateNoteScreen} options={{ title: '' }} />

            <Stack.Screen name="Setting" component={Setting} options={{ title: 'Setting' }} />
            <Stack.Screen name="Bin" component={BinScreen} options={{ title: 'Bin' }} />
          </Stack.Navigator>
        </MenuProvider>
        <Toast
          message={toastMassage}
          visible={toastVisible}
          onClose={() => {
            switch (toastFunction.name) {
              case 'moveToBin':
                moveToBin(toastFunction.noteId);
                setToastVisible(false);
                break;
              case 'restoreFromBin':
                restoreFromBin(toastFunction.noteId)
                setToastVisible(false);
                break;
              case 'restoreAllFromBin':
                restoreAllFromBin();
                setToastVisible(false);
                break;
              case 'moveAllNotesToBin':
                moveAllNotesToBin();
                setToastVisible(false);
                break;
              default:
                setToastVisible(false);
            }
          }}
          btnvisible={toastFunction.name === '' ? false : true}
        />
      </NavigationContainer>
    </View>
  );
};

export default App;
