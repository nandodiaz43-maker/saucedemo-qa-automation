import { test } from '@playwright/test';

// Semilla que usan los agentes planner/generator de Playwright. No es una prueba de regresión:
// se excluye de `npm test` mediante el tag @seed.
test.describe('Test group', () => {
  test('seed', { tag: '@seed' }, async ({ page }) => {
    await page.goto('/');
  });
});
