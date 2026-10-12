import { Page } from '@playwright/test';

/**
 * Base for UI components (menus, popups, panels, pickers). Subclasses may build locators in field
 * initializers from `this.page`: it is set by this constructor (via super()) before their fields
 * initialise, which a constructor parameter property on the subclass itself would not guarantee.
 */
export abstract class BaseComponent {
  constructor(protected readonly page: Page) {}
}
