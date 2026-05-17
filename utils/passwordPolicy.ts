export const PASSWORD_MIN_LENGTH = 12;

const SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/;

export type PasswordRule = {
  id: string;
  label: string;
  isValid: boolean;
};

export const getPasswordRules = (password: string): PasswordRule[] => [
  {
    id: 'length',
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    isValid: password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'lowercase',
    label: 'At least one lowercase letter',
    isValid: /[a-z]/.test(password),
  },
  {
    id: 'uppercase',
    label: 'At least one uppercase letter',
    isValid: /[A-Z]/.test(password),
  },
  {
    id: 'number',
    label: 'At least one number',
    isValid: /\d/.test(password),
  },
  {
    id: 'symbol',
    label: 'At least one symbol',
    isValid: SPECIAL_CHARACTER_PATTERN.test(password),
  },
];

export const validatePassword = (password: string) => {
  const rules = getPasswordRules(password);
  const failedRules = rules.filter((rule) => !rule.isValid);

  return {
    rules,
    isValid: failedRules.length === 0,
    message:
      failedRules.length === 0
        ? ''
        : `Password must have at least ${PASSWORD_MIN_LENGTH} characters, uppercase and lowercase letters, a number, and one symbol.`,
  };
};

export const getNextPasswordRequirement = (password: string) =>
  getPasswordRules(password).find((rule) => !rule.isValid)?.label ?? '';
