import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/modules/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: ['fastify', 'kysely', 'pg'],
        patterns: ['@fastify/*', '**/platform/*', '**/infrastructure/*', '**/application/*', '**/api/*'],
      }],
    },
  },
);
