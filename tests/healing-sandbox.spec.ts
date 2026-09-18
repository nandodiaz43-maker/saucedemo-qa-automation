import { expect, test } from '../fixtures/pages';
import { users } from '../data/testData';
import { SandboxLoginPage } from '../pages/sandbox/SandboxLoginPage';

/**
 * Banco de pruebas del healer. Falla a propósito por un locator roto en SandboxLoginPage.
 * Corrección esperada: solo el locator en pages/sandbox/SandboxLoginPage.ts.
 * Las aserciones de este test NO deben cambiar.
 * Se excluye de `npm test`; se ejecuta con `npm run test:healing`.
 */
test('@healing-sandbox login válido llega al inventario', async ({ page, inventoryPage }) => {
  const sandboxLogin = new SandboxLoginPage(page);
  await sandboxLogin.goto();
  await sandboxLogin.login(users.standard.username, users.standard.password);

  await inventoryPage.expectLoaded();
  await expect(page).toHaveURL(/inventory\.html/);
});
