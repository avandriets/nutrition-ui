// @ts-check
const eslint = require('@eslint/js');
const {defineConfig} = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'always-multiline',
        },
      ],
      quotes: [
        'error',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: true,
        },
      ],
      'semi-style': ['error', 'last'],
      semi: 'error',
      'brace-style': ['error', '1tbs', {allowSingleLine: true}],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      'no-console': 'error',
      'comma-spacing': ['error', {before: false, after: true}],
      'no-irregular-whitespace': 'error',
      'no-multiple-empty-lines': ['error', {max: 1, maxEOF: 0}],
      'no-trailing-spaces': 'error',
      'multiline-comment-style': ['error', 'separate-lines'],
      'object-curly-spacing': ['error', 'always'],
      curly: 'error',
      'default-case': 'error',
      'no-template-curly-in-string': 'error',
      'prefer-template': 'error',
      'prefer-object-spread': 'error',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': ['error'],
      camelcase: ['error', {ignoreImports: true, properties: 'never'}],
      'no-param-reassign': 'error',
      'no-self-assign': 'error',
      'no-var': 'error',
      eqeqeq: 'error',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': ['error'],
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': ['error'],
      'max-len': ['error', {code: 121}],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {allowExpressions: true},
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {},
  }
]);
