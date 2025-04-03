import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Dialog, Button, Portal } from 'react-native-paper';

interface DeleteConfirmationDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationDialog = ({ 
  visible, 
  onDismiss, 
  onConfirm 
}: DeleteConfirmationDialogProps) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Icon icon="alert" />
        <Dialog.Title style={styles.title}>Do you want to delete this note permanently?</Dialog.Title>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={onConfirm}>Delete</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: '#000',
  },
  title: {
    color: '#fff',
  },
});

export default DeleteConfirmationDialog;
