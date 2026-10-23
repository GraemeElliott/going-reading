// Response shapes for the external book APIs used by bookApiService.
// Only the fields we read are typed.

// Hardcover — https://docs.hardcover.app/api/getting-started/
export interface HardcoverImage {
  url?: string | null;
}

export interface HardcoverGraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

// search() returns Typesense results; `document` fields depend on query_type
export interface HardcoverSearchResults<T> {
  found?: number;
  hits?: { document: T }[];
}

export interface HardcoverSearchData<T> {
  search: { results: HardcoverSearchResults<T> };
}

export interface HardcoverSearchBook {
  id: number | string;
  title?: string;
  subtitle?: string | null;
  author_names?: string[];
  isbns?: (string | number)[];
  image?: HardcoverImage | null;
  release_year?: number | null;
  pages?: number | null;
  genres?: string[];
  description?: string | null;
}

export interface HardcoverSearchAuthor {
  id: number | string;
  name?: string;
  alternate_names?: string[];
  books_count?: number;
}

// cached_tags groups tags by category, e.g. { Genre: [{ tag: "Fantasy" }], Mood: [...] }
export type HardcoverCachedTags = Record<string, { tag: string }[]>;

export interface HardcoverEdition {
  isbn_13?: string | null;
  isbn_10?: string | null;
  pages?: number | null;
  release_date?: string | null;
  publisher?: { name: string } | null;
  image?: HardcoverImage | null;
}

export interface HardcoverBook {
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  pages?: number | null;
  release_year?: number | null;
  cached_image?: HardcoverImage | null;
  cached_tags?: HardcoverCachedTags | null;
  contributions?: { author?: { name: string } | null }[];
  default_physical_edition?: HardcoverEdition | null;
  editions?: HardcoverEdition[];
}

export interface HardcoverEditionWithBook extends HardcoverEdition {
  book: HardcoverBook;
}

export interface HardcoverAuthor {
  name: string;
  bio?: string | null;
  cached_image?: HardcoverImage | null;
  contributions_aggregate?: { aggregate: { count: number } };
  contributions: { book: HardcoverBook }[];
}

// Open Library — https://openlibrary.org/developers/api
export interface OpenLibrarySearchDoc {
  key: string;
  title?: string;
  subtitle?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  number_of_pages_median?: number;
  publisher?: string[];
  isbn?: string[];
  subject?: string[];
  editions?: {
    docs: { isbn?: string[]; cover_i?: number; publisher?: string[] }[];
  };
}

export interface OpenLibrarySearchResponse {
  numFound: number;
  docs: OpenLibrarySearchDoc[];
}

export interface OpenLibraryAuthorDoc {
  key: string;
  name: string;
  alternate_names?: string[];
  work_count?: number;
}

export interface OpenLibraryAuthorSearchResponse {
  numFound: number;
  docs: OpenLibraryAuthorDoc[];
}

export type OpenLibraryText = string | { type: string; value: string };

export interface OpenLibraryAuthor {
  name?: string;
  bio?: OpenLibraryText;
  photos?: number[];
}

// /api/books?jscmd=data
export interface OpenLibraryBookData {
  key?: string; // edition key, e.g. "/books/OL33891995M"
  title?: string;
  subtitle?: string;
  authors?: { name: string }[];
  publishers?: { name: string }[];
  publish_date?: string;
  number_of_pages?: number;
  subjects?: { name: string }[];
  cover?: { small?: string; medium?: string; large?: string };
}

// /isbn/{isbn}.json and /works/{id}.json
export interface OpenLibraryRecord {
  description?: OpenLibraryText;
  works?: { key: string }[];
}
