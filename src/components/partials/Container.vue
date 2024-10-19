<script setup lang="ts"></script>

<template>
  <div class="container mx-auto mt-8 px-4 md:px-8 lg:px-26 xl:px-36">
    <slot></slot>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  max-width: 1280px; /* Adjust this value as needed */
}
</style>
