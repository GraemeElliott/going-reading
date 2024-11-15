export interface Author {
  type: 'author';
  name: string;
  books: string[];
  photoUrl?: string;
  bio?: string;
}
