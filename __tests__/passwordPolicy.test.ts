import {
  PASSWORD_MIN_LENGTH,
  getNextPasswordRequirement,
  getPasswordRules,
  validatePassword,
} from '../utils/passwordPolicy';

describe('passwordPolicy', () => {
  it('accepts a strong password', () => {
    const result = validatePassword('StrongPass123!');

    expect(result.isValid).toBe(true);
    expect(result.message).toBe('');
    expect(result.rules.every((rule) => rule.isValid)).toBe(true);
  });

  it('rejects a weak password and explains the next missing requirement', () => {
    const result = validatePassword('weak');

    expect(result.isValid).toBe(false);
    expect(result.message).toContain(String(PASSWORD_MIN_LENGTH));
    expect(getNextPasswordRequirement('weak')).toBe(`At least ${PASSWORD_MIN_LENGTH} characters`);
  });

  it('returns all five password rules in a stable order', () => {
    const rules = getPasswordRules('Example123!');

    expect(rules.map((rule) => rule.id)).toEqual([
      'length',
      'lowercase',
      'uppercase',
      'number',
      'symbol',
    ]);
  });
});
