"use client";

import { useState, useEffect } from "react";
import { OrderList } from "../../components/orders/OrderList";
import { OrderDetails } from "../../components/orders/OrderDetails";
import { OrderForm } from "../../components/orders/OrderForm";
import type { Order } from "../../types/api";
import { useOrdersStore } from "../../stores/ordersStore";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { AlertCircle, Lock } from "lucide-react";
import useAuthenticationStore from "../Authentication/Store/authenticationStore";

export default function OrdersPage() {
  const { error, clearError } = useOrdersStore();
  const [selectedOrder, setSelectedOrderState] = useState<Order | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { isAuthenticated } = useAuthenticationStore();

  const handleOrderSelect = (order: Order) => {
    setSelectedOrderState(order);
  };

  const handleOrderCreateSuccess = (_newOrder: Order) => {
    setRefreshTrigger(prev => prev + 1);
    setSelectedOrderState(null);
  };



  useEffect(() => {
    clearError();
  }, []);

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">
            You need to be logged in to access the orders management system.
          </p>
          <p className="text-sm text-gray-500">
            Please log in to view and manage orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground">
            View and manage restaurant orders
          </p>
        </div>
        <OrderForm onSuccess={handleOrderCreateSuccess} />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)] overflow-hidden">
        {/* Left side - Order List */}
        <div className="h-full overflow-y-auto">
          <OrderList onOrderSelect={handleOrderSelect} refreshTrigger={refreshTrigger} />
        </div>

        {/* Right side - Order Details */}
        <div className="h-full overflow-y-auto">
          <OrderDetails order={selectedOrder} />
        </div>
      </div>
    </div>
  );
}