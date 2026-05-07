"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import useAuthenticationStore from "../../Authentication/Store/authenticationStore";
import { ordersApi } from "../../../services/orders";
import { getSections, getDiningTables } from "../../Setup/Pages/Tables/Store/api";
import { getCategories, getMenuItems } from "../../Setup/Pages/Menu/Store/api";
import type {
  Order,
  DiningTable,
  OrderStatus
} from "../../../types/api";

interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    completed: number;
    todayRevenue: number;
  };
  tables: {
    total: number;
    occupied: number;
    available: number;
  };
  sections: {
    total: number;
    active: number;
  };
  menu: {
    categories: number;
    items: number;
    available: number;
  };
}

interface RecentOrder extends Order {
  customerName?: string;
  tableNumber?: string;
}

export const DashboardPage = () => {
  console.log('DashboardPage: Component rendering');
  const user = useAuthenticationStore((state) => state.user);
  console.log('DashboardPage: User:', user);
  const [stats, setStats] = useState<DashboardStats>({
    orders: { total: 0, pending: 0, completed: 0, todayRevenue: 0 },
    tables: { total: 0, occupied: 0, available: 0 },
    sections: { total: 0, active: 0 },
    menu: { categories: 0, items: 0, available: 0 }
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentTables, setRecentTables] = useState<DiningTable[]>([]);
  const [loading, setLoading] = useState(true);
  console.log('DashboardPage: Initial loading state:', loading);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    console.log('DashboardPage: Starting fetchDashboardData');
    try {
      setLoading(true);

      // Fetch orders data
      const ordersResponse = await ordersApi.getOrders({ page_size: 10 });
      const orders = ordersResponse.data || [];

      // Calculate order stats
      const orderStats = {
        total: ordersResponse.totalCount || 0,
        pending: orders.filter(o => o.status === 'pending').length,
        completed: orders.filter(o => o.status === 'completed').length,
        todayRevenue: orders
          .filter(o => o.status === 'completed' && o.completedAt)
          .reduce((sum, o) => sum + parseFloat(o.subtotal || '0'), 0)
      };

      // Fetch recent orders with customer details
      const recentOrdersData = orders.slice(0, 5).map(order => ({
        ...order,
        customerName: typeof order.customer === 'object' && order.customer
          ? order.customer.fullName
          : 'Walk-in Customer',
        tableNumber: typeof order.diningTable === 'string'
          ? order.diningTable
          : undefined
      }));

      // Fetch tables data
      const tablesResponse = await getDiningTables();
      const tables = tablesResponse.data || [];
      const tableStats = {
        total: tablesResponse.totalCount || 0,
        occupied: tables.filter(t => t.isOccupied).length,
        available: tables.filter(t => !t.isOccupied).length
      };

      // Fetch sections data
      const sectionsResponse = await getSections();
      const sections = sectionsResponse.data || [];
      const sectionStats = {
        total: sectionsResponse.totalCount || 0,
        active: sections.filter(s => s.isActive).length
      };

      // Fetch menu data
      const [categoriesResponse, menuItemsResponse] = await Promise.all([
        getCategories(),
        getMenuItems()
      ]);

      const menuItems = menuItemsResponse.data || [];
      const menuStats = {
        categories: categoriesResponse.totalCount || 0,
        items: menuItemsResponse.totalCount || 0,
        available: menuItems.filter(item => item.isAvailable).length
      };

      // Get recent tables (first 5)
      const recentTablesData = tables.slice(0, 5);

      console.log('DashboardPage: Setting stats:', { orderStats, tableStats, sectionStats, menuStats });
      console.log('DashboardPage: Recent orders:', recentOrdersData);
      console.log('DashboardPage: Recent tables:', recentTablesData);
      setStats({
        orders: orderStats,
        tables: tableStats,
        sections: sectionStats,
        menu: menuStats
      });
      setRecentOrders(recentOrdersData);
      setRecentTables(recentTablesData);
      console.log('DashboardPage: Data set successfully');

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      console.log('DashboardPage: Setting loading to false');
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTableStatusColor = (isOccupied: boolean) => {
    return isOccupied
      ? 'bg-red-100 text-red-800'
      : 'bg-green-100 text-green-800';
  };

  console.log('DashboardPage: Render - loading:', loading, 'stats:', stats, 'recentOrders:', recentOrders.length, 'recentTables:', recentTables.length);
  if (loading) {
    console.log('DashboardPage: Rendering loading spinner');
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="sticky top-0 z-10 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 pl-6">
          Welcome back, {user?.name || user?.username || "there"}! 👋
        </h2>
        <p className="text-gray-600">
          Here's an overview of your restaurant's performance and operations.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Orders Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <span className="text-2xl">📋</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.orders.pending} pending, {stats.orders.completed} completed
            </p>
            <div className="mt-2 text-sm text-green-600 font-medium">
              ₹{stats.orders.todayRevenue.toFixed(2)} revenue
            </div>
          </CardContent>
        </Card>

        {/* Tables Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tables</CardTitle>
            <span className="text-2xl">🪑</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tables.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.tables.available} available, {stats.tables.occupied} occupied
            </p>
            <div className="mt-2 flex gap-1">
              <Badge variant="outline" className="text-xs">
                {Math.round((stats.tables.available / stats.tables.total) * 100)}% free
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Sections Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sections</CardTitle>
            <span className="text-2xl">🏢</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sections.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.sections.active} active sections
            </p>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Restaurant Layout
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Menu Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menu</CardTitle>
            <span className="text-2xl">🍽️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.menu.items}</div>
            <p className="text-xs text-muted-foreground">
              {stats.menu.categories} categories, {stats.menu.available} available
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {Math.round((stats.menu.available / stats.menu.items) * 100)}% available
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">#{order.orderNumber}</span>
                        <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.customerName} • ₹{order.subtotal}
                      </p>
                      {order.tableNumber && (
                        <p className="text-xs text-muted-foreground">
                          Table: {order.tableNumber}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'N/A'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <span className="text-4xl block mb-2">📋</span>
                  <p>No recent orders</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Table Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTables.length > 0 ? (
                recentTables.map((table) => (
                  <div key={table.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Table {table.tableNumber}</span>
                        <Badge className={`text-xs ${getTableStatusColor(table.isOccupied)}`}>
                          {table.isOccupied ? 'Occupied' : 'Available'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Capacity: {table.seatingCapacity} seats
                      </p>
                      {table.specialRequests && (
                        <p className="text-xs text-muted-foreground">
                          {table.specialRequests}
                        </p>
                      )}
                    </div>
                    <div className="text-sm">
                      {table.isOccupied ? '🔴' : '🟢'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <span className="text-4xl block mb-2">🪑</span>
                  <p>No tables configured</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <span className="text-2xl mb-2">➕</span>
              <span className="text-sm font-medium">New Order</span>
            </button>
            <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <span className="text-2xl mb-2">🪑</span>
              <span className="text-sm font-medium">Add Table</span>
            </button>
            <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <span className="text-2xl mb-2">🍽️</span>
              <span className="text-sm font-medium">Add Menu Item</span>
            </button>
            <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <span className="text-2xl mb-2">📊</span>
              <span className="text-sm font-medium">View Reports</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
