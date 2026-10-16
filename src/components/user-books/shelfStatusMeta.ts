import type { BookStatus } from '@/types/book';

// Colour, icon and short label for each shelf, used wherever a status is shown
// as information (not as a control). Read = green, Want to read = blue,
// Currently reading = teal (accent), Did not finish = amber.
export const SHELF_STATUS_META: Record<
  Exclude<BookStatus, ''>,
  { label: string; icon: string; textClass: string }
> = {
  'want-to-read': {
    label: 'Want to read',
    icon: 'fa-solid fa-bookmark',
    textClass: 'text-gr-shelf-want',
  },
  'currently-reading': {
    label: 'Reading',
    icon: 'fa-solid fa-book-open',
    textClass: 'text-gr-accent',
  },
  read: {
    label: 'Read',
    icon: 'fa-solid fa-circle-check',
    textClass: 'text-gr-shelf-read',
  },
  'did-not-finish': {
    label: 'Did not finish',
    icon: 'fa-solid fa-circle-xmark',
    textClass: 'text-gr-shelf-dnf',
  },
};
