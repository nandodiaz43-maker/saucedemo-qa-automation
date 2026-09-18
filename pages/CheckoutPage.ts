import { expect, type Locator, type Page } from '@playwright/test';
import { SectionPage } from './BasePage';
import { ProductCard } from './components/ProductCard';

export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export class CheckoutPage extends SectionPage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly confirmationHeader: Locator;
  readonly confirmationText: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.postalCodeInput = page.getByPlaceholder('Zip/Postal Code');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.finishButton = page.getByRole('button', { name: 'Finish' });
    this.confirmationHeader = page.getByRole('heading', { name: 'Thank you for your order!' });
    this.confirmationText = page.getByTestId('complete-text');
  }

  async fillInformation({ firstName, lastName, postalCode }: CheckoutInfo) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
  }

  async continue() {
    await this.continueButton.click();
  }

  async expectOverviewFor(productName: string) {
    await expect(this.page).toHaveURL(/checkout-step-two\.html/);
    await this.expectTitle('Checkout: Overview');
    await new ProductCard(this.page, productName).expectVisible();
  }

  async finish() {
    await this.finishButton.click();
  }

  async expectOrderConfirmed() {
    await expect(this.page).toHaveURL(/checkout-complete\.html/);
    await expect(this.confirmationHeader).toBeVisible();
    await expect(this.confirmationText).toContainText('Your order has been dispatched');
  }
}
