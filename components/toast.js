import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

const Toast = ({ message, visible, onClose, btnvisible }) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'end', paddingHorizontal: 15, marginBottom: 95 }}>
      <View
        style={{
          backgroundColor: '#f0f0f0',
          paddingVertical: 7,
          paddingHorizontal: 16,
          borderRadius: 8,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#000' ,marginVertical:4}}>{message}</Text>
        {btnvisible ? 
        <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
          <Text style={{ color: '#5a30ff' }}>Undo</Text>
        </TouchableOpacity> : null}

      </View>
    </View>
  </Modal>
);

export default Toast;
