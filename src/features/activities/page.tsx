import { MasterTablePage } from "@/layouts/MasterTablePage";
import { activityConfig } from "./activity.config";
import type { Activity } from "./activity.types";

export function ActivitiesPage() {
  return <MasterTablePage<Activity> config={activityConfig} />;
}
