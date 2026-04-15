import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface VerificationModalProps {
  visible: boolean;
  email: string;
  onCheckEmail: () => void;
  onResend: () => void;
}

export default function VerificationModal({
  visible,
  email,
  onCheckEmail,
  onResend,
}: VerificationModalProps) {
  const { width } = Dimensions.get('window');
  const isWeb = Platform.OS === 'web';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Blur effect background */}
        <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
        
        <View style={[styles.container, { width: Math.min(width * 0.85, 400) }]}>
          {/* Icon Section */}
          <View style={styles.iconContainer}>
             <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="email-outline" size={48} color="#5C8D58" />
                <View style={styles.iconDot} />
             </View>
          </View>

          {/* Text Section */}
          <Text style={styles.title}>Verify your email</Text>
          
          <Text style={styles.description}>
            Welcome! We've gently sent a confirmation link to{' '}
            <Text style={styles.emailText}>[{email || 'email@example.com'}]</Text>.
            Tap it whenever you're ready to enter your new safe space.
          </Text>

          {/* Button Section */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onCheckEmail}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>I'll check my email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onResend}
            activeOpacity={0.6}
          >
            <Text style={styles.secondaryButtonText}>Didn't receive it?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#F3F5EE', 
    borderRadius: 35,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconDot: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#5C8D58',
    borderWidth: 2,
    borderColor: '#F3F5EE',
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 28,
    color: '#3E545C',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: '#3E545C',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    opacity: 0.8,
  },
  emailText: {
    fontFamily: 'Nunito_700Bold',
    color: '#5C8D58',
  },
  primaryButton: {
    backgroundColor: '#5C8D58',
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#5C8D58',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
    fontSize: 18,
  },
  secondaryButton: {
    padding: 10,
  },
  secondaryButtonText: {
    fontFamily: 'Nunito_600SemiBold',
    color: '#5C8D58',
    fontSize: 16,
  },
});
