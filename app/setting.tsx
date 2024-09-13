import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableNativeFeedback } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Switch } from 'react-native-paper';
import { router } from 'expo-router';
import { Octicons } from '@expo/vector-icons';
import Context from '@/context/createContext';
import * as LocalAuthentication from 'expo-local-authentication';

export default function Settings() {
    const context = useContext(Context);
    const { isAuthEnabled, setIsAuthEnabled, onToggleSnackBar } = context;
    const [authAllowed, setIsAuthAllowed] = useState(null);
    const toggleAuthSwitch = () => {
        setIsAuthEnabled((prevState: any) => !prevState)
        onToggleSnackBar({ SnackBarMsg: `Authentication ${!isAuthEnabled ? 'enabled' :'disable'}`})

    };
    const CheckHardWareAndEnrollment = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
            setIsAuthAllowed(true)
        }
    }
    useEffect(() => {
        CheckHardWareAndEnrollment()
    }, [])
    return (
        <View style={styles.container}>
            <ThemedText style={styles.headerText}>Settings</ThemedText>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Tools</ThemedText>
                <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple('#222', false)}
                    onPress={() => router.navigate('/bin')}
                    style={{ borderRadius: 40 }}
                >
                    <View style={styles.optionContainer}>
                        <ThemedText style={styles.optionText}>Recycle Bin</ThemedText>
                        <Octicons name="trash" size={24} color="#888" />
                    </View>
                </TouchableNativeFeedback>
            </View>
            {authAllowed ? <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Authentication</ThemedText>
                <View style={styles.row}>
                    <View style={styles.textContainer}>
                        <ThemedText style={styles.optionText}>Biometric Authentication</ThemedText>
                        <ThemedText style={styles.optionDescText}>
                            Use your fingerprint or face to unlock secure Notes.
                        </ThemedText>
                    </View>
                    <Switch value={isAuthEnabled} onValueChange={toggleAuthSwitch} />
                </View>
            </View> : null}

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>About</ThemedText>
                <View style={styles.row}>

                    <ThemedText style={styles.optionText}>Contributors</ThemedText>
                    <ThemedText style={styles.optionDescText}>
                        Kartik Patil(Owner)
                    </ThemedText>
                </View>
                <View style={styles.row}>
                    <ThemedText style={styles.optionText}>Version</ThemedText>

                    <ThemedText style={styles.optionDescText}>
                        V 1.0.0
                    </ThemedText>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    headerText: {
        fontSize: 30,
        fontFamily: 'ndot',
        paddingTop: 20,
        marginBottom: 40,
        color: '#fff'
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'RobotoMono',
        marginBottom: 10,
        color: '#aaa',
    },
    optionContainer: {
        height: 50,
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        fontFamily: 'RobotoMono',
        color: '#fff',
    },
    optionDescText: {
        fontSize: 14,
        fontFamily: 'PTMono',
        color: '#666',
        maxWidth: 300,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginLeft: 8,
        marginTop: 5,
        marginVertical: 10
    },
    textContainer: {
        flexDirection: 'column',
    },
});
