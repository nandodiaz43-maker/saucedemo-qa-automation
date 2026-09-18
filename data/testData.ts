export const users = {
  standard: { username: 'standard_user', password: 'secret_sauce' },
  invalid: { username: 'standard_user', password: 'wrong_password' },
} as const;

export const product = 'Sauce Labs Backpack';

export const checkoutInfo = {
  valid: { firstName: 'Luis', lastName: 'Diaz', postalCode: '110111' },
  missingFirstName: { firstName: '', lastName: 'Diaz', postalCode: '110111' },
} as const;
