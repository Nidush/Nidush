export const getFriendlyErrorMessage = (error: any): string => {
    if (!error) return 'Ocorreu um erro inesperado.';

    const message = error.message || error.toString();

    if (message.includes('Invalid login credentials')) {
        return 'Email ou senha incorretos. Por favor, verifique os seus dados.';
    }
    if (message.includes('User already registered')) {
        return 'Este email já está registado. Tente fazer login.';
    }
    if (message.includes('network error') || message.includes('fetch')) {
        return 'Parece que estás sem ligação à internet. Verifica a tua rede.';
    }
    if (message.includes('JWT')) {
        return 'A sua sessão expirou. Por favor, faça login novamente.';
    }

    return message || 'Não foi possível completar a operação. Tente mais tarde.';
};
