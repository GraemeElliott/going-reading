import axios from 'axios';
import type {
  Book,
  APIBookResponse,
  ScoredBook,
  SearchCache,
  AuthorBookResponse,
} from '@/types/book';
import type { Author } from '@/types/author';

const apiKey = import.meta.env.VITE_ISBNDB_API_KEY;
const baseURL = 'https://api2.isbndb.com';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTHOR_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for authors
const searchCache = new Map<string, SearchCache<Book | Author>>();

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
const mapAPIBookToBook = (
  bookData: APIBookResponse | AuthorBookResponse
): Book => {
  // Handle nested book structure from author endpoint
  const book: APIBookResponse = 'book' in bookData ? bookData.book : bookData;

  // Default book object
  const defaultBook: Book = {
    isbn: '',
    title: 'Unknown Title',
    title_long: 'Unknown Title',
    authors: ['Unknown Author'],
    image: '/default-book-cover.jpg',
    date_published: '',
    synopsis: '',
    language: 'en',
    binding: 'Unknown Format',
    pages: 0,
    subjects: [],
    publisher: 'Unknown Publisher',
    other_isbns: [],
    overview: '',
    excerpt: '',
    msrp: 0,
    edition: '',
    dimensions: '',
  };

  if (!book) {
    return defaultBook;
  }

  // Ensure date_published is properly formatted if it exists
  let formattedDate = book.date_published;
  if (formattedDate) {
    // If it's just a year, keep it as is
    if (!/^\d{4}$/.test(formattedDate.toString())) {
      // Otherwise try to extract the year
      const matches = formattedDate.toString().match(/\d{4}/);
      formattedDate = matches ? matches[0] : formattedDate;
    }
  }

  return {
    isbn: book.isbn13 || book.isbn || defaultBook.isbn,
    title: book.title || defaultBook.title,
    title_long: book.title_long || book.title || defaultBook.title_long,
    authors: Array.isArray(book.authors)
      ? book.authors
      : book.authors
      ? [book.authors]
      : defaultBook.authors,
    image: book.image || defaultBook.image,
    date_published: formattedDate?.toString() || defaultBook.date_published,
    synopsis: book.synopsis || defaultBook.synopsis,
    language: book.language || defaultBook.language,
    binding: book.binding || defaultBook.binding,
    pages: typeof book.pages === 'number' ? book.pages : defaultBook.pages,
    subjects: book.subjects || defaultBook.subjects,
    publisher: book.publisher || defaultBook.publisher,
    other_isbns: book.other_isbns || defaultBook.other_isbns,
    overview: book.overview || defaultBook.overview,
    excerpt: book.excerpt || defaultBook.excerpt,
    msrp: book.msrp || defaultBook.msrp,
    edition: book.edition || defaultBook.edition,
    dimensions: book.dimensions || defaultBook.dimensions,
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

const getAuthorDetails = async (
  authorName: string,
  page: number = 1
): Promise<Author | null> => {
  try {
    // Use the author endpoint directly with pagination
    const encodedName = authorName
      .split(' ')
      .map((part: string) => encodeURIComponent(part))
      .join('%20');
    const authorUrl = `/author/${encodedName}?page=${page}&pageSize=20`;

    const authorResponse = await api.get(authorUrl);

    if (!authorResponse.data?.books) {
      console.error('No author books found');
      return null;
    }

    // Map the books data to our Book type
    const books = authorResponse.data.books.map(
      (bookData: AuthorBookResponse) => mapAPIBookToBook(bookData)
    );

    // Get the total from the response
    const total =
      authorResponse.data.total ||
      authorResponse.data.total_items ||
      authorResponse.data.total_books;

    return {
      type: 'author',
      name: authorResponse.data.author || authorName,
      books: books,
      total: total,
      bio: authorResponse.data.bio || undefined,
      photoUrl: authorResponse.data.photo_url || undefined,
    };
  } catch (error) {
    console.error('Error fetching author details:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Status:', error.response?.status);
      console.error('Request URL:', error.config?.url);

      // If it's a 404, return null instead of throwing
      if (error.response?.status === 404) {
        return null;
      }
    }
    throw error;
  }
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
): (Book | Author)[] | null => {
  const cached = searchCache.get(cacheKey);
  const duration =
    searchType === 'author' ? AUTHOR_CACHE_DURATION : CACHE_DURATION;

  if (cached && Date.now() - cached.timestamp < duration) {
    return cached.results;
  }

  return null;
};

const setCacheResults = (
  cacheKey: string,
  results: (Book | Author)[]
): void => {
  searchCache.set(cacheKey, {
    timestamp: Date.now(),
    results,
  });
};

// Public API
const isbndbService = {
  async searchQuery(
    query: string,
    searchType: 'title' | 'author' | 'isbn' = 'title',
    page: number = 1
  ): Promise<(Book | Author)[]> {
    if (!query || query.length < 3) {
      return [];
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

      setCacheResults(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
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
  async getAuthorDetails(
    authorName: string,
    page: number = 1
  ): Promise<Author | null> {
    if (!authorName) {
      return null;
    }

    try {
      return await getAuthorDetails(authorName, page);
    } catch (error) {
      console.error('Author details lookup error:', error);
      return null;
    }
  },
};

export default isbndbService;
