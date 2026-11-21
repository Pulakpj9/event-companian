const currencies = new Set(Intl.supportedValuesOf('currency'));
const minDatabaseAmount = -(1n << 63n);
const maxDatabaseAmount = (1n << 63n) - 1n;

export class Money {
  private constructor(
    readonly amountMinor: bigint,
    readonly currency: string,
  ) {
    Object.freeze(this);
  }

  static of(amountMinor: bigint, currency: string): Money {
    if (typeof amountMinor !== 'bigint') throw new TypeError('Money requires bigint minor units.');
    if (!currencies.has(currency)) {
      throw new RangeError('Use a recognized uppercase currency code.');
    }
    return new Money(amountMinor, currency);
  }

  static fromJson(amountMinor: number, currency: string): Money {
    if (!Number.isSafeInteger(amountMinor)) {
      throw new RangeError('JSON money must use a safe integer in minor units.');
    }
    return Money.of(BigInt(amountMinor), currency);
  }

  static fromDatabase(amountMinor: string, currency: string): Money {
    if (!/^(?:0|-?[1-9][0-9]{0,18})$/.test(amountMinor)) {
      throw new RangeError('Expected a canonical PostgreSQL bigint value.');
    }
    const amount = BigInt(amountMinor);
    if (amount.toString() !== amountMinor) throw new RangeError('Expected a canonical PostgreSQL bigint value.');
    checkDatabaseRange(amount);
    return Money.of(amount, currency);
  }

  add(other: Money): Money {
    this.checkCurrency(other);
    return Money.of(this.amountMinor + other.amountMinor, this.currency);
  }

  subtract(other: Money): Money {
    this.checkCurrency(other);
    return Money.of(this.amountMinor - other.amountMinor, this.currency);
  }

  toJson(): { amountMinor: number; currency: string } {
    const amountMinor = Number(this.amountMinor);
    if (!Number.isSafeInteger(amountMinor)) {
      throw new RangeError('Money exceeds the safe JSON number range.');
    }
    return { amountMinor, currency: this.currency };
  }

  toDatabase(): string {
    checkDatabaseRange(this.amountMinor);
    return this.amountMinor.toString();
  }

  private checkCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new RangeError('Money arithmetic requires the same currency.');
    }
  }
}

function checkDatabaseRange(amountMinor: bigint): void {
  if (amountMinor < minDatabaseAmount || amountMinor > maxDatabaseAmount) {
    throw new RangeError('Money exceeds the PostgreSQL bigint range.');
  }
}
