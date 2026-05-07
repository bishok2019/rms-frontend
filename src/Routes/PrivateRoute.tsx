import { Route, Routes, useNavigate } from "react-router";
import PrivateLayout from "./PrivateLayout";


import { useEffect } from "react";
import { DashboardPage } from "../pages/Dashboard/Pages/Dashboard";
import SetupPage from "../pages/Setup/Pages";
import TablesPage from "../pages/Setup/Pages/Tables/Pages";
import MembersSetup from "../pages/Setup/Pages/Members/Page";
import MenuSetup from "../pages/Setup/Pages/Menu/Pages";
import KitchenPage from "../pages/Setup/Pages/Kitchen";
import InventorySetup from "../pages/Setup/Pages/Inventory/Page";
import RestaurantSetup from "../pages/Setup/Pages/Restaurant/Page";
import UsersPage from "../pages/Users";
import ApiLogsPage from "../pages/ApiLogs";
import OrdersPage from "../pages/Orders";
import POSPage from "../pages/POS";
import RolesPage from "../pages/Roles";
import PermissionsPage from "../pages/Permissions";
import EmployeesPage from "../pages/Employees";
import useAuthenticationStore from "@/pages/Authentication/Store/authenticationStore";

const PrivateRoutes = () => {
  const logout = useAuthenticationStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      if (isCtrlOrCmd && event.key.toLowerCase() === "l") {
        event.preventDefault(); // Prevent browser's Ctrl+L behavior
        logout(navigate); // Call logout from zustand store
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [logout, navigate]);
  return (
    <Routes>
        <Route element={<PrivateLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/setup/tables" element={<TablesPage />} />
          <Route path="/setup/members" element={<MembersSetup />} />
          <Route path="/setup/menu-setup" element={<MenuSetup />} />
          <Route path="/setup/kitchen" element={<KitchenPage />} />
          <Route path="/setup/inventory" element={<InventorySetup />} />
          <Route path="/setup/restaurant" element={<RestaurantSetup />} />
          <Route path="/api-logs" element={<ApiLogsPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/permissions" element={<PermissionsPage />} />
        </Route>
    </Routes>
  );
};

export default PrivateRoutes;
