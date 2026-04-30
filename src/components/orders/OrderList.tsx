"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { Order } from "../../types/api";
import { ordersApi } from "../../services/orders";
import { useOrdersStore } from "../../stores/ordersStore";
import { Loader2, Search, Calendar, User } from "lucide-react";

interface OrderListProps {
  onOrderSelect: (order: Order) => void;
  refreshTrigger?: number; // Add this to trigger refresh
}

export function OrderList({ onOrderSelect, refreshTrigger }: OrderListProps) {
  const { orders, selectedOrder, isLoading, setOrders, setLoading, setError, clearError } = useOrdersStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    console.log("OrderList: fetchOrders called");
    try {
      setLoading(true);
      clearError();

      console.log("OrderList: Making API call to getOrders");
      const response = await ordersApi.getOrders({
        page_size: 50,
        search: searchTerm || undefined,
      });

      console.log("OrderList: API response received:", response);
      if (response.success) {
        console.log("OrderList: Setting orders data:", response.data);
        setOrders(response.data);
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
  }, [searchTerm, setOrders, setLoading, clearError, setError]);

  useEffect(() => {
    console.log("OrderList: useEffect triggered");
    fetchOrders();
  }, []); // Remove fetchOrders dependency to prevent loops

  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("OrderList: refreshTrigger changed", refreshTrigger);
      fetchOrders();
    }
  }, [refreshTrigger, fetchOrders]);

  const handleSearch = () => {
    fetchOrders();
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
        <div className="flex gap-2">
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
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
        </div>
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
                          >
                            {order.status}
                          </Badge>
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
                        {(order.diningTable || order.section) && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {order.diningTable && (
                              <span>Table: {typeof order.diningTable === "object" ? order.diningTable.name : order.diningTable}</span>
                            )}
                            {order.section && (
                              <span>Section: {order.section}</span>
                            )}
                          </div>
                        )}
                        {order.servedBy && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>Served by: {order.servedBy}</span>
                          </div>
                        )}
                      </div>
                       <div className="text-right">
                         <div className="font-medium text-sm">
                           ${(Number(order.subtotal) || 0).toFixed(2)}
                         </div>
                          <div className="text-xs text-muted-foreground">
                            {order.totalItems || 0} items
                          </div>
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