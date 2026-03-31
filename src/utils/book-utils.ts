import type { BookStatus, UserBook } from '../types/book';

export const extractYear = (
  dateStr: string | undefined | null
): number | null => {
  if (!dateStr) return null;

  // If it's already a year (4 digits), convert to number
  if (/^\d{4}$/.test(dateStr)) {
    return parseInt(dateStr, 10);
  }

  // Try to extract year from the date string
  const matches = dateStr.toString().match(/\d{4}/);
  if (matches) {
    return parseInt(matches[0], 10);
  }

  return null;
};

export const sortBooksByDate = (
  books: UserBook[],
  status: BookStatus
): UserBook[] => {
  if (status === 'read') {
    return books.sort((a, b) => {
      const dateA = a.date_finished
        ? new Date(a.date_finished).getTime()
        : new Date(a.date_added).getTime();
      const dateB = b.date_finished
        ? new Date(b.date_finished).getTime()
        : new Date(b.date_added).getTime();
      return dateB - dateA;
    });
  }

  return books.sort(
    (a, b) =>
      new Date(b.date_added).getTime() - new Date(a.date_added).getTime()
  );
};

export const groupBooksByStatus = (
  books: UserBook[]
): Record<BookStatus, UserBook[]> => {
  const groups: Record<BookStatus, UserBook[]> = {
    'want-to-read': [],
    'currently-reading': [],
    read: [],
    'did-not-finish': [],
    '': [],
  };

  books.forEach((book) => {
    if (book.status in groups) {
      groups[book.status].push(book);
    }
  });

  // Sort books in each group
  Object.keys(groups).forEach((status) => {
    groups[status as BookStatus] = sortBooksByDate(
      groups[status as BookStatus],
      status as BookStatus
    );
  });

  return groups;
};

// Ordered most-specific first so that e.g. "Science Fiction" wins over "Fiction"
const GENRE_KEYWORD_MAP: [string[], string][] = [
  [['science fiction', 'sci-fi', 'space opera', 'cyberpunk', 'dystopian', 'steampunk', 'time travel'], 'Science Fiction'],
  [['historical fiction', 'historical novel'], 'Historical Fiction'],
  [['graphic novel', 'comics', 'manga', 'comic book'], 'Graphic Novel & Comics'],
  [['young adult', 'teen fiction', 'teen & young adult'], 'Young Adult'],
  [['juvenile fiction', "children's", 'picture book', 'middle grade', 'juvenile nonfiction'], "Children's"],
  [['mystery', 'detective', 'crime fiction', 'cozy mystery', 'police procedural', 'whodunit'], 'Mystery & Thriller'],
  [['thriller', 'suspense', 'noir', 'spy fiction', 'espionage'], 'Mystery & Thriller'],
  [['horror', 'ghost stories', 'supernatural fiction', 'occult fiction'], 'Horror'],
  [['romance', 'love stories', 'romantic fiction'], 'Romance'],
  [['fantasy', 'epic fantasy', 'urban fantasy', 'fairy tales', 'mythology', 'sword and sorcery'], 'Fantasy'],
  [['action & adventure', 'action and adventure', 'adventure fiction'], 'Adventure'],
  [['fiction'], 'Literary Fiction'],
  [['biography', 'autobiography', 'memoir'], 'Biography & Memoir'],
  [['true crime'], 'True Crime'],
  [['history', 'historical'], 'History'],
  [['science', 'astronomy', 'physics', 'chemistry', 'biology', 'nature', 'environment', 'ecology', 'natural history'], 'Science & Nature'],
  [['technology', 'computers', 'computing', 'engineering', 'artificial intelligence', 'programming', 'software'], 'Technology & Computing'],
  [['self-help', 'personal development', 'motivation', 'productivity'], 'Self-Help'],
  [['business', 'economics', 'finance', 'entrepreneurship', 'management', 'marketing', 'investing'], 'Business & Economics'],
  [['political', 'politics', 'social science', 'sociology', 'current events', 'public policy'], 'Politics & Society'],
  [['psychology', 'cognitive', 'mental health', 'behavioral'], 'Psychology & Philosophy'],
  [['philosophy', 'ethics', 'logic'], 'Psychology & Philosophy'],
  [['health', 'fitness', 'medical', 'nutrition', 'wellness', 'medicine'], 'Health & Wellness'],
  [['travel', 'geography', 'exploration'], 'Travel'],
  [['art', 'photography', 'design', 'architecture', 'film', 'cinema', 'theater'], 'Arts & Music'],
  [['music'], 'Arts & Music'],
  [['religion', 'spirituality', 'theology', 'faith', 'mindfulness', 'meditation'], 'Religion & Spirituality'],
  [['cooking', 'food', 'culinary', 'baking', 'recipes'], 'Cooking & Food'],
  [['humor', 'comedy', 'satire'], 'Humor'],
  [['poetry', 'verse'], 'Poetry'],
];

export const mapToStandardGenre = (raw: string): string | null => {
  const lower = raw.toLowerCase();
  for (const [keywords, genre] of GENRE_KEYWORD_MAP) {
    if (keywords.some((k) => lower.includes(k))) return genre;
  }
  return null;
};

export const normaliseSubjects = (subjects?: string[]): string[] => {
  if (!subjects || subjects.length === 0) return [];
  return [
    ...new Set(
      subjects.map((s) => mapToStandardGenre(s)).filter(Boolean) as string[]
    ),
  ];
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};
