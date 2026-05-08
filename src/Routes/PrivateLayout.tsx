import { Outlet } from "react-router";
import { startTransition } from "react";
import { useStore } from "../hooks/use-store";
import { useSidebar } from "../hooks/use-sidebar";
import { Sidebar } from "../components/Sidebar/sidebar";
import { useBackgroundPreference } from "@/contexts/background-preference-context";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Menu, X } from "lucide-react";

const scheduleAfterPaint = (callback: () => void) => {
  if (typeof window === "undefined") {
    startTransition(callback);
    return;
  }

  window.requestAnimationFrame(() => {
    window.setTimeout(() => startTransition(callback), 0);
  });
};

export default function PrivateLayout() {
  const sidebar = useStore(useSidebar, (x) => x);
  const { bgImagesEnabled } = useBackgroundPreference();
  if (!sidebar) return null;
  const { getOpenState, settings, toggleOpen } = sidebar;
  const handleToggleSidebar = () => {
    scheduleAfterPaint(toggleOpen);
  };

  return (
    <>
      <Sidebar />
      {/* Sidebar Toggle Button */}
      {!settings.disabled && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleToggleSidebar}
          className={cn(
            "fixed left-4 top-4 z-50 shadow-md bg-background/95 backdrop-blur-sm transition-transform ease-in-out duration-300 will-change-transform",
            getOpenState() && "translate-x-[216px]"
          )}
          aria-label={getOpenState() ? "Hide sidebar" : "Show sidebar"}
        >
          {getOpenState() ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      )}
      <main
        className={cn(
          "flex-1 overflow-hidden transition-transform ease-in-out duration-300 relative flex flex-col min-h-0 will-change-transform",
          bgImagesEnabled ? "bg-transparent" : "bg-background",
          !settings.disabled && !getOpenState() && "pl-14",
          !settings.disabled && getOpenState() && "lg:w-[calc(100%-18rem)] lg:translate-x-72"
        )}
      >
        <Outlet />
      </main>
    </>
  );
}
