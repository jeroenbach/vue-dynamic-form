import antfu from '@antfu/eslint-config';

export default antfu({
  formatters: true,
  stylistic: true,
  rules: {
    'style/semi': ['error', 'always'],
  },
});
