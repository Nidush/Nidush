import 'react-native-gesture-handler/jestSetup';

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mocks do Supabase para evitar erros de rede/env nos testes
jest.mock('@/utils/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ 
        data: { 
          user: { 
            id: '123', 
            email: 'test@example.com',
            user_metadata: { first_name: 'Laura', last_name: 'Rossi' }
          } 
        }, 
        error: null 
      })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(() => Promise.resolve({ data: { user: { id: '123' }, session: {} }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'test.jpg' }, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/test.jpg' } })),
      })),
    },
  },
}));

// Mock do Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));
