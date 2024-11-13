<script setup lang="ts"></script>

<template>
  <div class="flex flex-row items-center justify-center h-full">
    <div class="flex items-center">
      <p :class="['kanit-thin text-2xl']">Going</p>
      <font-awesome-icon
        icon="fa-solid fa-bookmark"
        class="fa-1xl mx-1 text-goingTeal"
      />
      <p :class="['kanit-regular text-2xl']">Reading</p>
    </div>
  </div>
</template>

<style scoped>
p {
  transition: color 0.3s ease;
}
</style>
