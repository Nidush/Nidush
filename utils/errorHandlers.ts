type ErrorLike = {
    message?: string;
    toString?: () => string;
};

export const getFriendlyErrorMessage = (error: unknown): string => {
    if (!error) return 'Ocorreu um erro inesperado.';

    const message =
        error instanceof Error
            ? error.message
            : typeof error === 'string'
                ? error
                : (error as ErrorLike).message || String(error);

    if (message.includes('Invalid login credentials')) {
        return 'Email ou senha incorretos. Por favor, verifique os seus dados.';
    }
    if (message.includes('User already registered')) {
        return 'Este email já está registado. Tente fazer login.';
    }
    if (
        message.toLowerCase().includes('password') &&
        (message.toLowerCase().includes('weak') ||
            message.toLowerCase().includes('short') ||
            message.toLowerCase().includes('characters'))
    ) {
        return 'A password deve ter pelo menos 12 caracteres, letras maiúsculas e minúsculas, números e um símbolo.';
    }
    if (message.includes('network error') || message.includes('fetch')) {
        return 'Parece que estás sem ligação à internet. Verifica a tua rede.';
    }
    if (message.includes('JWT')) {
        return 'A sua sessão expirou. Por favor, faça login novamente.';
    }

    return message || 'Não foi possível completar a operação. Tente mais tarde.';
};
