const explicitTimestamp = /^([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2})(?:Z|[+-][0-9]{2}:[0-9]{2})$/;

export function parseZonedEventTime(timestamp: string, timeZone: string): { instant: string; timeZone: string } {
  const localTime = explicitTimestamp.exec(timestamp)?.[1];
  if (!localTime || localTime.startsWith('0000') || timestamp.endsWith('-00:00')) {
    throw new RangeError('Use an event timestamp with seconds and a known explicit offset.');
  }
  if (!/^[A-Za-z][A-Za-z0-9_+/-]*$/.test(timeZone)) {
    throw new RangeError('Use an IANA event time zone.');
  }

  const instant = new Date(timestamp);
  if (!Number.isFinite(instant.valueOf())) throw new RangeError('Invalid event timestamp.');

  const formatter = new Intl.DateTimeFormat('en', {
    timeZone,
    calendar: 'iso8601',
    numberingSystem: 'latn',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const fields = Object.fromEntries(formatter.formatToParts(instant).map(({ type, value }) => [type, value]));
  const formatted = `${fields.year?.padStart(4, '0')}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}:${fields.second}`;
  if (formatted !== localTime) {
    throw new RangeError('Event local time and offset do not match the time zone.');
  }
  return { instant: instant.toISOString(), timeZone };
}
