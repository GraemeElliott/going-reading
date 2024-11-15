import axios from 'axios';
import type {
  Book,
  APIBookResponse,
  ScoredBook,
  CacheEntry,
} from '@/types/book';
import type { Author } from '@/types/author';

const apiKey = import.meta.env.VITE_ISBNDB_API_KEY;
const baseURL = 'https://api2.isbndb.com';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTHOR_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for authors
const searchCache = new Map<string, CacheEntry>();

// Initialize axios instance with common configuration
const api = axios.create({
  baseURL,
  headers: {
    Authorization: apiKey,
    'Content-Type': 'application/json',
  },
});

// Add error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status !== 404) {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Utility functions
const mapAPIBookToBook = (book: APIBookResponse): Book => {
  // Ensure date_published is properly formatted if it exists
  let formattedDate = book.date_published;
  if (formattedDate) {
    // If it's just a year, keep it as is
    if (!/^\d{4}$/.test(formattedDate)) {
      // Otherwise try to extract the year
      const matches = formattedDate.match(/\d{4}/);
      formattedDate = matches ? matches[0] : formattedDate;
    }
  }

  return {
    isbn: book.isbn13 || book.isbn || '',
    title: book.title || 'Unknown Title',
    title_long: book.title_long || book.title || 'Unknown Title',
    authors: Array.isArray(book.authors)
      ? book.authors
      : book.authors
      ? [book.authors]
      : ['Unknown Author'],
    image: book.image || '/default-book-cover.jpg',
    date_published: formattedDate,
    synopsis: book.synopsis || '',
    language: book.language || 'en',
    binding: book.binding || 'Unknown Format',
    pages: typeof book.pages === 'number' ? book.pages : 0,
    subjects: book.subjects || [],
    publisher: book.publisher || 'Unknown Publisher',
    other_isbns: book.other_isbns,
  };
};

const calculateRelevanceScore = (book: Book, query: string): number => {
  const queryLower = query.toLowerCase().trim();
  const titleLower = book.title.toLowerCase();
  const queryWords = queryLower.split(/\s+/);
  let score = 0;

  // Exact match gets highest score
  if (titleLower === queryLower) {
    score += 100;
  }

  // Title starts with query
  if (titleLower.startsWith(queryLower)) {
    score += 50;
  }

  // Calculate word match score
  const matchedWords = queryWords.filter((word) => titleLower.includes(word));
  score += (matchedWords.length / queryWords.length) * 30;

  // Check for word order
  const consecutiveWords = queryWords.join(' ');
  if (titleLower.includes(consecutiveWords)) {
    score += 20;
  }

  // Author match bonus
  const authorsLower = book.authors.map((author) => author.toLowerCase());
  const hasAuthorMatch = authorsLower.some((author) =>
    queryWords.some((word) => author.includes(word))
  );
  if (hasAuthorMatch) {
    score += 10;
  }

  // Lower the priority of very short or very long titles that don't exactly match
  if (titleLower !== queryLower) {
    if (book.title.length < query.length / 2) {
      score -= 10;
    } else if (book.title.length > query.length * 3) {
      score -= 5;
    }
  }

  return score;
};

// Search functions
const searchByTitle = async (
  query: string,
  page: number = 1
): Promise<Book[]> => {
  const response = await api.get(
    `/books/${encodeURIComponent(query)}?page=${page}`
  );
  const books = (response.data.books || []) as APIBookResponse[];

  // Map and score books
  const scoredBooks: ScoredBook[] = books
    .map(
      (book: APIBookResponse): ScoredBook => ({
        ...mapAPIBookToBook(book),
        score: 0, // Will be calculated next
      })
    )
    .map(
      (book: ScoredBook): ScoredBook => ({
        ...book,
        score: calculateRelevanceScore(book, query),
      })
    )
    .sort((a: ScoredBook, b: ScoredBook) => b.score - a.score)
    .filter((book: ScoredBook) => book.score > 10);

  // Return books without the score property
  return scoredBooks.map(({ score, ...bookData }) => bookData as Book);
};

const searchByAuthor = async (
  query: string,
  page: number = 1
): Promise<Author[]> => {
  const authorResponse = await api.get(
    `/authors/${encodeURIComponent(query)}?page=${page}`
  );
  const authors = authorResponse.data.authors;

  if (!authors?.length) return [];

  const queryLower = query.toLowerCase();

  return authors
    .filter((name: string) => typeof name === 'string' && name.trim())
    .map((name: string) => ({
      type: 'author' as const,
      name: name.trim(),
      books: [],
    }))
    .sort((a: Author, b: Author) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      if (aName === queryLower && bName !== queryLower) return -1;
      if (bName === queryLower && aName !== queryLower) return 1;

      if (aName.startsWith(queryLower) && !bName.startsWith(queryLower))
        return -1;
      if (bName.startsWith(queryLower) && !aName.startsWith(queryLower))
        return 1;

      return 0;
    });
};

const searchByIsbn = async (isbn: string): Promise<Book[]> => {
  const response = await api.get(`/books/${isbn}`);
  const bookData = response.data.books?.[0];

  if (!bookData) return [];

  return [mapAPIBookToBook(bookData)];
};

// Cache management
const getCachedResults = (
  cacheKey: string,
  searchType: 'title' | 'author' | 'isbn'
): { results: (Book | Author)[]; total: number } | null => {
  const cached = searchCache.get(cacheKey);
  const duration =
    searchType === 'author' ? AUTHOR_CACHE_DURATION : CACHE_DURATION;

  if (cached && Date.now() - cached.timestamp < duration) {
    return {
      results: cached.results.slice(0, 5), // Only slice when retrieving from cache
      total: cached.results.length,
    };
  }

  return null;
};

const setCacheResults = (
  cacheKey: string,
  results: (Book | Author)[]
): void => {
  searchCache.set(cacheKey, {
    timestamp: Date.now(),
    results, // Store full results in cache
  });
};

// Public API
const isbndbService = {
  async searchQuery(
    query: string,
    searchType: 'title' | 'author' | 'isbn' = 'title',
    page: number = 1
  ): Promise<{ results: (Book | Author)[]; total: number }> {
    if (!query || query.length < 3) {
      return { results: [], total: 0 };
    }

    const cacheKey = `${searchType}:${query}:${page}`;
    const cachedResults = getCachedResults(cacheKey, searchType);

    if (cachedResults) {
      return cachedResults;
    }

    try {
      let results: (Book | Author)[];

      switch (searchType) {
        case 'author':
          results = await searchByAuthor(query, page);
          break;
        case 'isbn':
          results = await searchByIsbn(query);
          break;
        case 'title':
        default:
          results = await searchByTitle(query, page);
      }

      setCacheResults(cacheKey, results); // Store full results

      return {
        results: results.slice(0, 5), // Only slice when returning
        total: results.length,
      };
    } catch (error) {
      console.error('Search error:', error);
      return { results: [], total: 0 };
    }
  },

  async getBookByIsbn(isbn: string): Promise<Book | null> {
    if (!isbn) {
      return null;
    }

    try {
      const books = await searchByIsbn(isbn);
      return books[0] || null;
    } catch (error) {
      console.error('ISBN lookup error:', error);
      return null;
    }
  },
};

export default isbndbService;
