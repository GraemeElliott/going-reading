import axios from 'axios';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/supabase/supabase';
import type { Book, ScoredBook, SearchCache } from '@/types/book';
import type { Author } from '@/types/author';
import type {
  HardcoverAuthor,
  HardcoverBook,
  HardcoverCachedTags,
  HardcoverEdition,
  HardcoverEditionWithBook,
  HardcoverGraphQLResponse,
  HardcoverSearchAuthor,
  HardcoverSearchBook,
  HardcoverSearchData,
  HardcoverSearchResults,
  OpenLibraryAuthor,
  OpenLibraryAuthorDoc,
  OpenLibraryAuthorSearchResponse,
  OpenLibraryBookData,
  OpenLibraryRecord,
  OpenLibrarySearchDoc,
  OpenLibrarySearchResponse,
  OpenLibraryText,
} from '@/types/book-api';

// Hardcover is the primary source (descriptions, genres, new releases). Its
// token must stay server-side, so requests go through the `hardcover` Supabase
// Edge Function. Open Library is free and keyless, so it fills gaps — older
// titles, missing descriptions — and keeps the site working if Hardcover is down.
const PAGE_SIZE = 20;

const DEFAULT_COVER = '/default-book-cover.jpg';
const UNKNOWN_TITLE = 'Unknown Title';
const UNKNOWN_AUTHOR = 'Unknown Author';
const UNKNOWN_PUBLISHER = 'Unknown Publisher';

const OPEN_LIBRARY_SEARCH_FIELDS = [
  'key', 'title', 'subtitle', 'author_name', 'first_publish_year', 'cover_i',
  'number_of_pages_median', 'publisher', 'isbn', 'subject',
  'editions', 'editions.isbn', 'editions.cover_i', 'editions.publisher',
].join(',');

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTHOR_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for authors
const BOOK_STORAGE_DURATION = 7 * 24 * 60 * 60 * 1000; // ISBN lookups persist for a week
const BOOK_STORAGE_PREFIX = 'book-api:v2:isbn:';
const searchCache = new Map<string, SearchCache<Book | Author>>();
const hardcoverAuthorIdCache = new Map<string, number | null>();
const openLibraryAuthorCache = new Map<string, OpenLibraryAuthorDoc | null>();

const openLibrary = axios.create({ baseURL: 'https://openlibrary.org' });

// Add error handling interceptor
openLibrary.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status !== 404) {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Hardcover GraphQL queries
const BOOK_FIELDS = `
  title
  subtitle
  description
  pages
  release_year
  cached_image
  cached_tags
  contributions(where: {contributor_role: {slug: {_eq: "author"}}}) {
    author { name }
  }
`;

const SEARCH_QUERY = `
  query Search($query: String!, $type: String!, $page: Int!, $perPage: Int!) {
    search(query: $query, query_type: $type, page: $page, per_page: $perPage) {
      results
    }
  }
`;

const BOOK_BY_ISBN_QUERY = `
  query BookByIsbn($isbn: String!) {
    editions(
      where: {_or: [{isbn_13: {_eq: $isbn}}, {isbn_10: {_eq: $isbn}}]}
      limit: 1
    ) {
      isbn_13
      isbn_10
      pages
      release_date
      publisher { name }
      image { url }
      book { ${BOOK_FIELDS} }
    }
  }
`;

const AUTHOR_BOOKS_QUERY = `
  query AuthorBooks($id: Int!, $limit: Int!, $offset: Int!) {
    authors_by_pk(id: $id) {
      name
      bio
      cached_image
      contributions_aggregate(where: {
        contributable_type: {_eq: "Book"}
        contributor_role: {slug: {_eq: "author"}}
        book: {canonical_id: {_is_null: true}, is_partial_book: {_eq: false}}
      }) {
        aggregate { count }
      }
      contributions(
        where: {
          contributable_type: {_eq: "Book"}
          contributor_role: {slug: {_eq: "author"}}
          book: {canonical_id: {_is_null: true}, is_partial_book: {_eq: false}}
        }
        order_by: {book: {users_count: desc}}
        limit: $limit
        offset: $offset
      ) {
        book {
          ${BOOK_FIELDS}
          default_physical_edition { isbn_13 isbn_10 publisher { name } }
          editions(
            where: {isbn_13: {_is_null: false}}
            order_by: {users_count: desc}
            limit: 1
          ) {
            isbn_13
            publisher { name }
          }
        }
      }
    }
  }
`;

// Utility functions
const emptyBook = (): Book => ({
  isbn: '',
  title: UNKNOWN_TITLE,
  title_long: UNKNOWN_TITLE,
  authors: [UNKNOWN_AUTHOR],
  image: DEFAULT_COVER,
  date_published: '',
  synopsis: '',
  language: 'en',
  binding: 'Unknown Format',
  pages: 0,
  subjects: [],
  publisher: UNKNOWN_PUBLISHER,
  other_isbns: [],
  overview: '',
  excerpt: '',
  msrp: 0,
  edition: '',
  dimensions: '',
});

const isBook = (book: Book | null): book is Book => book !== null;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toYear = (date?: string | number | null): string => {
  if (!date) return '';
  const text = date.toString();
  return text.match(/\d{4}/)?.[0] ?? text;
};

const toLongTitle = (title?: string | null, subtitle?: string | null): string =>
  title && subtitle ? `${title}: ${subtitle}` : title || UNKNOWN_TITLE;

const toHttps = (url: string): string => url.replace(/^http:/, 'https:');

// Cover-by-ID URLs aren't rate limited, unlike cover-by-ISBN
const openLibraryCover = (coverId?: number): string | undefined =>
  coverId && coverId > 0
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : undefined;

// Checks the check digit, which catches mistyped ISBNs in user-edited data
const isValidIsbn = (isbn: string): boolean => {
  if (/^\d{13}$/.test(isbn)) {
    const sum = [...isbn].reduce(
      (total, digit, i) => total + Number(digit) * (i % 2 ? 3 : 1),
      0
    );
    return sum % 10 === 0;
  }
  if (/^\d{9}[\dX]$/.test(isbn)) {
    const sum = [...isbn].reduce(
      (total, digit, i) => total + (digit === 'X' ? 10 : Number(digit)) * (10 - i),
      0
    );
    return sum % 11 === 0;
  }
  return false;
};

// Book records list every edition's ISBN in no particular order; prefer an
// English-language ISBN-13 (978-0 / 978-1) so links open a familiar edition.
// The lists can also contain Amazon ASINs, which aren't ISBNs.
const pickIsbn = (
  isbns: (string | number | null | undefined)[] = []
): string | undefined => {
  const valid = isbns
    .map((isbn) => (isbn == null ? '' : String(isbn)))
    .filter(isValidIsbn);
  const isbn13s = valid.filter((isbn) => isbn.length === 13);
  return isbn13s.find((isbn) => /^978[01]/.test(isbn)) ?? isbn13s[0] ?? valid[0];
};

const hardcoverGenres = (tags?: HardcoverCachedTags | null): string[] =>
  (tags?.Genre ?? []).map((genre) => genre.tag).filter(Boolean);

// Open Library subjects mix genres with characters, places and list tags
// (e.g. "nyt:..."); keep the leading genre-like ones for normaliseSubjects
const cleanSubjects = (subjects: string[] = []): string[] =>
  subjects.filter((subject) => !subject.includes(':')).slice(0, 10);

const openLibraryText = (text?: OpenLibraryText): string =>
  typeof text === 'string' ? text : text?.value ?? '';

// Descriptions from both APIs are user-edited, so escape them before
// BookDetails renders the synopsis as HTML. Simple formatting tags without
// attributes (e.g. Hardcover's <i>) are safe to keep.
const plainTextToHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;(\/?)(i|b|em|strong|p|br)\s*\/?&gt;/gi, '<$1$2>')
    .replace(/\r?\n/g, '<br>');

// Bios often end with markdown source links, e.g. "([Source][1])\n\n[1]: https://..."
const cleanBio = (bio: string): string =>
  bio
    .replace(/\(\[Source\]\[\d+\]\)/gi, '')
    .replace(/^\[\d+\]:.*$/gm, '')
    .trim();

const normaliseName = (name: string): string =>
  name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// Mapping functions
const mapHardcoverSearchBook = (doc: HardcoverSearchBook): Book | null => {
  const isbn = pickIsbn(doc.isbns);
  if (!isbn) return null;

  return {
    ...emptyBook(),
    isbn,
    title: doc.title || UNKNOWN_TITLE,
    title_long: toLongTitle(doc.title, doc.subtitle),
    authors: doc.author_names?.length ? doc.author_names : [UNKNOWN_AUTHOR],
    image: doc.image?.url || DEFAULT_COVER,
    date_published: toYear(doc.release_year),
    synopsis: plainTextToHtml(doc.description ?? ''),
    pages: doc.pages || 0,
    subjects: doc.genres ?? [],
  };
};

const mapHardcoverBook = (
  book: HardcoverBook,
  isbn: string,
  edition?: HardcoverEdition | null
): Book => {
  const authors = (book.contributions ?? [])
    .map((contribution) => contribution.author?.name)
    .filter((name): name is string => !!name);

  return {
    ...emptyBook(),
    isbn,
    title: book.title || UNKNOWN_TITLE,
    title_long: toLongTitle(book.title, book.subtitle),
    authors: authors.length ? authors : [UNKNOWN_AUTHOR],
    image: edition?.image?.url || book.cached_image?.url || DEFAULT_COVER,
    date_published: toYear(book.release_year ?? edition?.release_date),
    synopsis: plainTextToHtml(book.description ?? ''),
    pages: edition?.pages || book.pages || 0,
    subjects: hardcoverGenres(book.cached_tags),
    publisher: edition?.publisher?.name || UNKNOWN_PUBLISHER,
  };
};

const mapOpenLibraryDoc = (doc: OpenLibrarySearchDoc): Book | null => {
  const edition = doc.editions?.docs[0];
  const isbn = pickIsbn(edition?.isbn) ?? pickIsbn(doc.isbn);
  if (!isbn) return null;

  return {
    ...emptyBook(),
    isbn,
    title: doc.title || UNKNOWN_TITLE,
    title_long: toLongTitle(doc.title, doc.subtitle),
    authors: doc.author_name?.length ? doc.author_name : [UNKNOWN_AUTHOR],
    image: openLibraryCover(edition?.cover_i ?? doc.cover_i) || DEFAULT_COVER,
    date_published: toYear(doc.first_publish_year),
    pages: doc.number_of_pages_median || 0,
    subjects: cleanSubjects(doc.subject),
    publisher:
      edition?.publisher?.[0] || doc.publisher?.[0] || UNKNOWN_PUBLISHER,
  };
};

const mapOpenLibraryBookData = (
  isbn: string,
  data: OpenLibraryBookData
): Book => ({
  ...emptyBook(),
  isbn,
  title: data.title || UNKNOWN_TITLE,
  title_long: toLongTitle(data.title, data.subtitle),
  authors: data.authors?.length
    ? data.authors.map((author) => author.name)
    : [UNKNOWN_AUTHOR],
  image: data.cover?.large ? toHttps(data.cover.large) : DEFAULT_COVER,
  date_published: toYear(data.publish_date),
  pages: data.number_of_pages || 0,
  subjects: cleanSubjects(data.subjects?.map((subject) => subject.name)),
  publisher: data.publishers?.[0]?.name || UNKNOWN_PUBLISHER,
});

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

const rankByRelevance = (books: Book[], query: string): Book[] => {
  const unique = [...new Map(books.map((book) => [book.isbn, book])).values()];

  const scoredBooks: ScoredBook[] = unique
    .map((book): ScoredBook => ({
      ...book,
      score: calculateRelevanceScore(book, query),
    }))
    .sort((a: ScoredBook, b: ScoredBook) => b.score - a.score)
    .filter((book: ScoredBook) => book.score > 10);

  // Return books without the score property
  return scoredBooks.map(({ score, ...bookData }) => bookData as Book);
};

// Hardcover requests
const hardcoverQuery = async <T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> => {
  const send = () =>
    supabase.functions.invoke<HardcoverGraphQLResponse<T>>('hardcover', {
      body: { query, variables },
    });

  let { data, error } = await send();

  // Hardcover documents 503 as temporary and safe to retry
  if (error instanceof FunctionsHttpError && error.context?.status === 503) {
    await delay(400);
    ({ data, error } = await send());
  }

  if (error) throw error;
  if (!data?.data) {
    throw new Error(data?.errors?.[0]?.message ?? 'Empty Hardcover response');
  }
  return data.data;
};

const hardcoverSearch = async <T>(
  query: string,
  type: 'Book' | 'Author',
  page: number = 1,
  perPage: number = PAGE_SIZE
): Promise<HardcoverSearchResults<T>> => {
  const data = await hardcoverQuery<HardcoverSearchData<T>>(SEARCH_QUERY, {
    query,
    type,
    page,
    perPage,
  });
  return data.search.results ?? {};
};

const getHardcoverBookByIsbn = async (isbn: string): Promise<Book | null> => {
  const data = await hardcoverQuery<{ editions: HardcoverEditionWithBook[] }>(
    BOOK_BY_ISBN_QUERY,
    { isbn }
  );
  const edition = data.editions[0];
  return edition ? mapHardcoverBook(edition.book, isbn, edition) : null;
};

const findHardcoverAuthorId = async (name: string): Promise<number | null> => {
  const target = normaliseName(name);
  if (hardcoverAuthorIdCache.has(target)) {
    return hardcoverAuthorIdCache.get(target) ?? null;
  }

  const results = await hardcoverSearch<HardcoverSearchAuthor>(
    name,
    'Author',
    1,
    5
  );
  const docs = (results.hits ?? []).map((hit) => hit.document);

  // Prefer an exact name match, ignoring punctuation so "J. R. R. Tolkien"
  // matches "J.R.R. Tolkien"
  const author =
    docs.find((doc) =>
      [doc.name, ...(doc.alternate_names ?? [])].some(
        (candidate) => candidate && normaliseName(candidate) === target
      )
    ) ?? docs[0];
  const id = author ? Number(author.id) : null;

  hardcoverAuthorIdCache.set(target, id);
  return id;
};

const getHardcoverAuthorDetails = async (
  authorName: string,
  page: number
): Promise<Author | null> => {
  const id = await findHardcoverAuthorId(authorName);
  if (id === null) return null;

  const data = await hardcoverQuery<{ authors_by_pk: HardcoverAuthor | null }>(
    AUTHOR_BOOKS_QUERY,
    { id, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }
  );
  const author = data.authors_by_pk;
  if (!author) return null;

  const books = author.contributions
    .map(({ book }) => {
      const edition = book.default_physical_edition;
      const isbn = pickIsbn([
        edition?.isbn_13,
        edition?.isbn_10,
        ...(book.editions ?? []).map((e) => e.isbn_13),
      ]);
      if (!isbn) return null;

      const mapped = mapHardcoverBook(book, isbn);
      mapped.publisher =
        edition?.publisher?.name ||
        book.editions?.[0]?.publisher?.name ||
        UNKNOWN_PUBLISHER;
      return mapped;
    })
    .filter(isBook);

  if (!books.length && page === 1) return null;

  return {
    type: 'author',
    name: authorName,
    books,
    total: author.contributions_aggregate?.aggregate.count,
    bio: author.bio ? cleanBio(author.bio) : undefined,
    photoUrl: author.cached_image?.url || undefined,
  };
};

// Open Library requests
const openLibrarySearch = async (
  params: Record<string, string | number>,
  page: number = 1
): Promise<OpenLibrarySearchResponse> => {
  const response = await openLibrary.get<OpenLibrarySearchResponse>(
    '/search.json',
    {
      params: {
        ...params,
        fields: OPEN_LIBRARY_SEARCH_FIELDS,
        lang: 'en',
        limit: PAGE_SIZE,
        page,
      },
    }
  );
  return response.data;
};

const getOpenLibraryBookData = async (
  isbn: string
): Promise<OpenLibraryBookData | null> => {
  const bibkey = `ISBN:${isbn}`;
  const response = await openLibrary.get<Record<string, OpenLibraryBookData>>(
    '/api/books',
    { params: { bibkeys: bibkey, format: 'json', jscmd: 'data' } }
  );
  return response.data[bibkey] ?? null;
};

// Descriptions live on the edition or, more often, its parent work
const getOpenLibraryDescription = async (
  editionKey: string
): Promise<string> => {
  const { data: edition } = await openLibrary.get<OpenLibraryRecord>(
    `${editionKey}.json`
  );
  const editionText = openLibraryText(edition.description);
  const workKey = edition.works?.[0]?.key;
  if (editionText || !workKey) return editionText;

  const { data: work } = await openLibrary.get<OpenLibraryRecord>(
    `${workKey}.json`
  );
  return openLibraryText(work.description);
};

const findOpenLibraryAuthor = async (
  name: string
): Promise<OpenLibraryAuthorDoc | null> => {
  const target = normaliseName(name);
  if (openLibraryAuthorCache.has(target)) {
    return openLibraryAuthorCache.get(target) ?? null;
  }

  const response = await openLibrary.get<OpenLibraryAuthorSearchResponse>(
    '/search/authors.json',
    { params: { q: name, limit: 10, fields: 'key,name,alternate_names,work_count' } }
  );
  const docs = response.data.docs;

  // Prefer an exact name match; duplicates are common, so take the most prolific
  const exactMatches = docs.filter((doc) =>
    [doc.name, ...(doc.alternate_names ?? [])].some(
      (candidate) => normaliseName(candidate) === target
    )
  );
  const author =
    exactMatches.sort((a, b) => (b.work_count ?? 0) - (a.work_count ?? 0))[0] ??
    docs[0] ??
    null;

  openLibraryAuthorCache.set(target, author);
  return author;
};

const getOpenLibraryAuthorProfile = async (
  key: string
): Promise<Pick<Author, 'bio' | 'photoUrl'>> => {
  const { data } = await openLibrary.get<OpenLibraryAuthor>(
    `/authors/${key}.json`
  );
  const bio = cleanBio(openLibraryText(data.bio));
  const photoId = data.photos?.find((id) => id > 0);

  return {
    bio: bio || undefined,
    photoUrl: photoId
      ? `https://covers.openlibrary.org/a/id/${photoId}-L.jpg`
      : undefined,
  };
};

const getOpenLibraryAuthorDetails = async (
  authorName: string,
  page: number
): Promise<Author | null> => {
  const author = await findOpenLibraryAuthor(authorName);
  if (!author) return null;

  const [profile, works] = await Promise.all([
    getOpenLibraryAuthorProfile(author.key).catch(() => ({})),
    openLibrarySearch({ q: `author_key:${author.key}`, sort: 'readinglog' }, page),
  ]);
  const books = works.docs.map(mapOpenLibraryDoc).filter(isBook);
  if (!books.length && page === 1) return null;

  return {
    type: 'author',
    name: authorName,
    books,
    total: works.numFound,
    ...profile,
  };
};

// Search functions
const searchByTitle = async (
  query: string,
  page: number = 1
): Promise<Book[]> => {
  let books: Book[] = [];
  try {
    const results = await hardcoverSearch<HardcoverSearchBook>(query, 'Book', page);
    books = (results.hits ?? [])
      .map((hit) => mapHardcoverSearchBook(hit.document))
      .filter(isBook);
  } catch (error) {
    console.error('Hardcover search failed, using Open Library:', error);
  }

  if (!books.length) {
    const response = await openLibrarySearch({ title: query }, page);
    books = response.docs.map(mapOpenLibraryDoc).filter(isBook);
  }

  return rankByRelevance(books, query);
};

const searchAuthorNames = async (
  query: string,
  page: number
): Promise<string[]> => {
  try {
    const results = await hardcoverSearch<HardcoverSearchAuthor>(
      query,
      'Author',
      page
    );
    const names = (results.hits ?? [])
      .map((hit) => hit.document.name?.trim())
      .filter((name): name is string => !!name);
    if (names.length) return names;
  } catch (error) {
    console.error('Hardcover author search failed, using Open Library:', error);
  }

  const response = await openLibrary.get<OpenLibraryAuthorSearchResponse>(
    '/search/authors.json',
    {
      params: {
        q: query,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        fields: 'key,name,work_count',
      },
    }
  );
  return [...response.data.docs]
    .sort((a, b) => (b.work_count ?? 0) - (a.work_count ?? 0))
    .map((doc) => doc.name?.trim())
    .filter((name): name is string => !!name);
};

const searchByAuthor = async (
  query: string,
  page: number = 1
): Promise<Author[]> => {
  // Both sources can hold duplicate records per author; keep one of each name
  const seen = new Set<string>();
  const names = (await searchAuthorNames(query, page)).filter((name) => {
    if (seen.has(name.toLowerCase())) return false;
    seen.add(name.toLowerCase());
    return true;
  });

  const queryLower = query.toLowerCase();

  return names
    .map((name: string) => ({
      type: 'author' as const,
      name,
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
    const author = await getHardcoverAuthorDetails(authorName, page);
    if (author) return author;
  } catch (error) {
    console.error('Hardcover author lookup failed, using Open Library:', error);
  }

  return getOpenLibraryAuthorDetails(authorName, page);
};

const lookupByIsbn = async (isbn: string): Promise<Book | null> => {
  const [hardcoverBook, openLibraryData] = await Promise.all([
    getHardcoverBookByIsbn(isbn).catch((error) => {
      console.error('Hardcover ISBN lookup failed:', error);
      return null;
    }),
    getOpenLibraryBookData(isbn).catch(() => null),
  ]);
  const openLibraryBook = openLibraryData
    ? mapOpenLibraryBookData(isbn, openLibraryData)
    : null;

  const primary = hardcoverBook ?? openLibraryBook;
  if (!primary) return null;

  const book: Book = { ...primary, isbn };
  const fallback = hardcoverBook ? openLibraryBook : null;

  if (fallback) {
    if (book.authors[0] === UNKNOWN_AUTHOR) book.authors = fallback.authors;
    if (book.publisher === UNKNOWN_PUBLISHER) book.publisher = fallback.publisher;
    if (book.image === DEFAULT_COVER) book.image = fallback.image;
    if (!book.date_published) book.date_published = fallback.date_published;
    if (!book.pages) book.pages = fallback.pages;
    if (!book.subjects.length) book.subjects = fallback.subjects;
  }

  if (!book.synopsis && openLibraryData?.key) {
    const description = await getOpenLibraryDescription(
      openLibraryData.key
    ).catch(() => '');
    book.synopsis = plainTextToHtml(description);
  }

  return book;
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

// Book details rarely change, so keep them across visits to save API quota
const getStoredBook = (isbn: string): Book | null => {
  try {
    const stored = localStorage.getItem(BOOK_STORAGE_PREFIX + isbn);
    if (!stored) return null;

    const { timestamp, book } = JSON.parse(stored);
    return Date.now() - timestamp < BOOK_STORAGE_DURATION ? book : null;
  } catch {
    return null;
  }
};

const storeBook = (book: Book): void => {
  try {
    localStorage.setItem(
      BOOK_STORAGE_PREFIX + book.isbn,
      JSON.stringify({ timestamp: Date.now(), book })
    );
  } catch {
    // Storage full or unavailable; the lookup still succeeded
  }
};

const getBookByIsbn = async (isbn: string): Promise<Book | null> => {
  const cleanIsbn = isbn.replace(/[^0-9Xx]/g, '').toUpperCase();
  if (!cleanIsbn) return null;

  const stored = getStoredBook(cleanIsbn);
  if (stored) return stored;

  const book = await lookupByIsbn(cleanIsbn);
  if (book) storeBook(book);
  return book;
};

// Public API
const bookApiService = {
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
        case 'isbn': {
          const book = await getBookByIsbn(query);
          results = book ? [book] : [];
          break;
        }
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
      return await getBookByIsbn(isbn);
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

export default bookApiService;
