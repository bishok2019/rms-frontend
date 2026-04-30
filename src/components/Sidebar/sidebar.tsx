import { useState } from "react";
import { Link } from "react-router";
import { useNavigate } from "react-router";
import { ChevronUp, LogOut, UserRound } from "lucide-react";
import { cn } from "../../Utils/utils";
import { useStore } from "../../hooks/use-store";
import { useSidebar } from "../../hooks/use-sidebar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { ThemeToggle } from "../ui/theme-toggle";
import { Menu } from "./menu";
import { useBackgroundPreference } from "@/contexts/background-preference-context";
import ProfilePage from "@/pages/Profile";
import useAuthenticationStore, { useLogoutMutation } from "@/pages/Authentication/Store/authenticationStore";
import { successFunction } from "@/components/common/Alert";

export function Sidebar() {
  const sidebar = useStore(useSidebar, (x) => x);
  const navigate = useNavigate();
  const { bgImagesEnabled, setBgImagesEnabled } = useBackgroundPreference();
  const username = useAuthenticationStore((state) => state.username);
  const logoutMutation = useLogoutMutation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!sidebar) return null;
  const { setIsHover, settings, getOpenState } = sidebar;

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen w-72 font-poppins scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-transparent",
        settings.disabled && "hidden",
        !getOpenState() && "lg:hidden"
      )}
    >
      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className={cn(
          "relative h-full flex flex-col px-3 py-4 overflow-y-auto shadow-lg dark:shadow-black/60 border-r scrollbar-hidden",
          bgImagesEnabled
            ? "bg-white/85 dark:bg-zinc-950/82 backdrop-blur-md border-white/40 dark:border-zinc-800/70"
            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        )}
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
        <div className="flex items-center justify-between mb-4 gap-3">
          {/* <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={bgImagesEnabled}
              onChange={(e) => setBgImagesEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-400"
            />
            BG images
          </label> */}
          <ThemeToggle />
        </div>
        <Menu isOpen={true} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="mt-4 w-full justify-between border-gray-200 dark:border-zinc-700"
            >
              <span className="flex items-center gap-2 truncate">
                <UserRound className="h-4 w-4" />
                <span className="truncate">{username || "User"}</span>
              </span>
              <ChevronUp className="h-4 w-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" side="top">
            <DropdownMenuLabel className="truncate">
              {username || "User"}
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
              <UserRound className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logoutMutation.mutate(undefined, {
                  onSuccess: () => {
                    successFunction("Logged out successfully.");
                    navigate("/");
                  },
                });
              }}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent
            className="w-[94vw] sm:w-[86vw] lg:w-[72vw] !max-w-[94vw] sm:!max-w-[86vw] lg:!max-w-[1200px] !top-[42%] max-h-[92vh] overflow-y-auto p-0 border-zinc-200/70 dark:border-zinc-700/70 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 shadow-[0_28px_90px_rgba(10,10,30,0.32)]"
            showCloseButton
          >
            <DialogTitle className="sr-only">Profile</DialogTitle>
            <div className="transform-gpu [transform:perspective(1800px)_rotateX(1.5deg)]">
              <ProfilePage />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  );
}
