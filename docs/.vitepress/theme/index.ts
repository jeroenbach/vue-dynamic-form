import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import BasicFormExample from './components/BasicFormExample.vue';
import ClientOnboardingPlannerExampleContext from './context/ClientOnboardingPlannerExampleContext.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('BasicFormExample', BasicFormExample);
    app.component('ClientOnboardingPlannerExampleContext', ClientOnboardingPlannerExampleContext);
  },
} satisfies Theme;
