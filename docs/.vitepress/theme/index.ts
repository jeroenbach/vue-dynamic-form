import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import FormExampleArrayFields from './components/FormExampleArrayFields.vue';
import FormExampleBasic from './components/FormExampleBasic.vue';
import FormExampleChoiceFields from './components/FormExampleChoiceFields.vue';
import FormExampleClientOnboardingPlannerContext from './context/FormExampleClientOnboardingPlannerContext.vue';
import FormExampleDynamicFieldsContext from './context/FormExampleDynamicFieldsContext.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('FormExampleBasic', FormExampleBasic);
    app.component('FormExampleArrayFields', FormExampleArrayFields);
    app.component('FormExampleChoiceFields', FormExampleChoiceFields);
    app.component('FormExampleClientOnboardingPlannerContext', FormExampleClientOnboardingPlannerContext);
    app.component('FormExampleDynamicFieldsContext', FormExampleDynamicFieldsContext);
  },
} satisfies Theme;
