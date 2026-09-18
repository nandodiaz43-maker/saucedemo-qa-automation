import { expect, type Locator, type Page } from '@playwright/test';

/** Un producto (en inventario, carrito o resumen de checkout) identificado por su nombre. */
export class ProductCard {
  readonly root: Locator;
  readonly addToCartButton: Locator;

  constructor(page: Page, productName: string) {
    this.root = page.getByTestId('inventory-item').filter({ hasText: productName });
    this.addToCartButton = this.root.getByRole('button', { name: 'Add to cart' });
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  async expectVisible() {
    await expect(this.root).toBeVisible();
  }
}
