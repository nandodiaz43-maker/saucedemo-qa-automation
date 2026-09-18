import { test } from '../fixtures/pages';
import { users } from '../data/testData';

/**
 * Fallo INTENCIONAL para la fase 3 (diagnóstico con IA).
 * Se excluye de `npm test`; se ejecuta con `npm run test:fail`.
 * El botón real se llama "Login"; aquí se busca "Log in" a propósito.
 */
test('@failure-demo selector incorrecto en el botón de login', async ({ page, loginPage }) => {
  await loginPage.goto();
  await loginPage.usernameInput.fill(users.standard.username);
  await loginPage.passwordInput.fill(users.standard.password);
  await page.getByRole('button', { name: 'Log in' }).click({ timeout: 5_000 });
});
