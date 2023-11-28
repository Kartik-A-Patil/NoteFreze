import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, BackHandler,KeyboardAvoidingView } from 'react-native';
import SQLite from 'react-native-sqlite-storage';
const db = SQLite.openDatabase('notes.db');
import { CheckBox } from 'react-native-elements';
import Icon from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import mainContext from '../context/maincontext';

const UpdateNote = ({ route, navigation }) => {
  const { note } = route.params;
  const [isTodoMode, setIsTodoMode] = useState(note.todoList.length > 2);
  const [headline, setHeadline] = useState(note.headline);
  const [text, setText] = useState(note.text);
  const addButton = { id: 'button', title: 'Button' };
  const [todoList, setTodoList] = useState(note.todoList !== [] ? JSON.parse(note.todoList) : [{ text: '', completed: false }, { id: 'button', title: 'Button' },]);
  const { moveToBin } = useContext(mainContext);

  useEffect(() => {
    const clonedTodoList = note.todoList !== null ? JSON.parse(note.todoList) : [];
    clonedTodoList.push(addButton);
    setTodoList(clonedTodoList);
  }, [note.todoList]);
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.contextMenu}>
          <Menu>
            <MenuTrigger style={{ padding: 5 }}>
              <Ionicons name="ellipsis-vertical-outline" size={26} color="#fff" />
            </MenuTrigger>
            <MenuOptions customStyles={{ optionsContainer: { backgroundColor: '#333', borderRadius: 3, borderWidth: 0.2, borderColor: '#fff', paddingHorizontal: 5 } }}>
              <MenuOption onSelect={updateNote}>
                <Text style={{ color: '#fff', paddingVertical: 3, marginVertical: 2 }}>Save</Text>
              </MenuOption>
              <View style={{ height: 0.5, backgroundColor: '#707070', }} />
              {!isTodoMode ?
                <MenuOption onSelect={() => setText('')}>
                  <Text style={{ color: '#fff', paddingVertical: 3, marginTop: 2 }}>Clear Text</Text>
                </MenuOption>
                :
                <MenuOption onSelect={() => setTodoList([{ text: '', completed: false }, { id: 'button', title: 'Button' }])}>
                  <Text style={{ color: '#fff', paddingVertical: 3, marginTop: 2 }}>Clear To-Do</Text>
                </MenuOption>
              }
              <View style={{ height: 0.5, backgroundColor: '#707070', }} />

              {isTodoMode ?
                <MenuOption onSelect={() => (setIsTodoMode(false), setTodoList([]))}>
                  <Text style={{ color: '#fff', paddingVertical: 3, marginVertical: 2 }}>Switch to Text</Text>
                </MenuOption>
                :
                <MenuOption onSelect={() => (setIsTodoMode(true), setText(''), setTodoList([{ text: '', completed: false }, { id: 'button', title: 'Button' }]))}>
                  <Text style={{ color: '#fff', paddingVertical: 3, marginVertical: 2 }}>Switch to Checkbox</Text>
                </MenuOption>
              }
              <View style={{ height: 0.5, backgroundColor: '#707070', }} />
              <MenuOption onSelect={() => (moveToBin(note.id), navigation.navigate('Home'))}>
                <Text style={{ color: '#fff', paddingVertical: 3, marginVertical: 2 }}>Move to Bin</Text>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>
      ),
    });
  }, [headline, text, todoList]);
  const updateNote = () => {
    try {
      if (isTodoMode) {
        setText('');
      }
      else {
        setTodoList([])
      }
      const array = todoList.pop()
      db.transaction(tx => {
        tx.executeSql(
          'UPDATE notes SET headline = ?, text = ?, todoList = ? WHERE id = ?',
          [headline, text, JSON.stringify(todoList), note.id],
          (_, { rowsAffected }) => {
            if (rowsAffected > 0) {
              console.log('Note updated successfully');
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
              }
            } else {
              console.log('Failed to update note');
            }
          },
          (error) => {
            console.error('Error updating note:', error);
          }
        );
      });
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

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

  const renderTodoItem = ({ item, index }) => {
    if (index === todoList.length - 1) {
      return (
        <TouchableOpacity style={styles.addcheckbox} onPress={addTodoItem} >
          <Icon name="plus" size={24} color="#fff" />
          <Text style={{ color: '#fff', marginLeft: 5 }}>Add Checkbox</Text>
        </TouchableOpacity>
      );
    }
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <CheckBox
          checked={item.completed}
          onPress={() => updateTodoItem(index, { ...item, completed: !item.completed })}
          checkedColor="#fff"
        />
        <TextInput
          value={item.text}
          onChangeText={(text) => updateTodoItem(index, { ...item, text })}
          placeholder="Enter todo item"
          style={styles.todoInput}
          placeholderTextColor="#fff"
        />
        <TouchableOpacity onPress={() => deleteTodoItem(index)} style={{ marginRight: 20 }}>
          <Icon name="cross" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  const addTodoItem = () => {
    setTodoList([...todoList, { text: '', completed: false }]);
  };
  useFocusEffect(
    React.useCallback(() => {
      BackHandler.addEventListener('hardwareBackPress', updateNote);

      return () => BackHandler.removeEventListener('hardwareBackPress', updateNote);
    }, [headline, text, isTodoMode, todoList])
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Adjust behavior according to platform
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25} // Adjust offset if needed
    >
      <View>
        <TextInput
          value={headline}
          onChangeText={setHeadline}
          placeholder="Enter title"
          style={styles.titleInput}
          placeholderTextColor="#aaa"

        />
        {isTodoMode ? (
          <View>
            <FlatList
              data={todoList}
              renderItem={renderTodoItem}
              keyExtractor={(item, index) => index.toString()}
              ListFooterComponent={<View style={{ marginBottom: 90 }} />}
              style={{ height: 600 }}
            />

          </View>

        ) : (
          <View>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Enter note"
              multiline
              style={styles.normalTextInput}
              placeholderTextColor="#aaa"
            />

          </View>
        )}
      </View>
      {/* Bottom menu */}
      <View style={styles.bottomMenu}>
        {/* Add your buttons here */}
        {/* For example: */}
        {/* <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="trash-outline" size={25} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="copy-outline" size={25} color="#fff" />
        </TouchableOpacity> */}

        {/* Add more buttons as needed */}
      </View>

    </KeyboardAvoidingView>
  );
};

const styles = {
  titleInput: {
    paddingHorizontal: 20,
    marginTop: 10,
    color: '#aaa',
    fontSize: 18
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
    paddingHorizontal: 10,
    marginRight: 10,
    color: '#fff',
    fontSize: 16
  },
  deleteButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'red',
    borderRadius: 5,
  },
  addButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'green',
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteAllButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'red',
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteAllButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'blue',
    borderRadius: 5,
    alignItems: 'center',
  },
  switchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  normalTextInput: {
    marginBottom: 10,
    fontSize: 17,
    textAlignVertical: 'top',
    paddingTop: 10,
    color: '#fff',
    borderColor: 'gray',
    padding: 8,
    marginLeft: 17,
    height: '91%'
  },
  addcheckbox: {
    marginLeft: 50,
    marginTop: 15,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  todoListContainer: {
    flex: 1,
  },
  scrollViewContent: {
    paddingVertical: 8,
  },
  bottomMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuButton: {
    borderRadius: 30,
    padding: 10,
  },
  menuButtonText: {
    color: '#fff', // Customize button text color
    fontSize: 18,
    fontWeight: 'bold',
  },
};

export default UpdateNote;
