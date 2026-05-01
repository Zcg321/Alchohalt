module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  settings: {
    react: {
      version: '18.2.0'
    }
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off', // Using TypeScript for type checking
    'max-lines': ['warn', { max: 600, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true, IIFEs: true }],
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-restricted-syntax': [
      'error',
      {
        selector: "MemberExpression[object.name='localStorage']",
        message: 'Use src/lib/storage.ts getJSON/setJSON — they go through the Capacitor Preferences shim. Direct localStorage breaks on iOS/Android.'
      },
      {
        selector: "MemberExpression[object.object.name='window'][object.property.name='localStorage']",
        message: 'Use src/lib/storage.ts getJSON/setJSON — they go through the Capacitor Preferences shim. Direct window.localStorage breaks on iOS/Android.'
      }
    ]
  },
  overrides: [
    {
      // The shim itself, the PWA-only install banner, and tests are
      // allowed to touch localStorage directly. Everything else routes
      // through src/lib/storage.ts.
      files: [
        'src/shared/capacitor.ts',
        'src/app/PWAInstallBanner.tsx',
        'src/**/__tests__/**',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/test/**'
      ],
      rules: { 'no-restricted-syntax': 'off' }
    }
  ]
};
