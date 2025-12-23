import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Dimensions,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function SignUp() {
    const router = useRouter();

    return (
        <View style={styles.mainContainer}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
                    <SafeAreaView style={styles.container}>

                        <View style={styles.header}>
                            <Image
                                source={require('../assets/images/Logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>

                        <View style={styles.content}>
                            <Text style={styles.welcomeTitle}>Welcome Home</Text>
                            <Text style={styles.welcomeSubtitle}>
                                Join Nidush and let your home be your safe space.
                            </Text>

                            <View style={styles.row}>
                                <View style={styles.inputWrapperSmall}>
                                    <Text style={styles.label}>First Name</Text>
                                    <TextInput style={styles.input} placeholderTextColor="#A0A0A0" />
                                </View>
                                <View style={styles.inputWrapperSmall}>
                                    <Text style={styles.label}>Last Name</Text>
                                    <TextInput style={styles.input} placeholderTextColor="#A0A0A0" />
                                </View>
                            </View>

                            <View style={styles.inputWrapperFull}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputWrapperFull}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    secureTextEntry={true}
                                />
                            </View>

                            {/* AGORA O BOTÃO NAVEGA PARA AS TABS */}
                            <TouchableOpacity
                                style={styles.joinButton}
                                onPress={() => router.replace('/(tabs)')}
                            >
                                <Text style={styles.joinButtonText}>Join Nidush</Text>
                            </TouchableOpacity>

                            <View style={styles.loginRow}>
                                <Text style={styles.alreadyText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => router.push('/(tabs)')}>
                                    <Text style={styles.loginLink}>Login</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.waveContainer}>
                <Image
                    source={require('../assets/images/Wave2.png')}
                    style={styles.waves}
                    resizeMode="stretch"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#F3F5EE' },
    container: { flex: 1, paddingHorizontal: 28 },
    header: { alignItems: 'center', marginTop: 15, height: 60, justifyContent: 'center' },
    logo: { width: 130, height: 45 },
    content: { marginTop: 25 },
    welcomeTitle: { fontSize: 40, fontWeight: '700', color: '#3E545C', fontFamily: 'Nunito', letterSpacing: -0.5 },
    welcomeSubtitle: { fontSize: 16, color: '#3E545C', marginTop: 8, marginBottom: 30, fontFamily: 'Nunito', lineHeight: 22, opacity: 0.9 },
    label: { fontSize: 14, color: '#3E545C', marginBottom: 6, fontWeight: '600', fontFamily: 'Nunito' },
    input: { height: 44, borderWidth: 1.2, borderColor: '#C8D2C8', borderRadius: 15, paddingHorizontal: 15, backgroundColor: '#FBFDFB', fontSize: 15, color: '#3E545C' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    inputWrapperSmall: { width: '48%' },
    inputWrapperFull: { width: '100%', marginBottom: 15 },
    joinButton: {
        backgroundColor: '#5C8D58',
        width: 230,
        height: 54,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    joinButtonText: { color: '#fff', fontSize: 20, fontWeight: '700', fontFamily: 'Nunito' },
    loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    alreadyText: { color: '#3E545C', fontSize: 15, fontFamily: 'Nunito' },
    loginLink: { color: '#5C8D58', fontSize: 15, fontWeight: '700', fontFamily: 'Nunito' },
    waveContainer: {
        position: 'absolute',
        bottom: 0,
        width: width,
        height: height * 0.18,
        overflow: 'hidden',
    },
    waves: {
        width: '100%',
        height: height * 0.45,
        position: 'absolute',
        bottom: 0,
    }

});