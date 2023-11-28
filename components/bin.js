import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import mainContext from '../context/maincontext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { CheckBox } from 'react-native-elements';

const BinScreen = ({ navigation }) => {
    const { BinNotes, deleteNotePermanently, restoreFromBin, emptyBinCompletely, loadBinNotes, restoreAllFromBin } = useContext(mainContext);
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        loadBinNotes();
    }, [])

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row', marginHorizontal: 5 }}>
                    <TouchableOpacity style={{ marginHorizontal: 5, padding: 4 }} onPress={() => (restoreAllFromBin(), loadBinNotes())}>
                        <Text style={{ fontSize: 15 }}>Restore</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginHorizontal: 5, padding: 3 }} onPress={() => (setIsModalVisible(true))}>
                        <Text style={{ fontSize: 15 }}>Empty</Text>
                    </TouchableOpacity>
                </View>
            ),
        });
    }, []);

    const truncateText = (text, limit) => {
        if (text.split(' ').length > limit) {
            return text.split(' ').slice(0, limit).join(' ') + '...';
        }
        return text;
    };
    const renderItem = ({ item }) => {
        const parsedTodoList = item.todoList ? JSON.parse(item.todoList) : [];
        return (
            <View>
                <View style={parsedTodoList.length > 0 ? ToDoStyle : styles.noteContainer}>
                    {item.headline === '' ? null : <Text style={styles.noteTitle}>{item.headline}</Text>}
                    {parsedTodoList.length > 0 ? (
                        parsedTodoList.map((todoItem, todoIndex) => (
                            <View style={styles.todoItem} key={todoIndex}>
                                {todoItem.completed ?
                                    (<CheckBox
                                        checked={true}
                                        checkedColor="#fff"
                                        size={18}
                                        right={true}
                                        containerStyle={{ margin: 10, padding: 0 }}
                                        wrapperStyle={{ margin: 0, padding: 0 }}
                                        textStyle={{ margin: 0, padding: 0 }}
                                    />)
                                    :
                                    (<CheckBox
                                        checked={false}
                                        checkedColor="#fff"
                                        size={18}
                                        right={true}
                                        containerStyle={{ margin: 6, padding: 0 }}
                                        wrapperStyle={{ margin: 0, padding: 0 }}
                                        textStyle={{ margin: 0, padding: 0 }}
                                    />)
                                }
                                <Text style={styles.todoText}>{todoItem.text}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noteText}>{truncateText(item.text, 30)}</Text>
                    )}
                </View>
                <View style={styles.contextMenu}>
                    <Menu>
                        <MenuTrigger style={{ padding: 5 }}>
                            <Ionicons name="ellipsis-vertical-outline" size={22} color="#fff" />
                        </MenuTrigger>
                        <MenuOptions customStyles={{ optionsContainer: { backgroundColor: '#333', borderRadius: 3, borderWidth: 0.2, borderColor: '#fff', paddingHorizontal: 5 } }}>
                            <MenuOption onSelect={() => (deleteNotePermanently(item.id), loadBinNotes())}>
                                <Text style={{ color: '#fff', paddingVertical: 3, marginVertical: 2 }}>Delete Permanently</Text>
                            </MenuOption>
                            <View style={{ height: 0.5, backgroundColor: '#707070', }} />

                            <View style={{ height: 0.5, backgroundColor: '#707070', }} />
                            <MenuOption onSelect={() => (restoreFromBin(item.id), loadBinNotes())}>
                                <Text style={{ color: '#fff', paddingVertical: 3, marginVertical: 2 }}>Restore</Text>
                            </MenuOption>

                        </MenuOptions>
                    </Menu>
                </View>
            </View>
        );
    };


    return (
        <View style={{ flex: 1, padding: 10, marginTop: 20 }}>
            {BinNotes.length === 0 ? (
                <Text style={{ fontSize: 16, textAlign: 'center', color: '#CCC', marginTop: 20, }}>Bin is empty.</Text>
            ) : (
                <FlatList
                    data={BinNotes}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                />
            )}
            {/* Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => {
                    setIsModalVisible(false);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={{ fontSize: 16, marginVertical: 5 }}>Are you sure you want to delete all notes permanently ?</Text>
                        <View style={styles.modalButtons}>
                            <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
                            <Button
                                title="Empty"
                                onPress={() => {
                                    emptyBinCompletely();
                                    setIsModalVisible(false);
                                    loadBinNotes();
                                }}
                                color='#f73939'
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'rgb(40,40,43)',
        padding: 20,
        borderRadius: 10,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },

});
export default BinScreen;
