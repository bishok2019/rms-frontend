import { Link } from "react-router";
import { useStore } from "../../hooks/use-store";
import { useSidebar } from "../../hooks/use-sidebar";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Menu } from "./menu";

export function Sidebar() {
  const sidebar = useStore(useSidebar, (x) => x);
  if (!sidebar) return null;
  const { setIsHover, settings } = sidebar;

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen w-72 font-poppins scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-transparent",
        settings.disabled && "hidden"
      )}
    >
      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="relative h-full flex flex-col px-3 py-4 overflow-y-auto shadow-md dark:shadow-zinc-800 bg-white dark:bg-zinc-900 scrollbar-hidden"
      >
        <Button
          className={cn("transition-transform ease-in-out duration-300 mb-1")}
          variant="link"
          asChild
        >
          <Link to="/dashboard" className="flex items-center gap-2">
            <h1 className="text-md font-bold text-gray-900 dark:text-white">
              Respo
            </h1>
          </Link>
        </Button>
        <Menu isOpen={true} />
      </div>
    </aside>
  );
}
