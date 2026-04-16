"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { Order, OrderItem } from "../../types/api";
import { ordersApi } from "../../services/orders";
import { User, Phone, MapPin, Receipt } from "lucide-react";

interface OrderDetailsProps {
  order: Order | null;
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      fetchOrderItems(order.id);
    } else {
      setOrderItems([]);
      setError(null);
      setIsLoading(false);
    }
  }, [order]);

  const fetchOrderItems = async (orderId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await ordersApi.getOrderItems(orderId);

      if (response.success && response.data) {
        setOrderItems(response.data);
      } else {
        setError(response.message || "Failed to fetch order items");
      }
    } catch (error) {
      console.error("Error fetching order items:", error);
      setError("Failed to fetch order items");
    } finally {
      setIsLoading(false);
    }
  };

  const getDietaryIcon = (dietaryType: string) => {
    switch (dietaryType) {
      case "veg":
        return "🥬";
      case "non_veg":
        return "🍖";
      case "vegan":
        return "🌱";
      case "gluten_free":
        return "🌾";
      default:
        return "🍽️";
    }
  };







  if (!order) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select an order to view details</p>
            <p className="text-sm mt-2 text-gray-500">Debug: No order selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 h-full">
      {/* Order Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Order #{order.orderNumber}
        </h2>
      </div>

      {/* Customer Details */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {order.customer ? (
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{order.customer.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span>{order.customer.phone}</span>
              </div>
              {order.customer.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                  <span className="text-xs">{order.customer.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Points:</span>
                <span className="font-medium">{order.customer.loyaltyPoints}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Walk-in customer</p>
          )}
        </CardContent>
      </Card>



      {/* Order Items */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Order Items</CardTitle>
          <div className="text-sm text-muted-foreground">
            Order #{order.orderNumber}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading order items...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
            </div>
          ) : orderItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items found
            </div>
          ) : (
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <div className="text-2xl">
                    {getDietaryIcon(item.dietaryType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      <h4 className="font-medium text-sm">
                        {typeof item.orderItem === "object"
                          ? item.orderItem.name
                          : item.orderItem}
                      </h4>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span>Qty: {item.quantity}</span>
                      {item.servingSize && (
                        <span>Size: {item.servingSize}</span>
                      )}
                      {item.spiceLevel !== "none" && (
                        <span>Spice: {item.spiceLevel}</span>
                      )}
                    </div>

                    {item.note && (
                      <p className="text-xs text-muted-foreground italic">
                        Note: {item.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}