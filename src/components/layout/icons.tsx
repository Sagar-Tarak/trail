export {
  MenuOutlined as MenuIcon,
  LeftOutlined as ChevronLeftIcon,
  RightOutlined as ChevronRightIcon,
  BellOutlined as BellIcon,
  SearchOutlined as SearchIcon,
  DashboardOutlined as DashboardIcon,
  TeamOutlined as UsersIcon,
  BarChartOutlined as AnalyticsIcon,
  SettingOutlined as SettingsIcon,
  ThunderboltOutlined as ActivityIcon,
  FileTextOutlined as ReportsIcon,
} from "@ant-design/icons";

import { DownOutlined } from "@ant-design/icons";

export const ChevronDownIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <DownOutlined className={className} />
);
