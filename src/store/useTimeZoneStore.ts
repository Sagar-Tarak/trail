import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultTimeZone, validTimeZone } from "../features/company/time";

interface TimeZoneState {
  timeZone: string;
  setTimeZone: (timeZone: string) => void;
}
export const useTimeZoneStore = create<TimeZoneState>()(
  persist(
    (set) => ({
      timeZone: defaultTimeZone,
      setTimeZone: (timeZone) => set({ timeZone: validTimeZone(timeZone) }),
    }),
    {
      name: "trail-time-zone",
      merge: (persisted, current) => ({
        ...current,
        timeZone: validTimeZone(
          (persisted as Partial<TimeZoneState> | undefined)?.timeZone,
        ),
      }),
    },
  ),
);
