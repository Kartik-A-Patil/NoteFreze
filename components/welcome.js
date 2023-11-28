// WelcomeScreen.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/AntDesign';

const WelcomeScreen = ({onWelcomeSeen }) => {
    return (
        <View style={styles.container}>
            <Image source={require('./img/welcome-img.png')} style={styles.image} />
            <View>
                <Text style={styles.title}>Welcome to NoteFreze!</Text>
                <Text style={styles.subtitle}>Stay Organized, One Note at a Time</Text>
            </View>
            <Text style={{ color: '#ccc', paddingHorizontal: 30, fontSize: 17 ,textAlign:'center'}}>Discover NoteFreze, your all-in-one solution for effortless organization. Capture ideas, tasks, and inspirations with ease. Stay productive and prioritize tasks effortlessly, making every day more efficient.</Text>
            <TouchableOpacity
                style={styles.circularButton}
                onPress={() => (onWelcomeSeen())}      >
                <Icon name="right" size={28} color="#000" />
            </TouchableOpacity>
        </View>
    );
};
WelcomeScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
    onWelcomeSeen: PropTypes.func.isRequired,
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: '#000'
    },
    image: {
        width: 350,
        height: 350,
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 20,
        fontWeight:'bold'
    },
    circularButton: {
        width: 70,
        height: 70,
        borderRadius: 35, // Half of width/height to make it circular
        backgroundColor: '#f0ff0f', // Button background color
        justifyContent: 'center',
        alignItems: 'center',
    },

});

export default WelcomeScreen;
