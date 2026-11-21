import { describe, expect, it } from 'vitest';
import { Money } from '../../src/shared/values/money.js';

describe('Money', () => {
  it('preserves exact signed minor-unit arithmetic beyond the JSON number range', () => {
    const initial = Money.fromDatabase('9007199254740992', 'INR');
    const delta = Money.fromJson(1, 'INR');
    expect(initial.add(delta).toDatabase()).toBe('9007199254740993');
    expect(delta.subtract(initial).amountMinor).toBe(-9007199254740991n);
    expect(delta.subtract(initial).toJson()).toEqual({ amountMinor: -9007199254740991, currency: 'INR' });
    expect(() => initial.toJson()).toThrow(RangeError);
  });

  it('rejects mixed currencies and unrecognized codes', () => {
    expect(() => Money.of(1n, 'JPY').add(Money.of(1n, 'INR'))).toThrow(RangeError);
    expect(() => Money.of(1n, 'inr')).toThrow(RangeError);
    expect(() => Money.of(1n, 'ZZZ')).toThrow(RangeError);
  });

  it.each([0.5, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid JSON amount %s', (value) => {
    expect(() => Money.fromJson(value, 'USD')).toThrow(RangeError);
  });

  it.each(['-9223372036854775808', '9223372036854775807', '0'])('round-trips PostgreSQL amount %s', (value) => {
    expect(Money.fromDatabase(value, 'KWD').toDatabase()).toBe(value);
  });

  it.each(['9223372036854775808', '-9223372036854775809', '01', '-0', '+1', ' 1', '1.0', '1e2', '1\n'])('rejects invalid PostgreSQL amount %s', (value) => {
    expect(() => Money.fromDatabase(value, 'USD')).toThrow(RangeError);
  });

  it('checks database bounds again after arithmetic', () => {
    const amount = Money.fromDatabase('9223372036854775807', 'USD').add(Money.of(1n, 'USD'));
    expect(amount.amountMinor).toBe(9223372036854775808n);
    expect(() => amount.toDatabase()).toThrow(RangeError);
  });
});
