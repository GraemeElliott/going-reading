<script lang="ts">
import Navbar from './components/partials/Navbar.vue';
import './index.css';
import { defineComponent, onMounted } from 'vue';
import { useAuthStore } from './stores/auth';

const meta = document.createElement('meta');
meta.name = 'naive-ui-style';
document.head.appendChild(meta);

export default defineComponent({
  name: 'App',
  components: {
    Navbar,
  },
  setup() {
    const authStore = useAuthStore();

    // Use onMounted here to listen for changes in the authentication state
    onMounted(() => {
      authStore.initialize();
    });

    return {};
  },
});
</script>

<template>
  <n-loading-bar-provider>
    <n-message-provider>
      <n-notification-provider>
        <main>
          <Navbar />
          <router-view class="ml-2 mr-2 md:max-w-xl md:mx-auto" />
        </main>
      </n-notification-provider>
    </n-message-provider>
  </n-loading-bar-provider>
</template>
