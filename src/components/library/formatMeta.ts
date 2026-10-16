import type { LibraryFormat } from '@/types/library';

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
