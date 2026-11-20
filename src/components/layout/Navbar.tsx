import { CompanyScopeSelect } from "@/features/company/CompanyScopeSelect";
import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { defaultTimeZone, localTimeZone } from "@/features/company/time";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dropdown, Select } from "antd";
import { MenuOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/store/useAuthStore";
import type { NavbarProps } from "./types";

export function Navbar({
  title = "Dashboard",
  onMenuToggle,
  sidebarCollapsed,
}: NavbarProps) {
  const timeZone = useTimeZoneStore((state) => state.timeZone);
  const setTimeZone = useTimeZoneStore((state) => state.setTimeZone);
  const zones = [...new Set([defaultTimeZone, "UTC", localTimeZone, timeZone])];
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    await useAuthStore.getState().logout();
    navigate("/auth/login", { replace: true });
    setBusy(false);
  }
  return (
    <header className="sticky top-0 z-30 flex min-h-14 flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-2 shadow-sm">
      <Button
        type="text"
        icon={<MenuOutlined />}
        onClick={onMenuToggle}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      />
      <span className="min-w-0 truncate text-sm font-semibold text-gray-800">
        {title}
      </span>
      <span className="ml-auto hidden text-sm text-gray-500 xl:block">
        {tenant?.company_name}
      </span>
      <CompanyScopeSelect />
      <div className="ml-auto flex items-center gap-2 xl:ml-0">
        <span className="hidden text-xs text-gray-500 lg:inline">
          Time zone
        </span>
        <Select
          aria-label="Workspace time zone"
          value={timeZone}
          onChange={setTimeZone}
          size="small"
          className="min-w-36"
          options={zones.map((zone) => ({ value: zone, label: zone }))}
        />
      </div>
      <Dropdown
        menu={{
          items: [
            {
              key: "account",
              label: "Team & account",
              icon: <UserOutlined />,
              onClick: () => navigate("/users"),
            },
            {
              key: "logout",
              label: "Sign out",
              icon: <LogoutOutlined />,
              danger: true,
              onClick: logout,
            },
          ],
        }}
        trigger={["click"]}
      >
        <Button loading={busy} icon={<UserOutlined />}>
          <span className="inline-block max-w-28 truncate align-middle sm:max-w-40">
            {user?.name ?? "Account"}
          </span>
        </Button>
      </Dropdown>
    </header>
  );
}
