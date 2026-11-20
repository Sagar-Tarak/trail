import { DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { wallTimeToInstant } from "./zonedDates";

export function ZonedDatePicker({
  value,
  onChange,
  ...props
}: {
  value?: Dayjs | null;
  onChange?: (value: Dayjs | null) => void;
  showTime?: boolean;
  className?: string;
  id?: string;
}) {
  const timeZone = useTimeZoneStore((state) => state.timeZone);
  return (
    <DatePicker
      {...props}
      value={value?.tz(timeZone) ?? null}
      needConfirm={false}
      format="DD MMM YYYY HH:mm:ss"
      onChange={(date) =>
        onChange?.(date ? wallTimeToInstant(date, timeZone) : null)
      }
    />
  );
}
