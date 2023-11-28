import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, FlatList, StyleSheet, Button } from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Ficon from 'react-native-vector-icons/Feather';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { CheckBox } from 'react-native-elements';
import mainContext from '../context/maincontext';
import WelcomeScreen from './welcome';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Home = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { moveToBin, handleNoteCopy, loadNotes, notes, isLoading, setIsLoading } = useContext(mainContext);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsLoading(true);
      loadNotes();
    });
    return unsubscribe;
  }, [navigation]);
  const truncateText = (text, limit) => {
    if (text.split(' ').length > limit) {
      return text.split(' ').slice(0, limit).join(' ') + '...';
    }
    return text;
  };
  const handleNoteClick = (note) => {
    navigation.navigate('UpdateNote', { note });
  };
  // Filter notes based on search query
  const filteredNotes = notes.filter((note) => {
    const lowercaseHeadline = note.headline ? note.headline.toLowerCase() : '';
    return lowercaseHeadline.includes(searchQuery.toLowerCase());
  });

  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    async function checkWelcomeStatus() {
      try {
        const value = await AsyncStorage.getItem('@app:welcomed');
        if (value !== null) {
          setShowWelcome(false);
          console.log('value', value, 'set')
        }
      } catch (error) {
        console.error('Error checking welcome status:', error);
      }
    }
    checkWelcomeStatus();
  }, []);

  const markWelcomeSeen = async () => {
    try {
      await AsyncStorage.setItem('@app:welcomed', 'true');
      console.log('Welcome screen marked as seen.');
    } catch (error) {
      console.error('Error marking welcome as seen:', error);
    }
    setShowWelcome(false)
  };


  const renderItem = ({ item }) => {
    const parsedTodoList = item.todoList ? JSON.parse(item.todoList) : [];
    return (
      <TouchableOpacity
        onPress={() => handleNoteClick(item)}
      >
        <View style={parsedTodoList.length > 0 ? ToDoStyle : styles.noteContainer}>
          {item.headline === '' ? null : <Text style={styles.noteTitle}>{item.headline}</Text>}
          {parsedTodoList.length > 0 ? (
            parsedTodoList.map((todoItem, todoIndex) => (
              <View style={styles.todoItem} key={todoIndex}>
                {todoItem.completed ?
                  (<CheckBox
                    checked={true}
                    checkedColor="#fff"
                    size={16}
                    right={true}
                    containerStyle={{ margin: 4, padding: 0 }}
                    wrapperStyle={{ margin: 0, padding: 0 }}
                    textStyle={{ margin: 0, padding: 0 }}
                  />)
                  :
                  (<CheckBox
                    checked={false}
                    checkedColor="#fff"
                    size={16}
                    right={true}
                    containerStyle={{ margin: 4, padding: 0 }}
                    wrapperStyle={{ margin: 0, padding: 0 }}
                    textStyle={{ margin: 0, padding: 0 }}
                  />)
                }
                <Text style={styles.todoText}>{todoItem.text}</Text>
              </View>
            ))
          ) : (
            item.text === '' ? null : <Text style={styles.noteText}>{truncateText(item.text, 30)}</Text>

          )}
        </View>
        <View style={styles.contextMenu}>
          <Menu>
            <MenuTrigger style={{ padding: 5 }}>
              <Ionicons name="ellipsis-vertical-outline" size={22} color="#fff" />
            </MenuTrigger>
            <MenuOptions customStyles={{ optionsContainer: { backgroundColor: '#333', borderRadius: 3, borderWidth: 0.2, borderColor: '#fff', paddingHorizontal: 5 } }}>
              <MenuOption onSelect={() => handleNoteClick(item)}>
                <Text style={{ color: '#fff', paddingVertical: 3, marginVertical: 2 }}>Edit</Text>
              </MenuOption>
              <View style={{ height: 0.5, backgroundColor: '#707070', }} />
              <MenuOption onSelect={() => (moveToBin(item.id))}>
                <Text style={{ color: '#fff', paddingVertical: 3, marginTop: 2 }}>Move to Bin</Text>
              </MenuOption>
              <View style={{ height: 0.5, backgroundColor: '#707070', }} />
              <MenuOption onSelect={() => handleNoteCopy(item)}>
                <Text style={{ color: '#fff', paddingVertical: 3, marginVertical: 2 }}>Copy Note</Text>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>
      </TouchableOpacity>
    );
  };


  const keyExtractor = (item, index) => {
    return item.id ? item.id.toString() : index.toString();
  };
  if (showWelcome) {
    return <WelcomeScreen onWelcomeSeen={markWelcomeSeen}/>
  }
  else {


    return (
      <View style={{ flexGrow: 1, paddingVertical: 20, paddingHorizontal: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#3a3b3d', borderRadius: 17, paddingHorizontal: 10 }}>
          <Icon name="search1" size={26} color="#fff" style={{ marginHorizontal: 4 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder=" Search notes..."
            style={styles.searchInput}
            placeholderTextColor={'grey'}
          />
          <TouchableOpacity onPress={() => navigation.navigate('Setting')} style={{ marginRight: 6 }}>
            <Ionicons name="settings-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={{ marginVertical: 15 }}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Icon name="loading1" size={20} color="#000" />
            </View>
          ) :
            (filteredNotes.length === 0 ? (
              <Text style={styles.noNotesText}>No notes</Text>
            ) : (
              <FlatList
                data={filteredNotes}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                ListFooterComponent={<View style={{ marginBottom: 70 }} />}
                style={{ height: 750 }}
              />
            ))}
        </View>
        <View style={{
          position: 'absolute',
          bottom: 40,
          right: 20,
          height: 35,
          flexDirection: 'row',
          justifyContent: 'space-start',
          alignItems: 'center',
        }}>

          <TouchableOpacity
            onPress={() => navigation.navigate('AddNote')}
            style={{
              width: 135,
              height: 55,
              borderRadius: 30,
              backgroundColor: '#2a447f',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 3,
              elevation: 4,
              flexDirection: 'row',
              justifyContent: 'space-start',
              alignItems: 'center',
              paddingHorizontal: 10,
              marginHorizontal: 2
            }}
          >
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 8, marginRight: 8 }}>
              <Icon name="plus" size={24} color="#5e5cca" />
            </View>
            <Text style={{ color: '#fff', marginLeft: 5 }}>Add Note</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddNote', { todoByDef: true })}
            style={{
              width: 57,
              height: 55,
              borderRadius: 30,
              backgroundColor: '#2a447f',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 3,
              elevation: 4,
              flexDirection: 'row',
              justifyContent: 'space-start',
              alignItems: 'center',
              paddingHorizontal: 10,
              marginHorizontal: 2

            }}
          >
            <View style={{ backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 6 }}>
              <Ficon name="check-square" size={25} color="#000" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

    );
  }
};

const ToDoStyle = {
  borderWidth: 0.2,
  borderColor: '#aaa',
  padding: 10,
  marginVertical: 4,
  marginHorizontal: 12,
  borderRadius: 5,
  backgroundColor: '#00000000',
  paddingVertical: 8,
  paddingHorizontal: 15,
  overflow: 'auto',
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ccc',
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 17,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginHorizontal: 8,
  },
  searchInput: {
    fontSize: 18,
    flex: 1,
    color: '#FFF',
  },
  searchInputPlaceholderColor: '#CCC',
  contentContainer: {
    marginVertical: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noNotesText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#CCC',
    marginTop: 20,
  },
  noteContainer: {
    borderWidth: 0,
    padding: 10,
    marginVertical: 4,
    marginHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 15,
    overflow: 'auto',
  },
  noteTitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 4
  },
  noteText: {
    color: '#CCC',
    marginBottom: 10,
    marginTop: 10,
    marginLeft: 7,
    fontSize: 16
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
  },
  todoText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 2
  },
  contextMenu: {
    position: 'absolute',
    top: 12,
    right: 17,
  },
  menuOptionText: {
    color: '#000',
    paddingVertical: 3,
    marginTop: 2,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    height: 35,
    flexDirection: 'row',
    justifyContent: 'space-start',
    alignItems: 'center',
  },
  addButton: {
    width: 135,
    height: 55,
    borderRadius: 30,
    backgroundColor: '#282828',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'space-start',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginHorizontal: 2,
  },
  addButtonIconContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    marginRight: 8,
  },
  addButtonIconColor: '#5e5cca',
  addButtonText: {
    color: '#fff',
    marginLeft: 5,
  },
  checkButton: {
    width: 57,
    height: 55,
    borderRadius: 30,
    backgroundColor: '#282828',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'space-start',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginHorizontal: 2,
  },
  checkButtonIconContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  checkButtonIconColor: '#000',
});
export default Home;

