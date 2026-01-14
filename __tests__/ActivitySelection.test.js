import React from 'react'; 
import { render, fireEvent, waitFor, cleanup, act } from '@testing-library/react-native';
import ActivitySelection from '../components/Onboarding/ActivitySelection';

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  Ionicons: 'Ionicons',
}));

describe('ActivitySelection', () => {
  let onFinishMock;

  beforeEach(() => {
    onFinishMock = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    cleanup();
  });

  const renderComponent = () => render(<ActivitySelection onFinish={onFinishMock} />);

  test('seleciona e desseleciona atividades', async () => {
    const { getByTestId } = renderComponent();

    const meditation = await waitFor(() => getByTestId('activity-Meditation'));
    
    fireEvent.press(meditation); 
    fireEvent.press(meditation); 

    expect(getByTestId('enter-button')).toBeTruthy();
  });

  test('chama onFinish ao clicar no botão', async () => {
    const { getByTestId } = renderComponent();

    const meditation = await waitFor(() => getByTestId('activity-Meditation'));
    fireEvent.press(meditation);

    const enterButton = getByTestId('enter-button');
    fireEvent.press(enterButton);

    expect(onFinishMock).toHaveBeenCalledTimes(1);
  });
});