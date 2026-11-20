import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);
export { dayjs };

/** Interpret a calendar selection as wall time in the workspace's zone. */
export function wallTimeToInstant(value: Dayjs, timeZone: string) {
  return dayjs.tz(value.format("YYYY-MM-DD HH:mm:ss.SSS"), timeZone).utc();
}

/** The calendar displays whole seconds, so include the entire final second. */
export function rangeToUtcBounds(range: readonly [Dayjs, Dayjs]) {
  return {
    from: range[0].utc().startOf("second").toISOString(),
    to: range[1].utc().endOf("second").toISOString(),
  };
}

/** Join calendar and clock selections without changing their workspace wall values. */
export function joinWallDateAndTime(
  date: Dayjs,
  time: Dayjs,
  timeZone: string,
) {
  return dayjs
    .tz(`${date.format("YYYY-MM-DD")} ${time.format("HH:mm:ss.SSS")}`, timeZone)
    .utc();
}
