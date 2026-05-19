"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { Order } from "../../types/api";
import { ordersApi } from "../../services/orders";
import { useOrdersStore } from "../../stores/ordersStore";
import { useDiningTables } from "../../pages/Setup/Pages/Tables/Store/TablesStore";
import { Loader2, Search, Calendar, User, DollarSign, Users, UserPlus } from "lucide-react";
import { ListPagination } from "../common/ListPagination";

interface OrderListProps {
  onOrderSelect: (order: Order) => void;
  refreshTrigger?: number; // Add this to trigger refresh
}

interface OrderMetadata {
  totalCount: number;
  currentCount: number;
  totalPages: number;
  currentPage: number;
  next: string | null;
  previous: string | null;
}

const hasDisplayText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const getDiningTableLabel = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (typeof value === "number" && value > 0) {
    return value.toString();
  }

  if (typeof value === "object" && value !== null) {
    const table = value as { name?: unknown; tableNumber?: unknown };
    if (hasDisplayText(table.name)) {
      return table.name;
    }
    if (hasDisplayText(table.tableNumber)) {
      return table.tableNumber;
    }
    if (typeof table.tableNumber === "number" && table.tableNumber > 0) {
      return table.tableNumber.toString();
    }
  }

  return null;
};

export function OrderList({ onOrderSelect, refreshTrigger }: OrderListProps) {
  const { orders, selectedOrder, isLoading, setOrders, setLoading, setError, clearError } = useOrdersStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [servedByFilter, setServedByFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [tableFilter, setTableFilter] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [metadata, setMetadata] = useState<OrderMetadata | null>(null);

  // Fetch dining tables for filter dropdown
  const { data: tablesData, isLoading: tablesLoading, error: tablesError } = useDiningTables(true);

  // Fetch orders from API
  const fetchOrders = useCallback(async (page: number = 1) => {
    console.log("OrderList: fetchOrders called with page:", page);
    try {
      setLoading(true);
      clearError();

      console.log("OrderList: Making API call to getOrders");
      const response = await ordersApi.getOrders({
        page,
        page_size: 50,
        search: searchTerm || undefined,
        status: statusFilter,
        served_by: servedByFilter,
        customer: customerFilter,
        dining_table: tableFilter,
        payment_method: paymentMethodFilter,
        payment_status: paymentStatusFilter,
        created_at: dateFilter,
      });

      console.log("OrderList: API response received:", response);
      if (response.success) {
        console.log("OrderList: Setting orders data:", response.data);
        setOrders(response.data);
        setMetadata({
          totalCount: response.totalCount,
          currentCount: response.currentCount,
          totalPages: response.totalPages,
          currentPage: response.currentPage,
          next: response.next,
          previous: response.previous,
        });
        setCurrentPage(response.currentPage);
      } else {
        console.log("OrderList: API returned error:", response.message);
        setError(response.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("OrderList: Error fetching orders:", error);
      setError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, servedByFilter, customerFilter, tableFilter, paymentMethodFilter, paymentStatusFilter, dateFilter, setOrders, setLoading, clearError, setError]);

  useEffect(() => {
    console.log("OrderList: useEffect triggered");
    fetchOrders(1);
  }, [fetchOrders]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("OrderList: refreshTrigger changed", refreshTrigger);
      fetchOrders(1);
      setCurrentPage(1);
    }
  }, [refreshTrigger, fetchOrders]);

  const handleSearch = () => {
    fetchOrders(1);
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    fetchOrders(1);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (metadata?.next) {
      fetchOrders(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (metadata?.previous) {
      fetchOrders(currentPage - 1);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!order || typeof order !== 'object') return false;

    const searchLower = (searchTerm || '').toLowerCase();
    const orderNumber = (order.orderNumber || '').toLowerCase();
    const customerName = (order.customer?.fullName || '').toLowerCase();

    const orderNumberMatch = orderNumber.includes(searchLower);
    const customerNameMatch = customerName.includes(searchLower);
    const matchesSearch = searchLower === '' || orderNumberMatch || customerNameMatch;

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-orange-100 text-orange-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "served":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Not set';
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  console.log("OrderList rendering content", { orders, isLoading, filteredOrders: filteredOrders.length });

  return (
    <Card className="h-full overflow-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Orders</CardTitle>
        <div className="space-y-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-8"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); handleFilterChange(); }}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="served">Served</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Served by..."
              value={servedByFilter}
              onChange={(e) => { setServedByFilter(e.target.value); handleFilterChange(); }}
            />

            <Input
              placeholder="Customer..."
              value={customerFilter}
              onChange={(e) => { setCustomerFilter(e.target.value); handleFilterChange(); }}
            />

            <Select value={tableFilter} onValueChange={(value) => { setTableFilter(value === "all" ? "" : value); handleFilterChange(); }}>
              <SelectTrigger>
                <SelectValue placeholder="All Tables" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <div
                  className="h-[160px] overflow-y-auto overscroll-contain"
                  onWheel={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onTouchMove={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onScroll={(e) => {
                    e.stopPropagation();
                  }}
                >
                <SelectItem value="all">All Tables</SelectItem>
                {tablesLoading ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading tables...</div>
                ) : tablesError ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Error loading tables</div>
                ) : tablesData?.data?.length ? (
                  tablesData.data.map((table) => (
                    <SelectItem key={table.id} value={table.id.toString()}>
                      Table {table.tableNumber}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No tables available</div>
                )}
                </div>
              </SelectContent>
            </Select>

              <Select value={paymentMethodFilter} onValueChange={(value) => { setPaymentMethodFilter(value); handleFilterChange(); }}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentStatusFilter} onValueChange={(value) => { setPaymentStatusFilter(value); handleFilterChange(); }}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); handleFilterChange(); }}
                className="pl-3 pr-10 min-w-[140px] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => { setDateFilter(""); handleFilterChange(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive z-20 w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
        {metadata && (
          <ListPagination
            currentCount={metadata.currentCount}
            currentPage={metadata.currentPage}
            isLoading={isLoading}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            totalCount={metadata.totalCount}
            totalPages={metadata.totalPages}
          />
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading orders...</span>
          </div>
        ) : (
          <div className="h-full">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No orders found
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedOrder?.id === order.id ? "bg-muted" : ""
                    }`}
                    onClick={() => onOrderSelect(order)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="font-medium text-sm">
                             #{order.orderNumber}
                           </span>
                           <Badge
                             variant="secondary"
                             className={`text-xs ${getStatusColor(order.status)}`}
                             title="Order Status"
                           >
                             {order.status}
                           </Badge>
                            {hasDisplayText(order.paymentMethod) && (
                              <Badge
                                variant="outline"
                                className="text-xs flex items-center gap-1 border-green-500 text-green-700"
                                title="Payment Method"
                              >
                                <DollarSign className="h-3 w-3" />
                                {order.paymentMethod}
                              </Badge>
                            )}
                            {hasDisplayText(order.servedBy) && (
                              <Badge
                                variant="outline"
                                className="text-xs flex items-center gap-1 border-blue-500 text-blue-700"
                                title="Served By"
                              >
                                <Users className="h-3 w-3" />
                                {order.servedBy}
                              </Badge>
                            )}
                            {hasDisplayText(order.createdBy) && (
                              <Badge
                                variant="outline"
                                className="text-xs flex items-center gap-1 border-purple-500 text-purple-700"
                                title="Created By"
                              >
                                <UserPlus className="h-3 w-3" />
                                {order.createdBy}
                              </Badge>
                            )}
                         </div>
                        {order.customer?.fullName && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <User className="h-3 w-3" />
                            <span>{order.customer.fullName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(order.confirmedAt || order.createdAt)}</span>
                        </div>
                        {(getDiningTableLabel(order.diningTable) || hasDisplayText(order.section)) && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {getDiningTableLabel(order.diningTable) && (
                              <span>Table: {getDiningTableLabel(order.diningTable)}</span>
                            )}
                            {hasDisplayText(order.section) && (
                              <span>Section: {order.section}</span>
                            )}
                          </div>
                        )}

                      </div>
                        <div className="text-right">
                          {order.subtotal && Number(order.subtotal) > 0 && (
                            <div className="font-medium text-sm">
                              ${Number(order.subtotal).toFixed(2)}
                            </div>
                          )}
                           {Number(order.totalItems) > 0 && (
                             <div className="text-xs text-muted-foreground">
                               {order.totalItems} items
                             </div>
                           )}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
