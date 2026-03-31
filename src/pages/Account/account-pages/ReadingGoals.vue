<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth-store';
import { useReadingGoalsStore } from '@/store/reading-goals-store';

const authStore = useAuthStore();
const goalsStore = useReadingGoalsStore();

const currentYear = new Date().getFullYear();
const newYear = ref(String(currentYear));
const newGoal = ref('');
const editingYear = ref<number | null>(null);
const editingValue = ref('');
const showAddForm = ref(false);

onMounted(async () => {
  const userId = authStore.user?.id;
  if (!userId) return;
  await goalsStore.fetchAllGoals(userId);
});

const existingYears = computed(() => new Set(goalsStore.allGoals.map((g) => g.year)));

const yearOptions = computed(() => {
  const years = [];
  for (let y = currentYear + 1; y >= 2020; y--) {
    years.push(y);
  }
  return years;
});

const startEdit = (year: number, goal: number) => {
  editingYear.value = year;
  editingValue.value = String(goal);
};

const saveEdit = async () => {
  const parsed = parseInt(editingValue.value, 10);
  if (!parsed || parsed < 1 || editingYear.value === null) return;
  const userId = authStore.user?.id;
  if (!userId) return;
  await goalsStore.setGoal(userId, editingYear.value, parsed);
  editingYear.value = null;
};

const cancelEdit = () => {
  editingYear.value = null;
  editingValue.value = '';
};

const handleDelete = async (year: number) => {
  const userId = authStore.user?.id;
  if (!userId) return;
  await goalsStore.deleteGoal(userId, year);
};

const handleAdd = async () => {
  const parsedGoal = parseInt(newGoal.value, 10);
  const parsedYear = parseInt(newYear.value, 10);
  if (!parsedGoal || parsedGoal < 1 || !parsedYear) return;
  const userId = authStore.user?.id;
  if (!userId) return;
  await goalsStore.setGoal(userId, parsedYear, parsedGoal);
  newGoal.value = '';
  showAddForm.value = false;
};
</script>

<template>
  <div>
    <h3 class="text-lg font-medium">Reading Goals</h3>
    <p class="text-sm text-muted-foreground">Manage your annual reading goals.</p>
  </div>
  <Separator />

  <div class="space-y-6 max-w-lg">
    <!-- Goal list -->
    <div v-if="goalsStore.allGoals.length > 0" class="space-y-2">
      <div
        v-for="goal in goalsStore.allGoals"
        :key="goal.year"
        class="flex items-center justify-between rounded-lg border px-4 py-3"
      >
        <div class="flex items-center gap-4">
          <span class="font-medium w-12">{{ goal.year }}</span>

          <!-- Inline edit -->
          <div v-if="editingYear === goal.year" class="flex items-center gap-2">
            <input
              v-model="editingValue"
              type="number"
              min="1"
              class="w-20 text-center rounded border px-2 py-1 text-sm bg-transparent outline-none focus:ring-2 focus:ring-green-600"
              @keyup.enter="saveEdit"
              @keyup.escape="cancelEdit"
            />
            <span class="text-sm text-muted-foreground">books</span>
            <button
              class="text-sm px-3 py-1 rounded bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
              :disabled="goalsStore.loading"
              @click="saveEdit"
            >
              Save
            </button>
            <button class="text-sm text-muted-foreground hover:text-foreground" @click="cancelEdit">
              Cancel
            </button>
          </div>

          <!-- Display -->
          <span v-else class="text-sm text-muted-foreground">{{ goal.goal }} books</span>
        </div>

        <!-- Actions -->
        <div v-if="editingYear !== goal.year" class="flex items-center gap-3">
          <button
            class="text-sm text-muted-foreground hover:text-foreground"
            @click="startEdit(goal.year, goal.goal)"
          >
            <font-awesome-icon icon="fa-solid fa-pen" class="text-xs mr-1" />
            Edit
          </button>
          <button
            class="text-sm text-red-500 hover:text-red-700 disabled:opacity-40"
            :disabled="goalsStore.loading"
            @click="handleDelete(goal.year)"
          >
            <font-awesome-icon icon="fa-solid fa-trash" class="text-xs mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>

    <p v-else class="text-sm text-muted-foreground">No reading goals set yet.</p>

    <!-- Add new goal -->
    <div v-if="showAddForm" class="rounded-lg border px-4 py-4 space-y-4">
      <h4 class="text-sm font-medium">Add a goal</h4>
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-muted-foreground">Year</label>
          <select
            v-model="newYear"
            class="rounded border px-2 py-1.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-green-600"
          >
            <option
              v-for="y in yearOptions"
              :key="y"
              :value="String(y)"
              :disabled="existingYears.has(y)"
            >
              {{ y }}{{ existingYears.has(y) ? ' (set)' : '' }}
            </option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-muted-foreground">Books to read</label>
          <input
            v-model="newGoal"
            type="number"
            min="1"
            placeholder="e.g. 24"
            class="w-28 rounded border px-2 py-1.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-green-600"
            @keyup.enter="handleAdd"
          />
        </div>
      </div>
      <div class="flex gap-2">
        <button
          class="text-sm px-4 py-1.5 rounded bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
          :disabled="goalsStore.loading || !newGoal.trim()"
          @click="handleAdd"
        >
          {{ goalsStore.loading ? 'Saving…' : 'Save goal' }}
        </button>
        <button
          class="text-sm text-muted-foreground hover:text-foreground"
          @click="showAddForm = false"
        >
          Cancel
        </button>
      </div>
    </div>

    <button
      v-if="!showAddForm"
      class="text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground"
      @click="showAddForm = true"
    >
      <font-awesome-icon icon="fa-solid fa-plus" class="text-xs" />
      Add a goal
    </button>

    <p v-if="goalsStore.error" class="text-sm text-red-500">{{ goalsStore.error }}</p>
  </div>
</template>
