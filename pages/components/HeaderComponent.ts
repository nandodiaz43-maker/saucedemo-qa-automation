import { expect, type Locator, type Page } from '@playwright/test';

/** Cabecera con el carrito, presente en las pantallas posteriores al login. */
export class HeaderComponent {
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
  }

  async openCart() {
    await this.cartLink.click();
  }

  async expectCartCount(count: number) {
    await expect(this.cartBadge).toHaveText(String(count));
  }
}
