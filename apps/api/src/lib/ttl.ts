/** Parses compact durations like `15m`, `12h`, `7d`, `3600s` into milliseconds. */
export function parseDurationToMs(input: string): number {
  const trimmed = input.trim();
  const match = /^(\d+)(ms|s|m|h|d)$/i.exec(trimmed);
  if (!match) {
    return 12 * 60 * 60 * 1000;
  }
  const n = Number(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "ms":
      return n;
    case "s":
      return n * 1000;
    case "m":
      return n * 60 * 1000;
    case "h":
      return n * 60 * 60 * 1000;
    case "d":
      return n * 24 * 60 * 60 * 1000;
    default:
      return 12 * 60 * 60 * 1000;
  }
}
