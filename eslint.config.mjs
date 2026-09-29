import globals from 'globals';

const runtimeGlobals = {
  ...globals.node,
  ...globals.browser,
  Chart: 'readonly',
  XLSX: 'readonly',
  openExtendStayModal: 'readonly'
};

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'tests/screenshots/**']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: runtimeGlobals
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }],
      'no-redeclare': 'error'
    }
  },
  {
    files: ['tests/**/*.js', 'scripts/**/*.js'],
    rules: {
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }]
    }
  }
];
