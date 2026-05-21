import React from 'react';
import { Text, View } from 'react-native';

export const LEGAL_CONSENT_KEY = '@nidush_legal_consent_v1';

const privacySections = [
  {
    title: 'Privacy Policy',
    content:
      'Nidush collects the information needed to create your account, personalize routines, connect integrations, and keep your home experience working.',
  },
  {
    title: 'Information We Collect',
    content:
      'We may collect your name, email, profile preferences, activities, routines, device information, app usage data, and network information used for device discovery.',
  },
  {
    title: 'Third-Party Integrations',
    content:
      'When you connect services such as Spotify, Nidush may access the minimum data needed for the feature, such as profile information, playback state, playlists, and recently played tracks. You can disconnect integrations from the app.',
  },
  {
    title: 'Local Storage',
    content:
      'Nidush uses local app storage for essential settings such as onboarding state, legal consent, preferences, and session-related app data. This is the app equivalent of essential cookies.',
  },
  {
    title: 'How We Use Data',
    content:
      'We use data to provide and maintain Nidush, personalize your experience, connect smart home devices, improve the app, and provide support.',
  },
  {
    title: 'Sharing',
    content:
      'We do not sell your personal information. We only share data when needed for app operation, with your consent, with service providers, or when required by law.',
  },
  {
    title: 'Your Rights',
    content:
      'You can request access, correction, deletion, withdrawal of consent, and portability of your personal data where applicable.',
  },
  {
    title: 'Contact',
    content:
      'For privacy questions, contact privacy@nidush.com or support@nidush.com.',
  },
];

const termsSections = [
  {
    title: 'Terms of Service',
    content:
      'By using Nidush, you agree to these terms. If you do not agree, you should not use the app.',
  },
  {
    title: 'Service',
    content:
      'Nidush is a smart home and lifestyle app that helps create routines and activities with music, device, and home context integrations.',
  },
  {
    title: 'Accounts',
    content:
      'You must provide accurate information, keep your credentials secure, and be at least 13 years old to use Nidush.',
  },
  {
    title: 'Integrations',
    content:
      'Third-party services and smart home devices are provided by their respective providers. Availability, compatibility, and behavior may change outside Nidush control.',
  },
  {
    title: 'Responsible Use',
    content:
      'Do not misuse the app, attempt unauthorized access, disrupt services, share malicious content, or use Nidush for illegal purposes.',
  },
  {
    title: 'Liability',
    content:
      'Nidush is provided as is. To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages.',
  },
  {
    title: 'Updates',
    content:
      'We may update these terms and privacy practices. When important changes happen, Nidush may ask you to review and accept them again.',
  },
];

export const legalSections = [...privacySections, ...termsSections];

export function LegalContent() {
  return (
    <View className="gap-y-6">
      {legalSections.map((section) => (
        <View key={section.title}>
          <Text
            className="text-lg text-[#3A4D3F] mb-1"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            {section.title}
          </Text>
          <Text
            className="text-[#4A5D4E] leading-6"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            {section.content}
          </Text>
        </View>
      ))}
    </View>
  );
}
