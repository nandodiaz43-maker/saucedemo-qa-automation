import { expect, type Page } from '@playwright/test';
import { SectionPage } from './BasePage';
import { HeaderComponent } from './components/HeaderComponent';
import { ProductCard } from './components/ProductCard';

export class InventoryPage extends SectionPage {
  readonly header: HeaderComponent;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/inventory\.html/);
    await this.expectTitle('Products');
  }

  async addToCart(productName: string) {
    await new ProductCard(this.page, productName).addToCart();
  }

  async expectCartCount(count: number) {
    await this.header.expectCartCount(count);
  }

  async openCart() {
    await this.header.openCart();
  }
}
