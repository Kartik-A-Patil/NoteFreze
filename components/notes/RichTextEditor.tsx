import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

interface RichTextEditorProps {
  initialContent: string;
  handleContentChange: (content: string) => void;
  editorInitialized: boolean;
  editorStyle?: object;
}

const RichTextEditor = ({ initialContent, handleContentChange, editorInitialized, editorStyle = {} }: RichTextEditorProps) => {
  const richText = useRef<RichEditor>(null);

  return (
    <>
      <RichEditor
        ref={richText}
        style={styles.editor}
        placeholder="Note Content"
        initialContentHTML={initialContent}
        onChange={handleContentChange}
        onInit={() => {
          console.log("Editor initialized");
        }}
        editorStyle={{
          backgroundColor: '#000',
          color: '#fff',
          caretColor: '#fff',
          padding: 10,
          ...editorStyle
        }}
        useContainer={true}
        pasteAsPlainText={true}
        autoCorrect={false}
        key="rich-editor-stable"
      />
      <RichToolbar
        editor={richText}
        actions={[
          actions.undo,
          actions.redo,
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.checkboxList,
          actions.insertBulletsList,
          actions.insertOrderedList,
        ]}
        iconTint="#fff"
        selectedIconTint="#ccc"
        style={styles.toolbar}
        unselectedButtonStyle={{ width: 40 }}
        selectedButtonStyle={{ backgroundColor: '#444', borderRadius: 30, width: 40 }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  editor: {
    flex: 1,
    paddingHorizontal: 15,
  },
  toolbar: {
    backgroundColor: '#151515',
    width: '90%',
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 15
  },
});

export default RichTextEditor;
