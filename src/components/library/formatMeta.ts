import type { BookStatus } from '@/types/book';
import { STATUS_DISPLAY_NAMES } from '@/types/book';
import type { LibraryFormat } from '@/types/library';

// Shelf picker in the add and edit dialogs. Radix Select can't use '' as a
// value, so 'none' stands for "not on a shelf". Read is set by the "Mark as
// read" checkbox (which also asks for a finish date), so it's only shown
// while that's ticked.
export type ShelfChoice = Exclude<BookStatus, ''> | 'none';

const shelfOption = (value: Exclude<BookStatus, ''>) => ({
  value,
  label: STATUS_DISPLAY_NAMES[value],
});

export const NO_SHELF_OPTION = { value: 'none' as ShelfChoice, label: 'No shelf' };
export const SHELF_OPTIONS: { value: ShelfChoice; label: string }[] = [
  shelfOption('want-to-read'),
  shelfOption('currently-reading'),
  shelfOption('did-not-finish'),
];
export const READ_SHELF_OPTION = shelfOption('read');

export const FORMAT_META: Record<
  LibraryFormat,
  { label: string; icon: string; description: string }
> = {
  physical: {
    label: 'Physical',
    icon: 'fa-solid fa-book',
    description: 'A printed copy on your shelf',
  },
  digital: {
    label: 'Digital',
    icon: 'fa-solid fa-tablet-screen-button',
    description: 'An ebook or other digital copy',
  },
};

const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

/** 'YYYY-MM-DD' -> '14 Oct 2026' (parsed as a local date, not UTC) */
export const formatLibraryDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

/** Today as a local 'YYYY-MM-DD' */
export const todayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
