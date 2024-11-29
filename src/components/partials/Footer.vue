<script setup lang="ts">
defineProps<{
  isHome: boolean;
}>();
</script>

<template>
  <footer :class="{ 'bg-[#0F3538] pt-7 text-white': isHome }">
    <div
      class="flex flex-row relative bottom-0 h-20 items-center mt-auto max-w-7xl mx-auto px-6 lg:px-26 xl:px-36"
    >
      <div>
        <p>Footer</p>
      </div>
    </div>
  </footer>
</template>

<style scoped></style>
