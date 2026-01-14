import { render } from '@testing-library/react-native';
import WelcomeUser from '../components/Onboarding/WelcomeUser';

jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    loop: true,
    muted: true,
    playbackRate: 0.6
  })),
  VideoView: 'VideoView'
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}));
describe('WelcomeUser', () => {
  test('renderiza sem crashar e mostra primeira frase', () => {
    const onFinishMock = jest.fn();
    const { getByText } = render(<WelcomeUser onFinish={onFinishMock} />);
    
    expect(getByText(/Welcome home/i)).toBeTruthy();
  });
});