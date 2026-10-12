/** Converts a test-data date "DD-MM-YYYY" to ISO "YYYY-MM-DD". */
export function ddMmYyyyToIso(value: string): string {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!match) {
    throw new Error(`Expected date in DD-MM-YYYY format, got "${value}"`);
  }
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

/** Converts a test-data date "DD-MM-YYYY" to the form's display format "MM/DD/YYYY". */
export function ddMmYyyyToUs(value: string): string {
  const [yyyy, mm, dd] = ddMmYyyyToIso(value).split('-');
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Normalises a date in either format the FSM app has used — "DD-MM-YYYY" (dash) or
 * "MM/DD/YYYY" (slash) — to ISO "YYYY-MM-DD". Returns the input unchanged if it fits neither.
 */
export function appDateToIso(value: string): string {
  const dashed = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  if (dashed) return `${dashed[3]}-${dashed[2]}-${dashed[1]}`;
  const slashed = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (slashed) return `${slashed[3]}-${slashed[1]}-${slashed[2]}`;
  return value;
}

/** "1:00 PM" / "13:00" / "09:00" -> 24h "HH:MM". Returns the input unchanged if it is not a time. */
export function to24HourTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(value.trim());
  if (!match) return value;
  let hours = Number(match[1]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
}

/** App date-time like "16-10-2026 11:00 AM" (or MM/DD/YYYY) -> "2026-10-16 11:00". */
export function appDateTimeToIso(value: string): string {
  const [datePart, ...timeParts] = value.trim().split(/\s+/);
  return `${appDateToIso(datePart)} ${to24HourTime(timeParts.join(' '))}`;
}

/**
 * Converts a date shown in a field to ISO using the field's placeholder as the format,
 * e.g. ("10/15/2026", "MM/DD/YYYY") or ("15-10-2026", "DD-MM-YYYY") -> "2026-10-15".
 * Returns the raw value when it is empty or does not fit the format.
 */
export function displayDateToIso(value: string, format: string): string {
  const order = format.toUpperCase().match(/YYYY|MM|DD/g) ?? [];
  const parts = value.match(/\d+/g) ?? [];
  if (order.length !== 3 || parts.length !== 3) {
    return value;
  }
  const byToken = Object.fromEntries(order.map((token, i) => [token, parts[i]]));
  return `${byToken.YYYY}-${byToken.MM}-${byToken.DD}`;
}
