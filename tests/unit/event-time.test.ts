import { describe, expect, it } from 'vitest';
import { parseZonedEventTime } from '../../src/shared/values/event-time.js';

describe('event time', () => {
  it('preserves the event zone and returns a UTC instant', () => {
    expect(parseZonedEventTime('2026-11-20T18:30:00+05:30', 'Asia/Kolkata'))
      .toEqual({ instant: '2026-11-20T13:00:00.000Z', timeZone: 'Asia/Kolkata' });
    expect(parseZonedEventTime('2026-11-20T00:00:00Z', 'UTC').instant).toBe('2026-11-20T00:00:00.000Z');
  });

  it('distinguishes both occurrences of a repeated hour using their offsets', () => {
    expect(parseZonedEventTime('2026-11-01T01:30:00-04:00', 'America/New_York').instant)
      .toBe('2026-11-01T05:30:00.000Z');
    expect(parseZonedEventTime('2026-11-01T01:30:00-05:00', 'America/New_York').instant)
      .toBe('2026-11-01T06:30:00.000Z');
  });

  it.each([
    ['2026-03-08T02:30:00-05:00', 'America/New_York'],
    ['2026-03-08T02:30:00-04:00', 'America/New_York'],
    ['2026-11-01T01:30:00', 'America/New_York'],
    ['2026-11-01T01:30:00-06:00', 'America/New_York'],
    ['2026-02-30T00:00:00Z', 'UTC'],
    ['2026-04-01T24:00:00Z', 'UTC'],
    ['2026-11-20T00:00:00-00:00', 'UTC'],
    ['2026-11-20T00:00:00Z', 'Invalid/Zone'],
    ['2026-11-20T00:00:00+05:30', '+05:30'],
  ])('rejects invalid event input %s in %s', (timestamp, zone) => {
    expect(() => parseZonedEventTime(timestamp, zone)).toThrow(RangeError);
  });
});
