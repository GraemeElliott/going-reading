import { computed, ref } from 'vue';
import { useDarkModeStore } from '@/store/store';

// Shared chart colours for the dashboard cards, following the theme switch
export function useChartTheme() {
  const darkModeStore = useDarkModeStore();
  const isDark = computed(() => darkModeStore.darkMode);

  /** Read a theme token for canvas drawing; re-read when the theme changes */
  const token = (name: string) =>
    computed(() => {
      void isDark.value;
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    });

  return {
    isDark,
    token,
    gridColor: computed(() => isDark.value ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
    tickColor: computed(() => isDark.value ? '#9ca3af' : '#6b7280'),
    tooltip: computed(() => ({
      backgroundColor: isDark.value ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.95)',
      titleColor: isDark.value ? '#f9fafb' : '#111827',
      bodyColor: isDark.value ? '#f9fafb' : '#111827',
      footerColor: isDark.value ? '#f9fafb' : '#111827',
      borderColor: isDark.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      borderWidth: 1,
    })),
  };
}

/**
 * Hover and keyboard focus for a chart's periods. The chart wrapper is
 * focusable; arrow keys (and Home/End) step through periods like hovering.
 */
export function useChartFocus(count: () => number) {
  const active = ref<number | null>(null);
  // Chart.js handles pointer events a frame late, so a last mousemove can
  // arrive after the pointer has left; ignore hovers once it's outside
  let pointerInside = false;

  const onHover = (_event: unknown, elements: { index: number }[]) => {
    if (pointerInside) active.value = elements[0]?.index ?? null;
  };

  const onKeydown = (event: KeyboardEvent) => {
    const last = count() - 1;
    if (last < 0) return;
    const current = active.value ?? last;
    const next = {
      ArrowLeft: Math.max(0, current - 1),
      ArrowRight: Math.min(last, current + 1),
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    active.value = next;
  };

  return {
    active,
    onHover,
    onKeydown,
    onFocus: () => { active.value = Math.max(0, count() - 1); },
    onPointerEnter: () => { pointerInside = true; },
    onPointerLeave: () => { pointerInside = false; active.value = null; },
    reset: () => { active.value = null; },
  };
}
