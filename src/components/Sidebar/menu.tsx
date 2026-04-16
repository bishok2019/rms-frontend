import { useMemo } from "react";
import { NavLink } from "react-router";
import {
  Home,
  BarChart3,
  Settings,
  Users,
  Table2,
  FileText,
  HelpCircle,
  LogOut,
  UtensilsCrossed,
  ChefHat,
  FileCode,
  ShoppingCart,
  Shield,
  UserCheck,
} from "lucide-react";
import { cn } from "../../Utils/utils";
import useAuthenticationStore from "@/pages/Authentication/Store/authenticationStore";

interface MenuProps {
  isOpen: boolean;
}

export const menuItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
    permissions: ["dashboard", "view_dashboard"],
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    permissions: ["analytics", "view_analytics"],
  },
  {
    href: "/users",
    label: "Users",
    icon: Users,
    permissions: ["users", "view_user", "view_users"],
  },
  {
    href: "/reports",
    label: "Reports",
    icon: FileText,
    permissions: ["reports", "view_reports"],
  },
  {
    href: "/setup/tables",
    label: "Tables",
    icon: Table2,
    permissions: ["tables", "view_tables", "view_table"],
  },
  {
    href: "/setup/menu-setup",
    label: "Menu",
    icon: UtensilsCrossed,
    permissions: ["menu", "view_menu", "view_menu_item", "view_menu_items"],
  },
  {
    href: "/setup/kitchen",
    label: "Kitchen",
    icon: ChefHat,
    permissions: ["kitchen", "view_kitchen"],
  },
  {
    href: "/setup",
    label: "Setup",
    icon: Settings,
    permissions: ["setup", "view_setup"],
  },
  {
    href: "/help",
    label: "Help",
    icon: HelpCircle,
    permissions: ["help", "view_help"],
  },
  {
    href: "/api-logs",
    label: "API Logs",
    icon: FileCode,
    permissions: ["admin"], // Assuming only admin can view logs
  },
  {
    href: "/orders",
    label: "Orders",
    icon: ShoppingCart,
    permissions: ["admin"], // Temporarily set to admin
  },
  {
    href: "/roles",
    label: "Roles",
    icon: UserCheck,
    permissions: ["admin"], // Temporarily set to admin
  },
  {
    href: "/employees",
    label: "Employees",
    icon: Users,
    permissions: [], // No permissions required
  },
  {
    href: "/permissions",
    label: "Permissions",
    icon: Shield,
    permissions: ["admin"], // Temporarily set to admin
  },
];

export const logoutItem = {
  href: "#",
  label: "Logout",
  icon: LogOut,
  onClick: () => {
    // Logout logic will be handled by parent component
  },
};

export function Menu({ isOpen }: MenuProps) {
  const isAdmin = useAuthenticationStore((state) => state.isAdmin);
  const permissions = useAuthenticationStore((state) => state.permissions);

  const items = useMemo(() => {
    if (isAdmin || permissions.length === 0) {
      return menuItems;
    }

    const normalized = permissions.map((p) => p.toLowerCase());

    return menuItems.filter((item) => {
      if (!item.permissions || item.permissions.length === 0) {
        return true;
      }
      return item.permissions.some((candidate) =>
        normalized.some(
          (current) => current === candidate || current.includes(candidate)
        )
      );
    });
  }, [isAdmin, permissions]);

  return (
    <nav className="space-y-2 flex-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.href}
            to={item.href}
            end
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors",
                "bg-white/85 dark:bg-zinc-900/75",
                "border-zinc-200/70 dark:border-zinc-700/70",
                "text-zinc-900 dark:text-zinc-100",
                "hover:bg-white dark:hover:bg-zinc-800/90",
                isActive &&
                  "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
              )
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0 opacity-90" />
            <span
              className={cn(
                "text-sm font-semibold whitespace-nowrap transition-[opacity,width] duration-300",
                !isOpen ? "opacity-0 w-0" : "opacity-100 w-auto"
              )}
            >
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
