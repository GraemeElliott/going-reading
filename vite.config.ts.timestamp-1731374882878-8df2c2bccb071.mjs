// vite.config.ts
import path from "path";
import vue from "file:///C:/Users/Graeme/Desktop/Programming/Projects/going-reading/.yarn/__virtual__/@vitejs-plugin-vue-virtual-6f8cb19a61/5/AppData/Local/Yarn/Berry/cache/@vitejs-plugin-vue-npm-5.1.5-734c041e90-10c0.zip/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { defineConfig } from "file:///C:/Users/Graeme/Desktop/Programming/Projects/going-reading/.yarn/__virtual__/vite-virtual-6a752086a9/5/AppData/Local/Yarn/Berry/cache/vite-npm-5.4.11-9da365ef2b-10c0.zip/node_modules/vite/dist/node/index.js";
import tailwind from "file:///C:/Users/Graeme/AppData/Local/Yarn/Berry/cache/tailwindcss-npm-3.4.14-8a01faa24e-10c0.zip/node_modules/tailwindcss/lib/index.js";
import autoprefixer from "file:///C:/Users/Graeme/Desktop/Programming/Projects/going-reading/.yarn/__virtual__/autoprefixer-virtual-af77fe9233/5/AppData/Local/Yarn/Berry/cache/autoprefixer-npm-10.4.20-dd5fd05d27-10c0.zip/node_modules/autoprefixer/lib/autoprefixer.js";
var __vite_injected_original_dirname = "C:\\Users\\Graeme\\Desktop\\Programming\\Projects\\going-reading";
var vite_config_default = defineConfig({
  css: {
    postcss: {
      plugins: [tailwind(), autoprefixer()]
    }
  },
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    proxy: {
      "/api/books": {
        target: "https://api2.isbndb.com",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/api/, "")
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxHcmFlbWVcXFxcRGVza3RvcFxcXFxQcm9ncmFtbWluZ1xcXFxQcm9qZWN0c1xcXFxnb2luZy1yZWFkaW5nXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxHcmFlbWVcXFxcRGVza3RvcFxcXFxQcm9ncmFtbWluZ1xcXFxQcm9qZWN0c1xcXFxnb2luZy1yZWFkaW5nXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9HcmFlbWUvRGVza3RvcC9Qcm9ncmFtbWluZy9Qcm9qZWN0cy9nb2luZy1yZWFkaW5nL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcblxuaW1wb3J0IHRhaWx3aW5kIGZyb20gJ3RhaWx3aW5kY3NzJztcbmltcG9ydCBhdXRvcHJlZml4ZXIgZnJvbSAnYXV0b3ByZWZpeGVyJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgY3NzOiB7XG4gICAgcG9zdGNzczoge1xuICAgICAgcGx1Z2luczogW3RhaWx3aW5kKCksIGF1dG9wcmVmaXhlcigpXSxcbiAgICB9LFxuICB9LFxuICBwbHVnaW5zOiBbdnVlKCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpL2Jvb2tzJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2FwaTIuaXNibmRiLmNvbScsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sICcnKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4VyxPQUFPLFVBQVU7QUFDL1gsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsb0JBQW9CO0FBRTdCLE9BQU8sY0FBYztBQUNyQixPQUFPLGtCQUFrQjtBQUx6QixJQUFNLG1DQUFtQztBQU96QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixLQUFLO0FBQUEsSUFDSCxTQUFTO0FBQUEsTUFDUCxTQUFTLENBQUMsU0FBUyxHQUFHLGFBQWEsQ0FBQztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUyxDQUFDLElBQUksQ0FBQztBQUFBLEVBQ2YsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsY0FBYztBQUFBLFFBQ1osUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDQSxVQUFTQSxNQUFLLFFBQVEsVUFBVSxFQUFFO0FBQUEsTUFDOUM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInBhdGgiXQp9Cg==
