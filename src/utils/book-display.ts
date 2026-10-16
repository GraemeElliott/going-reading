// Display-only formatting for book titles and authors. Stored data is untouched.

/** Splits "Main: Subtitle" at the first colon. Titles without a colon are unchanged. */
export const formatBookTitle = (
  title: string
): { main: string; subtitle: string | null } => {
  const i = title.indexOf(':');
  if (i === -1) return { main: title, subtitle: null };
  const main = title.slice(0, i).trim();
  const subtitle = title.slice(i + 1).trim();
  // Guard against odd data like ": Subtitle" or "Title:"
  if (!main) return { main: title, subtitle: null };
  return { main, subtitle: subtitle || null };
};

// "Surname, First names": exactly one comma and otherwise only letters, spaces,
// apostrophes and hyphens (so "O'Brien, Tim" and "Smith-Jones, Ann" qualify,
// but "Le Guin, Ursula K." or "Tolkien, J.R.R." are left as stored)
const SURNAME_FIRST = /^\s*([\p{L}' -]+?)\s*,\s*([\p{L}' -]+?)\s*$/u;

/** "Orme, Nicholas" -> "Nicholas Orme". Anything else is returned as stored. */
export const formatAuthor = (name: string): string => {
  const match = name.match(SURNAME_FIRST);
  return match ? `${match[2]} ${match[1]}` : name;
};

/** Formats each author and joins them for display */
export const formatAuthors = (authors: string[] | null | undefined): string =>
  (authors ?? []).map(formatAuthor).join(', ');

/** Surname to sort by: the part before the comma, otherwise the last word */
export const authorSortKey = (name: string | undefined): string => {
  if (!name) return '';
  const match = name.match(SURNAME_FIRST);
  if (match) return `${match[1]} ${match[2]}`;
  const parts = name.trim().split(/\s+/);
  return `${parts[parts.length - 1]} ${parts.slice(0, -1).join(' ')}`.trim();
};

/** Compare books by their first author's surname */
export const compareByAuthor = (
  a: { authors?: string[] | null },
  b: { authors?: string[] | null }
): number =>
  authorSortKey(a.authors?.[0]).localeCompare(authorSortKey(b.authors?.[0]));

/** Case-insensitive author match against both the stored and displayed name */
export const authorMatches = (
  authors: string[] | null | undefined,
  term: string
): boolean =>
  (authors ?? []).some(
    (a) => a.toLowerCase().includes(term) || formatAuthor(a).toLowerCase().includes(term)
  );
