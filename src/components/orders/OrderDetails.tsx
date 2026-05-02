"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import type { Order, OrderItem } from "../../types/api";
import { ordersApi } from "../../services/orders";
import { User, Phone, MapPin, Receipt, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../ui/button";

interface OrderDetailsProps {
  order: Order | null;
  onEditItem?: (item: OrderItem) => void;
}

export function OrderDetails({ order, onEditItem }: OrderDetailsProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerDetailsCollapsed, setCustomerDetailsCollapsed] = useState(false);
  const customer = order && typeof order.customer === "object" ? order.customer : null;

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

  const getOrderItemLabel = (item: OrderItem) => {
    if (!item.orderItem) {
      return "Unnamed item";
    }

    return typeof item.orderItem === "object" ? item.orderItem.name : item.orderItem;
  };









  if (!order) {
    return (
      <Card className="">
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
          Order Details
        </h2>
      </div>

      {/* Customer Details */}
      <Card className="mb-2 min-h-[6rem]">
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Customer Details</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCustomerDetailsCollapsed(!customerDetailsCollapsed)}
              className="h-5 w-5 p-0"
            >
              {customerDetailsCollapsed ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardHeader>
        {!customerDetailsCollapsed && (
          <CardContent className="pt-0 pb-2 px-3">
            {customer ? (
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-1">
                  <Receipt className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Order:</span>
                  <span className="font-medium">#{order.orderNumber}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="font-medium">{customer.fullName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-2.5 w-2.5 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
                {customer.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-xs">{customer.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Points:</span>
                  <span className="font-medium">{customer.loyaltyPoints}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Walk-in customer</p>
            )}
          </CardContent>
        )}
      </Card>



      {/* Order Items */}
      <Card className="h-96 flex flex-col overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Order Items</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
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
              {order ? "No items found" : "Select an order to view items"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Spice</TableHead>
                  <TableHead>Note</TableHead>
                  {onEditItem && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getDietaryIcon(item.dietaryType)}</span>
                        <span className="font-medium">{getOrderItemLabel(item)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.servingSize || "-"}</TableCell>
                    <TableCell>{item.spiceLevel !== "none" ? item.spiceLevel : "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.note || "-"}</TableCell>
                    {onEditItem && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditItem(item)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
