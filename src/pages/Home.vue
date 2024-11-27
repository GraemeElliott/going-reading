<script setup lang="ts">
import AuthenticationTab from '@/components/authentication/AuthenticationTab.vue';
</script>

<template>
  <main class="min-h-screen bg-background">
    <div class="container mx-auto px-4 py-8">
      <div class="lg:flex lg:gap-16 lg:items-start">
        <!-- Left Column: Features -->
        <div class="max-w-2xl flex-1 mb-12 lg:mb-0">
          <div class="mb-10">
            <h1 class="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Track Your Reading Journey
              <span class="block text-primary mt-2">With Going Reading</span>
            </h1>
            <p class="text-xl text-muted-foreground">
              Your personal reading companion. Track books, manage reading
              lists, and connect with fellow readers.
            </p>
          </div>

          <div class="grid gap-8">
            <!-- Book Tracking -->
            <div class="flex items-start gap-4">
              <div
                class="h-10 w-10 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">
                  Personal Book Tracking
                </h3>
                <p class="text-muted-foreground text-sm">
                  Keep track of your reading progress, mark books as currently
                  reading, completed, or want to read.
                </p>
              </div>
            </div>

            <!-- Reading Lists -->
            <div class="flex items-start gap-4">
              <div
                class="h-10 w-10 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">Custom Reading Lists</h3>
                <p class="text-muted-foreground text-sm">
                  Create and organize your reading lists by genre, theme, or any
                  category you choose.
                </p>
              </div>
            </div>

            <!-- Book Search -->
            <div class="flex items-start gap-4">
              <div
                class="h-10 w-10 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">Powerful Book Search</h3>
                <p class="text-muted-foreground text-sm">
                  Find any book instantly with our comprehensive search feature
                  powered by ISBN database.
                </p>
              </div>
            </div>

            <!-- Reading Analytics -->
            <div class="flex items-start gap-4">
              <div
                class="h-10 w-10 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-1">Reading Analytics</h3>
                <p class="text-muted-foreground text-sm">
                  Track your reading habits and get insights into your reading
                  journey with detailed statistics.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Authentication -->
        <div class="lg:sticky lg:top-8 lg:flex lg:items-start">
          <AuthenticationTab />
        </div>
      </div>
    </div>
  </main>
</template>
