import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, BackHandler, FlatList } from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import { CheckBox } from 'react-native-elements';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/AntDesign';
import EIcon from 'react-native-vector-icons/Entypo';
import { useFocusEffect } from '@react-navigation/native';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
const db = SQLite.openDatabase({ name: 'notes.db', location: 'default' });

const AddNote = ({ route, navigation }) => {
  const { todoByDef } = route.params || false;
  const [headline, setHeadline] = useState('');
  const [text, setText] = useState('');
  const [isTodo, setIsTodo] = useState(todoByDef);
  const [todoList, setTodoList] = useState([{ text: '', completed: false }, { id: 'button', title: 'Button' }]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.contextMenu}>
          <Menu>
            <MenuTrigger style={{ padding: 5 }}>
              <Ionicons name="ellipsis-vertical-outline" size={26} color="#fff" />
            </MenuTrigger>
            <MenuOptions customStyles={{ optionsContainer: { backgroundColor: '#333', borderRadius: 3, borderWidth: 0.2, borderColor: '#fff', paddingHorizontal: 5 } }}>
              <MenuOption onSelect={() => handleSaveNote()}>
                <Text style={{ color: '#fff', paddingVertical: 3, marginTop: 2 }}>Save</Text>
              </MenuOption>
              <View style={{ height: 0.5, backgroundColor: '#707070', }} />
              {!isTodo ?
                <MenuOption onSelect={() => setText('')}>
                  <Text style={{ color: '#fff', paddingVertical: 3, marginTop: 2 }}>Clear Text</Text>
                </MenuOption>
                :
                <MenuOption onSelect={() => setTodoList([{ text: '', completed: false }, { id: 'button', title: 'Button' }])}>
                  <Text style={{ color: '#fff', paddingVertical: 3, marginTop: 2 }}>Clear To-Do</Text>
                </MenuOption>
              }
              <View style={{ height: 0.5, backgroundColor: '#707070', }} />
              {isTodo ?
                <MenuOption onSelect={() => (setIsTodo(false), setTodoList([]))}>
                  <Text style={{ color: '#fff', paddingVertical: 3, marginVertical: 2 }}>Switch to Text</Text>
                </MenuOption>
                :
                <MenuOption onSelect={() => (setIsTodo(true), setText(''), setTodoList([{ text: '', completed: false }, { id: 'button', title: 'Button' },]))}>
                  <Text style={{ color: '#fff', paddingVertical: 3, marginVertical: 2 }}>Switch to Checkbox</Text>
                </MenuOption>
              }
            </MenuOptions>
          </Menu>
        </View>
      ),
    });
  }, [headline, text, todoList]);
  const saveNote = (note) => {
    try {
      db.transaction((tx) => {
        tx.executeSql(
          'INSERT INTO notes (headline, text, todoList) VALUES (?, ?, ?)',
          [note.headline, note.text, JSON.stringify(note.todoList)],
          (_, result) => {
            const { insertId } = result;
            console.log('Note inserted with ID:', insertId);
            navigation.navigate('Home');
          },
          (error) => {
            console.error('Error saving note:', error);
            Alert.alert('Error', 'Failed to save note. Please try again.');
          }
        );
      });
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    }
  };

  const handleSaveNote = () => {
    const trimmedHeadline = headline.trim();
    const trimmedText = text.trim();
    const trimmedTodo = todoList.splice(-1);
    if (isTodo) {
      if (trimmedHeadline === '' && todoList.length === 0) {
        navigation.navigate('Home');
        return;
      }
      const istodoTextEmpty = todoList.every(todo => todo.text === '');
      if (istodoTextEmpty) { console.log('the to-do is empty') }
      saveNote({
        headline: trimmedHeadline,
        text: '',
        todoList,
      });

      setHeadline('');
      setText('');
      setIsTodo(false);
      setTodoList([{ text: '', completed: false }, { id: 'button', title: 'Button' }]);
    } else {
      if (trimmedHeadline === '' && trimmedText === '') {
        navigation.navigate('Home');
        return;
      }
      saveNote({
        headline: trimmedHeadline,
        text: trimmedText,
        todoList: [],
      });

      setHeadline('');
      setText('');
    }
  };


  const handleBackPress = () => {
    const trimmedHeadline = headline.trim();
    const trimmedText = text.trim();

    if (isTodo) {
      if (trimmedHeadline !== '' || todoList.length !== 0) {
        saveNote({
          headline: trimmedHeadline,
          text: '',
          todoList,
        });
      }
    } else {
      if (trimmedHeadline !== '' || trimmedText !== '') {
        saveNote({
          headline: trimmedHeadline,
          text: trimmedText,
          todoList: [],
        });
      }
    }

    return false;
  };

  useFocusEffect(
    React.useCallback(() => {
      BackHandler.addEventListener('hardwareBackPress', handleBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    }, [headline, text, isTodo, todoList])
  );
  const updateTodoItem = (itemIndex, updatedItem) => {
    const updatedTodoList = [...todoList];
    updatedTodoList[itemIndex] = updatedItem;
    setTodoList(updatedTodoList);
  };

  const deleteTodoItem = (itemIndex) => {
    const updatedTodoList = [...todoList];
    updatedTodoList.splice(itemIndex, 1);
    setTodoList(updatedTodoList);
  };
  const addTodoItem = () => {
    setTodoList([...todoList, { text: '', completed: false }]);
  };
  const renderTodoItem = ({ item, index }) => {
    if (index === todoList.length - 1) {
      // Render the button as the last item
      return (
        <TouchableOpacity style={styles.addcheckbox} onPress={addTodoItem} >
          <Icon name="plus" size={22} color="#fff" />
          <Text style={{ color: '#fff', marginLeft: 10 }}>Add Checkbox</Text>
        </TouchableOpacity>
      );
    }
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <CheckBox
          checked={item.completed}
          onPress={() => updateTodoItem(index, { ...item, completed: !item.completed })}
          checkedColor="#fff"
          size={20}
        />
        <TextInput
          value={item.text}
          onChangeText={(text) => updateTodoItem(index, { ...item, text })}
          placeholder="Enter todo item"
          style={styles.todoInput}
          placeholderTextColor="#fff"
        />
        <TouchableOpacity onPress={() => deleteTodoItem(index)} style={{ marginRight: 20 }}>
          <EIcon name="cross" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };
  return (
    <View style={{ flexGrow: 1 }}>
      <View style={{ flex: 1, padding: 20 }}>
        <TextInput
          value={headline}
          onChangeText={setHeadline}
          placeholder="Title.."
          style={styles.headlineInput}
          multiline
          placeholderTextColor="gray"
        />
        {isTodo ? (
          <View>
            <FlatList
              data={todoList}
              renderItem={renderTodoItem}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>

        ) : (
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Body.."
            style={styles.noteInput}
            multiline
            placeholderTextColor="#f0f0f0"
          />
        )}
      </View>
    </View >
  );
};

const styles = StyleSheet.create({
  headlineInput: {
    marginBottom: 10,
    fontSize: 21,
    textAlignVertical: 'top',
    color: '#fff',
    borderColor: 'gray',
    padding: 8,
  },
  noteInput: {
    flex: 1,
    marginBottom: 10,
    fontSize: 17,
    textAlignVertical: 'top',
    paddingTop: 10,
    color: '#fff',
    borderColor: 'gray',
    padding: 8,
  },
  todoItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxContainer: {
    marginRight: 10,
  },
  todoItemInput: {
    flex: 1,
    fontSize: 17,
    textAlignVertical: 'top',
    color: '#fff',
    borderColor: 'gray',
    padding: 8,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    marginRight: 4,
  },
  todoInput: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    color: '#fff',
    fontSize: 15
  },
  deleteButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'red',
    borderRadius: 5,
  },
  addcheckbox: {
    marginLeft: 50,
    marginTop: 15,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center'
  }
});

export default AddNote;
