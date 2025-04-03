import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  Animated
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface ReminderModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  reminder: Date | null;
  setReminder: (date: Date | null) => void;
  handleSetReminder: () => void;
  handleDeleteReminder: () => void;
  reminderMode: 'add' | 'edit';
}

const ReminderModal: React.FC<ReminderModalProps> = ({
  visible,
  setVisible,
  reminder,
  setReminder,
  handleSetReminder,
  handleDeleteReminder,
  reminderMode
}) => {
  const [date, setDate] = useState(reminder || new Date());
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [show, setShow] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  
  // Update local date when reminder changes
  useEffect(() => {
    if (reminder) {
      setDate(reminder);
    } else {
      // Set to a reasonable default time (30 minutes from now)
      const defaultDate = new Date();
      defaultDate.setMinutes(defaultDate.getMinutes() + 30);
      setDate(defaultDate);
    }
  }, [reminder, visible]);

  // Animate modal when visibility changes
  useEffect(() => {
    Animated.spring(animation, {
      toValue: visible ? 1 : 0,
      tension: 65,
      friction: 11,
      useNativeDriver: true
    }).start();
  }, [visible, animation]);

  const onChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShow(false);
      return;
    }
    
    const currentDate = selectedDate || date;
    
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    setDate(currentDate);
    setReminder(currentDate);
  };

  const showDatepicker = () => {
    setMode('date');
    setShow(true);
  };

  const showTimepicker = () => {
    setMode('time');
    setShow(true);
  };

  const handleConfirm = () => {
    handleSetReminder();
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleDelete = () => {
    handleDeleteReminder();
    setVisible(false);
  };

  // Format time in 12-hour format
  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${hours}:${minutesStr} ${ampm}`;
  };

  // Format date as Month Day, Year
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString(undefined, options);
  };

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0]
  });

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalBackdrop}>
        <TouchableWithoutFeedback onPress={handleCancel}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
        
        <Animated.View 
          style={[
            styles.modalContent, 
            { transform: [{ translateY }] }
          ]}
        >
          <View style={styles.handle} />
          
          {/* Reminder Header */}
          <View style={styles.header}>
            <Ionicons name="notifications-outline" size={22} color="#4169E1" />
            <Text style={styles.headerText}>
              {reminderMode === 'add' ? 'Set Reminder' : 'Edit Reminder'}
            </Text>
          </View>
          
          {/* Date & Time Selectors */}
          <View style={styles.selectors}>
            <TouchableOpacity 
              style={styles.selector} 
              onPress={showDatepicker}
            >
              <View style={styles.selectorIconContainer}>
                <Ionicons name="calendar" size={18} color="#4169E1" />
              </View>
              <View style={styles.selectorTextContainer}>
                <Text style={styles.selectorLabel}>Date</Text>
                <Text style={styles.selectorValue}>{formatDate(date)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#777" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selector} 
              onPress={showTimepicker}
            >
              <View style={styles.selectorIconContainer}>
                <Ionicons name="time" size={18} color="#4169E1" />
              </View>
              <View style={styles.selectorTextContainer}>
                <Text style={styles.selectorLabel}>Time</Text>
                <Text style={styles.selectorValue}>{formatTime(date)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#777" />
            </TouchableOpacity>
          </View>

          {/* Buttons */}
          <View style={styles.actionButtons}>
            {reminderMode === 'edit' && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color="#FF5252" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleConfirm}
            >
              <Text style={styles.saveButtonText}>
                {reminderMode === 'add' ? 'Set' : 'Update'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hidden DateTimePicker that shows when needed */}
          {show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode={mode}
              is24Hour={false}
              display="default"
              onChange={onChange}
              minimumDate={new Date()}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderColor: '#333',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
    fontFamily: 'RobotoMono',
  },
  selectors: {
    marginBottom: 20,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectorIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 2,
  },
  selectorValue: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'RobotoMono',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 8,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 'auto',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReminderModal;
