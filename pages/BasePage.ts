import { expect, type Locator, type Page } from '@playwright/test';

/** Elementos comunes a todas las pantallas: mensaje de error de SauceDemo. */
export abstract class BasePage {
  readonly errorMessage: Locator;

  constructor(protected readonly page: Page) {
    this.errorMessage = page.getByTestId('error');
  }

  async expectError(message: string | RegExp) {
    await expect(this.errorMessage).toContainText(message);
  }
}

/** Pantallas posteriores al login: comparten el título de sección (Products, Your Cart...). */
export abstract class SectionPage extends BasePage {
  readonly title: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
  }

  async expectTitle(title: string) {
    await expect(this.title).toHaveText(title);
  }
}
