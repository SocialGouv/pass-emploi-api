module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'chai-friendly', 'mocha'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:chai-friendly/recommended',
    'plugin:prettier/recommended'
  ],
  root: true,
  env: {
    node: true,
    jest: true,
    mocha: true
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    'no-process-env': 'error',
    'no-console': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }
    ],
    'no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-expressions': 'error',
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'error',
    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare': 'error',
    semi: 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/semi': [
      'error',
      'never',
      { beforeStatementContinuationChars: 'always' }
    ],
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    '@typescript-eslint/no-non-null-assertion': 'off'
  }
}
