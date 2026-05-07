import { Outlet } from "react-router";
import { useStore } from "../hooks/use-store";
import { useSidebar } from "../hooks/use-sidebar";
import { Sidebar } from "../components/Sidebar/sidebar";
import { useBackgroundPreference } from "@/contexts/background-preference-context";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Menu, X } from "lucide-react";

export default function PrivateLayout() {
  const sidebar = useStore(useSidebar, (x) => x);
  const { bgImagesEnabled } = useBackgroundPreference();
  if (!sidebar) return null;
  const { getOpenState, settings, toggleOpen } = sidebar;
  return (
    <>
      <Sidebar />
      <main
        className={cn(
          "flex-1 overflow-hidden transition-[margin-left] ease-in-out duration-300 relative flex flex-col min-h-0",
          bgImagesEnabled ? "bg-transparent" : "bg-background",
          !settings.disabled && getOpenState() && "lg:ml-72"
        )}
      >
        {/* Sidebar Toggle Button */}
        {!settings.disabled && (
          <Button
            variant="outline"
            size="icon"
            onClick={toggleOpen}
            className={cn(
              "fixed top-4 z-50 shadow-md bg-background/95 backdrop-blur-sm transition-[left] ease-in-out duration-300",
              getOpenState() ? "left-[280px]" : "left-4"
            )}
            aria-label={getOpenState() ? "Hide sidebar" : "Show sidebar"}
          >
            {getOpenState() ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        )}

        <Outlet />
      </main>
    </>
  );
}
