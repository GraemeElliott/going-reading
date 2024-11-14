<script setup lang="ts">
import { ref } from 'vue';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDarkModeStore } from '@/store/store';

type SearchType = 'title' | 'author' | 'isbn';
const searchType = ref<SearchType>('title');

const darkModeStore = useDarkModeStore();
</script>

<template>
  <div class="w-full">
    <div class="relative flex gap-2">
      <Select defaultValue="title">
        <SelectTrigger class="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="title"> Title </SelectItem>
            <SelectItem value="author"> Author </SelectItem>
            <SelectItem value="isbn"> ISBN </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <div class="relative flex-1">
        <font-awesome-icon
          icon="fa-solid fa-magnifying-glass"
          class="absolute left-2 top-3 size-4 text-muted-foreground"
        />
        <Input type="search" placeholder="Search" class="pl-8 w-full" />
      </div>
    </div>
  </div>
</template>
