declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'vue' {
  import type { ComponentOptions } from 'vue';
  const Vue: ComponentOptions;
  export default Vue;
  export * from '@vue/runtime-dom';
}
