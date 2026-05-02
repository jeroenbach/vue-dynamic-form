import antfu from '@antfu/eslint-config';

export default antfu({
  formatters: true,
  stylistic: true,
  typescript: true,
  vue: true,
  rules: {
    'style/semi': ['error', 'always'],
  },
}, {
  files: ['docs/**/*.vue'],
  rules: {
    'vue/attribute-hyphenation': 'off',
  },
});
