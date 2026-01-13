import React from 'react';
import { render, fireEvent, waitFor, cleanup, act } from '@testing-library/react-native';
import ActivitySelection from '../components/Onboarding/ActivitySelection';

// Mock silenciando avisos de ícones
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
    // Resolve o erro "You called act(...) without await"
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

    // Verificando se o botão de enter existe
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