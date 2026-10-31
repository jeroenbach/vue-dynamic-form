import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import CheckoutFormExample from './components/CheckoutFormExample.vue';
import FormExampleArrayFields from './components/FormExampleArrayFields.vue';
import FormExampleBasic from './components/FormExampleBasic.vue';
import FormExampleChoiceExplicitRepeatable from './components/FormExampleChoiceExplicitRepeatable.vue';
import FormExampleChoiceExplicitSingle from './components/FormExampleChoiceExplicitSingle.vue';
import FormExampleChoiceFields from './components/FormExampleChoiceFields.vue';
import FormExampleChoicePreserveOnSwitch from './components/FormExampleChoicePreserveOnSwitch.vue';
import FormExampleChoiceRepeatableBranch from './components/FormExampleChoiceRepeatableBranch.vue';
import FormExampleValidation from './components/FormExampleValidation.vue';
import FormExampleWizard from './components/FormExampleWizard.vue';
import InboxRulesExample from './components/InboxRulesExample.vue';
import WorkoutPlanExample from './components/WorkoutPlanExample.vue';
import RunOfShowExample from './components/RunOfShowExample.vue';
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
    app.component('FormExampleWizard', FormExampleWizard);
    app.component('FormExampleClientOnboardingPlannerContext', FormExampleClientOnboardingPlannerContext);
    app.component('FormExampleDynamicFieldsContext', FormExampleDynamicFieldsContext);
    app.component('CheckoutFormExample', CheckoutFormExample);
    app.component('InboxRulesExample', InboxRulesExample);
    app.component('WorkoutPlanExample', WorkoutPlanExample);
    app.component('RunOfShowExample', RunOfShowExample);
  },
} satisfies Theme;
