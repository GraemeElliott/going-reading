<script setup lang="ts">
import { computed } from 'vue';
import { useDarkModeStore } from '@/store/store';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';

const darkModeStore = useDarkModeStore();
const analyticsStore = useUserAnalyticsStore();
const isDark = computed(() => darkModeStore.darkMode);

function pageLevel(pages: number): 0 | 1 | 2 | 3 | 4 {
  if (pages === 0) return 0;
  if (pages <= 20) return 1;
  if (pages <= 45) return 2;
  if (pages <= 75) return 3;
  return 4;
}

// Build the 52-week grid (Mon → Sun columns)
const { weeks, monthLabels } = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Roll back to the most recent Monday, then go back 51 more weeks
  const dow = (today.getDay() + 6) % 7; // Mon=0 … Sun=6
  const start = new Date(today);
  start.setDate(start.getDate() - dow - 51 * 7);

  const weeksArr: Array<Array<{ dateStr: string; pages: number; level: 0|1|2|3|4; isFuture: boolean; tooltip: string }>> = [];
  const monthMap: { label: string; col: number }[] = [];
  let seenMonth = -1;

  const cur = new Date(start);
  let col = 0;

  while (cur <= today || (weeksArr.length < 52 && col < 52)) {
    const week: typeof weeksArr[0] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cur.toISOString().slice(0, 10);
      const isFuture = cur > today;
      const pages = isFuture ? 0 : (analyticsStore.dailyPagesMap.get(dateStr) ?? 0);
      const level = isFuture ? 0 : pageLevel(pages);
      const tooltip = isFuture
        ? dateStr
        : pages === 0
          ? `${dateStr} — no reading`
          : `${dateStr} — ${pages} pages`;
      week.push({ dateStr, pages, level, isFuture, tooltip });

      const month = cur.getMonth();
      if (!isFuture && month !== seenMonth) {
        monthMap.push({ label: cur.toLocaleString('default', { month: 'short' }), col });
        seenMonth = month;
      }

      cur.setDate(cur.getDate() + 1);
    }
    weeksArr.push(week);
    col++;
    if (weeksArr.length >= 53) break;
  }

  return { weeks: weeksArr, monthLabels: monthMap };
}).value;

// Color per level, light + dark variants
function cellColor(level: 0|1|2|3|4, isFuture: boolean): string {
  if (isFuture) return isDark.value ? '#1f2937' : '#f3f4f6';
  const dark = ['#374151','#b2d8d8','#66b2b2','#008080','#006666'];
  const light = ['#e5e7eb','#b2d8d8','#66b2b2','#008080','#006666'];
  return isDark.value ? dark[level] : light[level];
}

const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];
// Each week column = w-3 (12px) + mr-0.5 (2px) = 14px
const WEEK_WIDTH = 14;
// Day label column = w-6 (24px) + mr-2 (8px) = 32px
const DAY_COL_WIDTH = 32;
</script>

<template>
  <div
    class="rounded-lg border p-4"
    :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
  >
    <div class="text-xs font-medium uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
      Reading activity · past year
    </div>

    <div class="overflow-x-auto">
      <div class="inline-flex flex-col min-w-max">

        <!-- Month labels row -->
        <div class="relative h-4 mb-1" :style="{ marginLeft: DAY_COL_WIDTH + 'px' }">
          <span
            v-for="m in monthLabels"
            :key="m.col"
            class="absolute top-0 text-[10px] leading-none whitespace-nowrap"
            :class="isDark ? 'text-gray-400' : 'text-gray-500'"
            :style="{ left: (m.col * WEEK_WIDTH) + 'px' }"
          >{{ m.label }}</span>
        </div>

        <!-- Grid rows (Mon–Sun) -->
        <div class="flex">
          <!-- Day labels -->
          <div class="flex flex-col mr-2" :style="{ width: '24px' }">
            <div
              v-for="(label, di) in dayLabels"
              :key="di"
              class="h-3 mb-0.5 text-[10px] leading-none flex items-center justify-end pr-1"
              :class="isDark ? 'text-gray-400' : 'text-gray-500'"
            >
              {{ label }}
            </div>
          </div>

          <!-- Week columns -->
          <div class="flex">
            <div
              v-for="(week, wi) in weeks"
              :key="wi"
              class="flex flex-col mr-0.5"
            >
              <div
                v-for="(day, di) in week"
                :key="di"
                class="w-3 h-3 rounded-sm mb-0.5 flex-shrink-0 cursor-default"
                :style="{ background: cellColor(day.level, day.isFuture) }"
                :title="day.tooltip"
              ></div>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-1.5 mt-3" :style="{ marginLeft: DAY_COL_WIDTH + 'px' }">
          <span class="text-[10px]" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Less</span>
          <div
            v-for="level in ([0,1,2,3,4] as const)"
            :key="level"
            class="w-3 h-3 rounded-sm"
            :style="{ background: cellColor(level, false) }"
          ></div>
          <span class="text-[10px]" :class="isDark ? 'text-gray-400' : 'text-gray-500'">More</span>
        </div>

      </div>
    </div>
  </div>
</template>
