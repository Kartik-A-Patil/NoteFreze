import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Button, StyleSheet, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import Micon from 'react-native-vector-icons/MaterialIcons';
import Ficon from 'react-native-vector-icons/Feather';
import mainContext from '../context/maincontext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Setting = ({ navigation }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { moveAllNotesToBin } = useContext(mainContext);

  const openLink = async () => {
    const url = 'https://www.privacypolicies.com/live/b0c24f86-1b85-4d42-868b-5ba4a350ab77';
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening URL: ', error);
    }
  };
  const openEmailApp = () => {
    const senderEmail = 'kartikpatil8180@gmail.com'; // Replace with the sender's email

    // Prepare the email URI
    const emailUri = `mailto:${senderEmail}`;

    // Open the default email app
    Linking.openURL(emailUri).catch((error) => {
      console.error('Failed to open email app:', error);
      // You can show an error message to the user if opening the app fails
    });
  };
  return (
    <View style={styles.MainContainer}>
      <Text style={styles.headline}>Tools</Text>
      <TouchableOpacity style={styles.Container} onPress={() => setIsModalVisible(true)}>
        <Micon name="clear-all" size={28} color="#fff" style={{ marginRight: 20, marginLeft: 5 }} />
        <Text style={{ color: '#fff' }}>Move all Notes to bin</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.Container} onPress={() => navigation.navigate('Bin')}>
        <Ionicons name="trash-outline" size={23} color="#fff" style={{ marginRight: 20, marginLeft: 5 }} />
        <Text style={{ color: '#fff' }}>Bin</Text>
      </TouchableOpacity>

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
            <Text style={{ fontSize: 16, marginVertical: 5 }}>Are you sure you want to delete all notes ?</Text>
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
              <Button
                title="Delete"
                onPress={() => {
                  moveAllNotesToBin();
                  setIsModalVisible(false);
                }}
                color='#ff0000'
              />
            </View>
          </View>
        </View>
      </Modal>
      <Text style={styles.headline}>About</Text>
      <View style={styles.NewContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="infocirlceo" size={21} color="#fff" style={{ marginRight: 20 }} />
          <Text style={{ fontSize: 16, color: '#fff' }}>Version</Text>
        </View>
        <Text style={{ marginHorizontal: 1, color: '#ccc' }}>V  1.3.0</Text>
      </View>
      <View style={styles.Container}>
        <Icon name="copyright" size={21} color="#fff" style={{ marginRight: 20, marginLeft: 5 }} />
        <View>
          <Text style={{ fontSize: 16, color: '#fff' }}>Copyright & Credits</Text>
          <Text style={{ marginHorizontal: 4, color: '#ccc' }}>2023 <Icon name="copyright" size={12} color="#fff" /> Kartik Patil</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.NewContainer} onPress={openEmailApp}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Micon name="feedback" size={23} color="#fff" style={{ marginRight: 20 }} />
          <Text style={{ fontSize: 15, color: '#fff' }}>Report Bug / Feedback</Text>
        </View>
        <View>
          <Ficon name="external-link" size={23} color="#fff" style={{ marginRight: 5 }} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.NewContainer} onPress={openLink}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Micon name="privacy-tip" size={23} color="#fff" style={{ marginRight: 20 }} />
          <Text style={{ fontSize: 15, color: '#fff' }}>Privacy policy</Text>
        </View>
        <View>
          <Ficon name="external-link" size={23} color="#fff" style={{ marginRight: 5 }} />
        </View>
      </TouchableOpacity>

    </View>
  );
};

export default Setting;


const styles = StyleSheet.create({
  Container: {
    backgroundColor: 'rgb(40,40,43)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 3,
    borderRadius: 10,
  },
  MainContainer: {
    padding: 18,
  },
  NewContainer: {
    backgroundColor: 'rgb(40,40,43)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    justifyContent: 'space-between',
    marginVertical: 3,
    borderRadius: 10,
  },
  headline: {
    color: '#fff',
    fontSize: 17,
    marginLeft: 10,
    marginVertical: 5,
  },
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

})