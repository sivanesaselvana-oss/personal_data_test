import { Locator } from '@playwright/test';
import { BaseComponent } from './BaseComponent';
import { ddMmYyyyToIso } from '../utils/date';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * The calendar and time-slot pickers shared by the public request form and the Create Job panel.
 * Calendar: "Previous month" / "Select month" ("Oct 2026") / "Next month" buttons and day gridcells named YYYY-MM-DD.
 * Time: a trigger button showing the current slot; opening it lists the other slots as buttons ("9:00", "13:30").
 */
export class DateTimePicker extends BaseComponent {
  private readonly monthLabel = this.page.getByRole('button', { name: 'Select month' });
  private readonly nextMonthButton = this.page.getByRole('button', { name: 'Next month' });
  private readonly previousMonthButton = this.page.getByRole('button', { name: 'Previous month' });

  /** Opens the calendar from `dateInput`, moves to the right month and picks the day. @param ddMmYyyy DD-MM-YYYY */
  async selectDate(dateInput: Locator, ddMmYyyy: string): Promise<void> {
    const iso = ddMmYyyyToIso(ddMmYyyy);
    const [year, month] = iso.split('-').map(Number);
    const targetIndex = year * 12 + (month - 1);

    await dateInput.click();
    for (let i = 0; i < 24; i++) {
      const shownIndex = await this.getShownMonthIndex();
      if (shownIndex === targetIndex) break;
      await (targetIndex > shownIndex ? this.nextMonthButton : this.previousMonthButton).click();
    }
    await this.page.getByRole('gridcell', { name: iso, exact: true }).click();
  }

  /**
   * Picks a slot from the time picker opened by `timeButton`. @param hhMm 24h "HH:MM".
   * Slots are labelled without a leading zero, and the currently selected slot is not listed, so nothing
   * is clicked when the trigger already shows the wanted time.
   */
  async selectTime(timeButton: Locator, hhMm: string): Promise<void> {
    const slotLabel = hhMm.replace(/^0(\d)/, '$1');
    const current = ((await timeButton.textContent()) ?? '').trim().replace(/^0(\d)/, '$1');
    if (current === slotLabel) return;
    await timeButton.click();
    await this.page.getByRole('button', { name: slotLabel, exact: true }).click();
  }

  /** Calendar header ("Oct 2026" / "October 2026") as year * 12 + zero-based month. */
  private async getShownMonthIndex(): Promise<number> {
    const label = ((await this.monthLabel.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    const match = /([A-Za-z]{3})[A-Za-z]*\s*(\d{4})/.exec(label);
    const monthIndex = match ? MONTHS.indexOf(match[1]) : -1;
    if (!match || monthIndex < 0) {
      throw new Error(`Unrecognised calendar month label "${label}"`);
    }
    return Number(match[2]) * 12 + monthIndex;
  }
}
