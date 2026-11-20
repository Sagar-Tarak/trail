import { Drawer } from "antd";
import type { ReactNode } from "react";

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function FilterDrawer({ open, onClose, children }: FilterDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width={380}
      title={<span className="text-sm font-medium text-gray-800">Filters</span>}
      styles={{
        header: {
          borderBottom: "1px solid #E8EAED",
          padding: "14px 20px",
        },
        body: {
          padding: "20px",
        },
        footer: {
          borderTop: "1px solid #E8EAED",
          padding: "12px 20px",
        },
      }}
      closable
      destroyOnHidden={false}
    >
      {children}
    </Drawer>
  );
}
