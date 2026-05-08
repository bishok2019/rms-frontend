import { NavLink } from "react-router";
import { Shield, UserCheck } from "lucide-react";
import { cn } from "@/Utils/utils";

const accessLinks = [
  {
    href: "/roles",
    label: "Roles",
    icon: UserCheck,
  },
  {
    href: "/permissions",
    label: "Permissions",
    icon: Shield,
  },
];

export function AccessManagementNav() {
  return (
    <nav
      aria-label="Access management"
      className="inline-grid w-full grid-cols-2 gap-2 rounded-md border bg-card p-1 sm:w-auto"
    >
      {accessLinks.map((link) => {
        const Icon = link.icon;

        return (
          <NavLink
            key={link.href}
            to={link.href}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-center gap-2 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:bg-muted hover:text-foreground",
                isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{link.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
