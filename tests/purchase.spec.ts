import { expect, test } from '../fixtures/pages';
import { checkoutInfo, product, users } from '../data/testData';

test.describe('Flujo de compra E2E', () => {
  test('TC-01 Happy Path: login, agregar producto, checkout y confirmación', { tag: '@TC-01' }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await inventoryPage.expectLoaded();

    await inventoryPage.addToCart(product);
    await inventoryPage.expectCartCount(1);
    await inventoryPage.openCart();

    await cartPage.expectLoaded();
    await cartPage.expectProductInCart(product);
    await cartPage.checkout();

    await checkoutPage.fillInformation(checkoutInfo.valid);
    await checkoutPage.continue();
    await checkoutPage.expectOverviewFor(product);
    await checkoutPage.finish();

    await checkoutPage.expectOrderConfirmed();
  });

  test('TC-02 Error: login con credenciales inválidas', { tag: '@TC-02' }, async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(users.invalid.username, users.invalid.password);

    await loginPage.expectError('Username and password do not match any user in this service');
    await expect(page).toHaveURL('/');
  });

  test('TC-03 Error: checkout con datos incompletos (sin First Name)', { tag: '@TC-03' }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await inventoryPage.addToCart(product);
    await inventoryPage.openCart();
    await cartPage.checkout();

    await checkoutPage.fillInformation(checkoutInfo.missingFirstName);
    await checkoutPage.continue();

    await checkoutPage.expectError('First Name is required');
    await expect(page).toHaveURL(/checkout-step-one\.html/);
  });
});
