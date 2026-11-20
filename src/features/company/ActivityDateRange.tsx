import { DatePicker, Grid, TimePicker } from "antd";
import type { Dayjs } from "dayjs";
import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { dayjs, joinWallDateAndTime } from "./zonedDates";

/** Date-only range selection advances from start to end; clocks stay independently editable. */
export function ActivityDateRange({
  value,
  onChange,
  id,
}: {
  value?: [Dayjs, Dayjs];
  onChange?: (value: [Dayjs, Dayjs]) => void;
  id?: string;
}) {
  const timeZone = useTimeZoneStore((state) => state.timeZone);
  const screens = Grid.useBreakpoint();
  const wall = value
    ? ([value[0].tz(timeZone), value[1].tz(timeZone)] as const)
    : undefined;
  function selectDates(start: Dayjs, end: Dayjs) {
    if (wall)
      onChange?.([
        joinWallDateAndTime(start, wall[0], timeZone),
        joinWallDateAndTime(end, wall[1], timeZone),
      ]);
  }
  const presets = [
    {
      label: "Today",
      value: (): [Dayjs, Dayjs] => [
        dayjs().tz(timeZone).startOf("day"),
        dayjs().tz(timeZone).endOf("day"),
      ],
    },
    {
      label: "Yesterday",
      value: (): [Dayjs, Dayjs] => [
        dayjs().tz(timeZone).subtract(1, "day").startOf("day"),
        dayjs().tz(timeZone).subtract(1, "day").endOf("day"),
      ],
    },
    {
      label: "Last 7 days",
      value: (): [Dayjs, Dayjs] => [
        dayjs().tz(timeZone).subtract(6, "day").startOf("day"),
        dayjs().tz(timeZone).endOf("day"),
      ],
    },
    {
      label: "Last 30 days",
      value: (): [Dayjs, Dayjs] => [
        dayjs().tz(timeZone).subtract(29, "day").startOf("day"),
        dayjs().tz(timeZone).endOf("day"),
      ],
    },
  ];
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {screens.sm ? (
        <DatePicker.RangePicker
          id={id}
          value={wall ? [wall[0], wall[1]] : undefined}
          onChange={(dates) => {
            if (dates?.[0] && dates[1]) selectDates(dates[0], dates[1]);
          }}
          className="w-full"
          format="DD MMM YYYY"
          allowClear={false}
          needConfirm={false}
          placeholder={["From date", "Through date"]}
          presets={presets}
        />
      ) : (
        <div className="grid min-w-0 grid-cols-2 gap-3">
          <DatePicker
            id={id}
            aria-label="Activity start date"
            value={wall?.[0]}
            onChange={(date) => {
              if (date && wall) selectDates(date, wall[1]);
            }}
            format="DD MMM YYYY"
            allowClear={false}
            needConfirm={false}
          />
          <DatePicker
            aria-label="Activity end date"
            value={wall?.[1]}
            onChange={(date) => {
              if (date && wall) selectDates(wall[0], date);
            }}
            format="DD MMM YYYY"
            allowClear={false}
            needConfirm={false}
          />
        </div>
      )}
      <div className="grid min-w-0 grid-cols-2 gap-3">
        <label className="flex min-w-0 flex-col gap-1 text-xs text-slate-500">
          From time
          <TimePicker
            aria-label="Activity start time"
            className="w-full"
            value={wall?.[0]}
            format="HH:mm:ss"
            allowClear={false}
            needConfirm={false}
            onChange={(time) => {
              if (time && wall && value)
                onChange?.([
                  joinWallDateAndTime(wall[0], time, timeZone),
                  value[1],
                ]);
            }}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs text-slate-500">
          Through time
          <TimePicker
            aria-label="Activity end time"
            className="w-full"
            value={wall?.[1]}
            format="HH:mm:ss"
            allowClear={false}
            needConfirm={false}
            onChange={(time) => {
              if (time && wall && value)
                onChange?.([
                  value[0],
                  joinWallDateAndTime(wall[1], time, timeZone),
                ]);
            }}
          />
        </label>
      </div>
    </div>
  );
}
