import { Outlet } from "react-router";
import { useStore } from "../hooks/use-store";
import { useSidebar } from "../hooks/use-sidebar";
import { Sidebar } from "../components/Sidebar/sidebar";
import { useBackgroundPreference } from "@/contexts/background-preference-context";
import { cn } from "../lib/utils";

export default function PrivateLayout() {
  const sidebar = useStore(useSidebar, (x) => x);
  const { bgImagesEnabled } = useBackgroundPreference();
  if (!sidebar) return null;
  const { getOpenState, settings } = sidebar;
  return (
    // <div>
    //   <SidebarProvider>
    //   <div className="flex w-full">
    //     <AppSidebar />
    //     {/* <Sidebar /> */}
    //     <main className="flex-1 flex flex-col">
    //       <div className="px-4 top-bar bg-primary h-8 w-full flex items-center">
    //         <div className="container mx-auto flex justify-between items-center">
    //           <div className="text-white text-xs">
    //             <ClockDisplay />
    //           </div>
    //           <div className="flex items-center gap-2">
    //             <img width={10} src="/assets/nepalflag.png" alt="logo" />
    //             <div className="text-white text-xs">
    //               | <a href="tel:+977 01-44111234">+977 01-44111234</a>
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //       <div className="flex-1">
    //         <Outlet />
    //       </div>
    //       <Footer />
    //     </main>
    //   </div>
    //   </SidebarProvider>
    // </div>
    <>
      <Sidebar />
      <main
        className={cn(
          "min-h-[calc(100vh_-_32px)] transition-[margin-left] ease-in-out duration-300",
          bgImagesEnabled ? "bg-transparent" : "bg-background",
          !settings.disabled && (!getOpenState() ? "lg:ml-[90px]" : "lg:ml-72")
        )}
      >

        <Outlet />
      </main>
    </>
  );
}
