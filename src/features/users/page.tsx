import { MasterTablePage } from "@/layouts/MasterTablePage";
import { userConfig } from "./user.config.tsx";
import type { User } from "./user.types";

export function UsersPage() {
  return <MasterTablePage<User> config={userConfig} />;
}
