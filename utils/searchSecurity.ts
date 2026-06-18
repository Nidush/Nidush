const MAX_SEARCH_LENGTH = 80;

export const normalizeSearchInput = (value: string, maxLength = MAX_SEARCH_LENGTH) =>
  value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

export const escapeLikePattern = (value: string) =>
  value.replace(/[\\%_]/g, (char) => `\\${char}`);

export const buildSafeContainsPattern = (value: string) => {
  const normalized = normalizeSearchInput(value);
  if (!normalized) return '';
  return `%${escapeLikePattern(normalized)}%`;
};

export { MAX_SEARCH_LENGTH };
