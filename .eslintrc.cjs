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
    'react/react-in-jsx-scope': 'off'
  }
};
