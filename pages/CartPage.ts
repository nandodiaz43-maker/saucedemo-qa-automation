import { expect, type Locator, type Page } from '@playwright/test';
import { SectionPage } from './BasePage';
import { ProductCard } from './components/ProductCard';

export class CartPage extends SectionPage {
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/cart\.html/);
    await this.expectTitle('Your Cart');
  }

  async expectProductInCart(productName: string) {
    await new ProductCard(this.page, productName).expectVisible();
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}
