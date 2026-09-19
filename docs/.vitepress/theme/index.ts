import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import FormExampleArrayFields from './components/FormExampleArrayFields.vue';
import FormExampleBasic from './components/FormExampleBasic.vue';
import FormExampleChoiceExplicitRepeatable from './components/FormExampleChoiceExplicitRepeatable.vue';
import FormExampleChoiceExplicitSingle from './components/FormExampleChoiceExplicitSingle.vue';
import FormExampleChoiceFields from './components/FormExampleChoiceFields.vue';
import FormExampleChoicePreserveOnSwitch from './components/FormExampleChoicePreserveOnSwitch.vue';
import FormExampleChoiceRepeatableBranch from './components/FormExampleChoiceRepeatableBranch.vue';
import FormExampleValidation from './components/FormExampleValidation.vue';
import FormExampleClientOnboardingPlannerContext from './context/FormExampleClientOnboardingPlannerContext.vue';
import FormExampleDynamicFieldsContext from './context/FormExampleDynamicFieldsContext.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('FormExampleBasic', FormExampleBasic);
    app.component('FormExampleValidation', FormExampleValidation);
    app.component('FormExampleArrayFields', FormExampleArrayFields);
    app.component('FormExampleChoiceFields', FormExampleChoiceFields);
    app.component('FormExampleChoiceExplicitSingle', FormExampleChoiceExplicitSingle);
    app.component('FormExampleChoiceExplicitRepeatable', FormExampleChoiceExplicitRepeatable);
    app.component('FormExampleChoicePreserveOnSwitch', FormExampleChoicePreserveOnSwitch);
    app.component('FormExampleChoiceRepeatableBranch', FormExampleChoiceRepeatableBranch);
    app.component('FormExampleClientOnboardingPlannerContext', FormExampleClientOnboardingPlannerContext);
    app.component('FormExampleDynamicFieldsContext', FormExampleDynamicFieldsContext);
  },
} satisfies Theme;
