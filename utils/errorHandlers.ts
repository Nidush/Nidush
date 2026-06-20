type ErrorLike = {
    message?: string;
    toString?: () => string;
};

export const getFriendlyErrorMessage = (error: unknown): string => {
    if (!error) return 'An unexpected error occurred.';

    const message =
        error instanceof Error
            ? error.message
            : typeof error === 'string'
                ? error
                : (error as ErrorLike).message || String(error);

    if (message.includes('Invalid login credentials')) {
        return 'Incorrect email or password. Please check your details.';
    }
    if (message.includes('User already registered')) {
        return 'This email is already registered. Try logging in.';
    }
    if (
        message.toLowerCase().includes('password') &&
        (message.toLowerCase().includes('weak') ||
            message.toLowerCase().includes('short') ||
            message.toLowerCase().includes('characters'))
    ) {
        return 'Password must have at least 12 characters, uppercase and lowercase letters, a number, and one symbol.';
    }
    if (message.includes('network error') || message.includes('fetch')) {
        return 'It looks like you are offline. Please check your connection.';
    }
    if (message.includes('JWT')) {
        return 'Your session expired. Please log in again.';
    }

    return message || 'Could not complete the operation. Please try again later.';
};
