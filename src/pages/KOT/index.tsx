"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Printer, ArrowLeft, Filter, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { useTheme } from "../../contexts/theme-context";
import { privateApiInstance } from "../../Utils/ky";

interface PosOrderItem {
  id: number;
  orderType: string;
  order: number;
  orderItem: number | string | { id: number; name: string } | null;
  menu_item?: { id: number; name: string } | null;
  quantity: number;
  dietaryType: string;
  spiceLevel: string;
  servingSize: string;
  status: string;
  note: string | null;
  special_instructions: string | null;
}

interface PosOrder {
  id: number;
  orderNumber: string;
  status: string;
  diningTable: number | { id: number; tableNumber: string };
  createdAt: string;
  orderItems: PosOrderItem[];
}

const KOTPage = () => {
  const { theme } = useTheme();
  const [filters, setFilters] = useState({
    status: "all",
    payment_status: "all",
    payment_method: "all",
    dining_table: "all",
    menu_item: "all",
    served_by: "all",
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Lazy loading states for filter dropdowns
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
  const [isMenuItemDropdownOpen, setIsMenuItemDropdownOpen] = useState(false);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filters.status !== "all") params.append("status", filters.status);
    if (filters.payment_status !== "all") params.append("payment_status", filters.payment_status);
    if (filters.payment_method !== "all") params.append("payment_method", filters.payment_method);
    if (filters.dining_table !== "all") params.append("dining_table", filters.dining_table);
    if (filters.menu_item !== "all") params.append("order_items__order_item", filters.menu_item);
    if (filters.served_by !== "all") params.append("served_by", filters.served_by);
    if (filters.search.trim()) params.append("search", filters.search.trim());
    return params.toString();
  };

  // Fetch filter options only when dropdowns are opened (lazy loading)
  const { data: tablesData } = useQuery({
    queryKey: ["tables-list"],
    queryFn: async () => {
      const response = await privateApiInstance
        .get("core-app/dining_table/list")
        .json<{ success: boolean; data: Array<{ id: number; tableNumber: string; section?: { name?: string } | string }> }>();
      return response.data || [];
    },
    enabled: isTableDropdownOpen,
  });

  const { data: menuItemsData } = useQuery({
    queryKey: ["menu-items-list"],
    queryFn: async () => {
      const response = await privateApiInstance
        .get("core-app/menu/items/list")
        .json<{ success: boolean; data: Array<{ id: number; name: string }> }>();
      return response.data || [];
    },
    enabled: isMenuItemDropdownOpen,
  });

  const { data: employeesData } = useQuery({
    queryKey: ["employees-list"],
    queryFn: async () => {
      const response = await privateApiInstance
        .get("core-app/employee/list")
        .json<{ success: boolean; data: Array<{ id: number; name?: string; fullName?: string }> }>();
      return response.data || [];
    },
    enabled: isEmployeeDropdownOpen,
  });

  const { data: kotData, isLoading, error } = useQuery<PosOrder[], Error>({
    queryKey: ["kot-orders", filters],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const url = `core-app/orders/pos${queryString ? `?${queryString}` : ""}`;
      const response = await privateApiInstance
        .get(url)
        .json<{ success: boolean; data: PosOrder[] }>();
      return response.data || [];
    },
  });

  const clearFilters = () => {
    setFilters({
      status: "all",
      payment_status: "all",
      payment_method: "all",
      dining_table: "all",
      menu_item: "all",
      served_by: "all",
      search: "",
    });
    setSearchTerm("");
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "all" && value !== "");

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "preparing", label: "Preparing" },
    { value: "ready", label: "Ready" },
    { value: "served", label: "Served" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const paymentStatusOptions = [
    { value: "all", label: "All Payment Status" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "failed", label: "Failed" },
    { value: "refunded", label: "Refunded" },
  ];

  const paymentMethodOptions = [
    { value: "all", label: "All Payment Methods" },
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "online", label: "Online" },
    { value: "wallet", label: "Digital Wallet" },
  ];



  const tablesOptions = [
    { value: "all", label: "All Tables" },
    ...(tablesData?.map(table => ({
      value: table.id.toString(),
      label: `Table ${table.tableNumber}${table.section ? ` (${table.section.name || table.section})` : ''}`
    })) || [])
  ];

  const menuItemsOptions = [
    { value: "all", label: "All Menu Items" },
    ...(menuItemsData?.map(item => ({
      value: item.id.toString(),
      label: item.name
    })) || [])
  ];

  const employeesOptions = [
    { value: "all", label: "All Staff" },
    ...(employeesData?.map(employee => ({
      value: employee.id.toString(),
      label: employee.name || employee.fullName || `Employee ${employee.id}`
    })) || [])
  ];

  // Debounce search term to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getItemName = (orderItem: PosOrderItem) => {
    // First try to get name from orderItem field
    if (typeof orderItem.orderItem === "object" && orderItem.orderItem?.name) {
      return orderItem.orderItem.name;
    }

    // Then try menu_item field as fallback
    if (orderItem.menu_item && typeof orderItem.menu_item === "object" && orderItem.menu_item.name) {
      return orderItem.menu_item.name;
    }

    // If orderItem is just a string, use it directly
    if (typeof orderItem.orderItem === "string") {
      return orderItem.orderItem;
    }

    // Last resort - return unknown
    return "Unknown Item";
  };

  const getTableNumber = (order: PosOrder) => {
    if (typeof order.diningTable === "object" && order.diningTable?.tableNumber) {
      return order.diningTable.tableNumber;
    }
    return "N/A";
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center py-16">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme === 'dark' ? 'border-white' : 'border-gray-900'}`}></div>
          <span className={`ml-3 text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Loading Kitchen Order Tickets...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="text-center py-16">
          <div className={`text-lg mb-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
            Error loading KOT data
          </div>
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Please try again later
          </p>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className={theme === 'dark' ? 'border-gray-700 hover:bg-gray-800 text-white' : ''}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              size="icon"
              className={theme === 'dark' ? 'border-gray-700 hover:bg-gray-800' : ''}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Kitchen Order Tickets (KOT)
              </h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Live orders ready for kitchen preparation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className={`relative ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-800' : ''}`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  !
                </Badge>
              )}
            </Button>
            {kotData && kotData.length > 0 && (
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Printer className="h-4 w-4 mr-2" />
                Print All Tickets
              </Button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className={`mt-4 p-4 rounded-lg border ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Filter Orders
              </h3>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  size="sm"
                  className={`text-sm ${theme === 'dark' ? 'hover:bg-gray-700' : ''}`}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status
                </label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className={`w-full ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status Filter */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Payment Status
                </label>
                <Select value={filters.payment_status} onValueChange={(value) => setFilters(prev => ({ ...prev, payment_status: value }))}>
                  <SelectTrigger className={`w-full ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Payment Method
                </label>
                <Select value={filters.payment_method} onValueChange={(value) => setFilters(prev => ({ ...prev, payment_method: value }))}>
                  <SelectTrigger className={`w-full ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dining Table Filter */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Dining Table
                </label>
                <Select
                  value={filters.dining_table}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, dining_table: value }))}
                  onOpenChange={setIsTableDropdownOpen}
                >
                  <SelectTrigger className={`w-full ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : ''}`}>
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tablesOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              {/* Menu Item Filter */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Menu Item
                </label>
                <Select
                  value={filters.menu_item}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, menu_item: value }))}
                  onOpenChange={setIsMenuItemDropdownOpen}
                >
                  <SelectTrigger className={`w-full ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItemsOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Served By Filter */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Served By
                </label>
                <Select
                  value={filters.served_by}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, served_by: value }))}
                  onOpenChange={setIsEmployeeDropdownOpen}
                >
                  <SelectTrigger className={`w-full ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employeesOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Filter */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Search
                </label>
                <Input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className={theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : ''}
                />
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Active filters:
                </span>
                {filters.status !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Status: {statusOptions.find(opt => opt.value === filters.status)?.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters(prev => ({ ...prev, status: "all" }))}
                    />
                  </Badge>
                )}
                {filters.payment_status !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Payment: {paymentStatusOptions.find(opt => opt.value === filters.payment_status)?.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters(prev => ({ ...prev, payment_status: "all" }))}
                    />
                  </Badge>
                )}
                {filters.payment_method !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Method: {paymentMethodOptions.find(opt => opt.value === filters.payment_method)?.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters(prev => ({ ...prev, payment_method: "all" }))}
                    />
                  </Badge>
                )}
                {filters.dining_table !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Table: {tablesOptions.find(opt => opt.value === filters.dining_table)?.label || filters.dining_table}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters(prev => ({ ...prev, dining_table: "all" }))}
                    />
                  </Badge>
                )}

                {filters.menu_item !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Item: {menuItemsOptions.find(opt => opt.value === filters.menu_item)?.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters(prev => ({ ...prev, menu_item: "all" }))}
                    />
                  </Badge>
                )}
                {filters.served_by !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Staff: {employeesOptions.find(opt => opt.value === filters.served_by)?.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters(prev => ({ ...prev, served_by: "all" }))}
                    />
                  </Badge>
                )}
                {filters.search && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: "{filters.search}"
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters(prev => ({ ...prev, search: "" }))}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {(!kotData || kotData.length === 0) ? (
          <div className="text-center py-16">
            <Printer className={`h-16 w-16 mx-auto mb-4 opacity-50 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
            <h2 className={`text-xl font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              No Orders Available
            </h2>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              There are currently no orders waiting for kitchen preparation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {kotData.map((order) => (
              <div
                key={order.id}
                className={`border-2 border-dashed rounded-lg p-4 shadow-sm print:shadow-none print:border print:border-gray-400 ${
                  theme === 'dark'
                    ? 'bg-gray-900 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {/* Ticket Header */}
                <div className={`border-b-2 border-dashed pb-3 mb-4 ${
                  theme === 'dark' ? 'border-gray-600' : 'border-gray-400'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`font-bold text-lg ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      #{order.orderNumber}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'ready' ? 'bg-green-100 text-green-800' :
                      theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <div className={`text-xs space-y-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <div className="flex justify-between">
                      <span>Table:</span>
                      <span className="font-medium">{getTableNumber(order)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-medium">{new Date(order.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className={`pb-3 last:pb-0 ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                    } ${order.orderItems.length > 1 ? 'border-b' : ''} last:border-b-0`}>
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1">
                          <div className={`font-medium text-sm ${
                            theme === 'dark' ? 'text-white' : 'text-gray-800'
                          }`}>
                            {getItemName(item)}
                          </div>
                        </div>
                        <div className={`text-xs ml-2 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Qty: {item.quantity}
                        </div>
                      </div>

                      <div className={`text-xs space-y-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span className="font-medium">{item.servingSize}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span className="font-medium">{item.dietaryType} | {item.spiceLevel}</span>
                        </div>
                        {(item.note || item.special_instructions) && (
                          <div className={`mt-2 p-2 border rounded ${
                            theme === 'dark'
                              ? 'bg-green-900/20 border-green-800 text-green-300'
                              : 'bg-green-50 border-green-200'
                          }`}>
                            <div className={`text-xs font-medium mb-1 ${
                              theme === 'dark' ? 'text-green-300' : 'text-green-800'
                            }`}>
                              Special Instructions:
                            </div>
                            <div className={`text-xs ${
                              theme === 'dark' ? 'text-green-200' : 'text-green-700'
                            }`}>
                              {item.note || item.special_instructions}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ticket Footer */}
                <div className={`border-t-2 border-dashed pt-3 ${
                  theme === 'dark' ? 'border-gray-600' : 'border-gray-400'
                }`}>
                  <div className="text-center">
                    <div className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      KOT #{order.id} - {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <div className={`text-xs mt-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Total Items: {order.orderItems.length}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KOTPage;