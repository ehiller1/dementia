module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    
    // ROUTER MIGRATION ENFORCEMENT
    // Prevent direct OpenAI calls - all calls must go through IntelligenceRouter
    'no-restricted-syntax': [
      'error',
      {
        selector: "MemberExpression[object.name='openai'][property.name='chat']",
        message: '❌ Direct OpenAI calls are not allowed. Use IntelligenceRouter.dispatch() instead. See routerMigrationHelper.js for migration pattern.'
      },
      {
        selector: "CallExpression[callee.object.object.name='openai'][callee.object.property.name='chat'][callee.property.name='completions']",
        message: '❌ Direct openai.chat.completions.create() calls are not allowed. Use IntelligenceRouter.dispatch() or routeOrFallback() helper.'
      }
    ],
    
    // Allow direct calls in specific files (migration helpers, tests, adapters)
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['openai'],
            message: 'Import IntelligenceRouter instead of using OpenAI directly. Exceptions: *Helper.js, *Adapter.ts, *.test.js'
          }
        ]
      }
    ]
  },
  overrides: [
    {
      // Allow direct OpenAI calls in these files
      files: [
        '**/routerMigrationHelper.js',
        '**/IntelligenceRouter.ts',
        '**/IntelligenceRouterAdapter.ts',
        '**/*.test.js',
        '**/*.test.ts',
        '**/OpenAILanguageModelService.js'
      ],
      rules: {
        'no-restricted-syntax': 'off',
        'no-restricted-imports': 'off'
      }
    }
  ]
};
