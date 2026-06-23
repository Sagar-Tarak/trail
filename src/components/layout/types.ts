export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

export interface SidebarProps {
  items: NavItem[];
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export interface NavbarProps {
  title?: string;
  onMenuToggle?: () => void;
  sidebarCollapsed?: boolean;
}
