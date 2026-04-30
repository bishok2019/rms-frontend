"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Separator } from "../../components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Search, Settings, Plus, Minus, Receipt, X } from "lucide-react";
import type { MenuItem, PaginatedApiResponse } from "../../types/api";
import useAuthenticationStore from "../../pages/Authentication/Store/authenticationStore";
import { Lock } from "lucide-react";
import { privateApiInstance } from "../../Utils/ky";
import { toast } from "sonner";

interface CartItem extends MenuItem {
  quantity: number;
  selectedVariant?: CustomizationData; // For customization data
}

type OrderType = "dine_in" | "delivery" | "pickup";

interface CustomizationData {
  size: string;
  quantity: number;
  specialRequests: string;
  addOns?: string[];
}

// Custom Hook: useDebounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Custom Hook: useMenuItemsSearch
function useMenuItemsSearch(searchTerm: string, category: string) {
  return useQuery({
    queryKey: ["menu-items-search", searchTerm, category],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (category && category !== "all") params.append("category", category);

      const response = await privateApiInstance
        .get(`core-app/menu/items/list?${params.toString()}`, { signal })
        .json<PaginatedApiResponse<MenuItem>>();

      return response;
    },
    enabled: true,
  });
}

// MenuGrid Component
function MenuGrid({ onItemClick }: { onItemClick: (item: MenuItem) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // API query with debounced search
  const { data: menuData, isLoading, error } = useMenuItemsSearch(debouncedSearchTerm, selectedCategory);

  // Get unique categories
  const categories = useMemo(() => {
    if (!menuData?.data) return [];
    const cats = menuData.data
      .map(item => typeof item.category === 'object' ? item.category.name : String(item.category))
      .filter((cat, index, arr) => arr.indexOf(cat) === index);
    return cats;
  }, [menuData]);

  const filteredItems = menuData?.data || [];

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-card border-b">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading menu items...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-card border-b">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
          <div className="text-center text-destructive">
            <p>Error loading menu items. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header with Search and Filter */}
      <div className="p-4 bg-card border-b">
        <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3.5">
          {filteredItems.map((item: MenuItem) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer h-[240px] relative" onClick={() => onItemClick(item)}>
                <CardContent className="p-4 h-full flex flex-col">
                  <div className="h-24 bg-muted rounded-lg mb-1 flex items-center justify-center relative">
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                     ) : (
                       <div className="text-muted-foreground text-sm">No Image</div>
                     )}
                    {/* Status Indicator - Top Left */}
                    <div className="absolute top-1 left-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.category && typeof item.category === 'object' ? item.category.name : 'Item'}
                      </Badge>
                    </div>
                     {/* Customization Icon - Bottom Right */}
                     {item.isVariant && (
                       <div className="absolute bottom-1 right-1 bg-card rounded-full p-1 shadow cursor-pointer" onClick={(e) => { e.stopPropagation(); onItemClick(item); }}>
                         <Settings className="h-3 w-3 text-muted-foreground" />
                       </div>
                     )}
                  </div>
                  <div className="flex-1 space-y-1 flex flex-col pb-12">
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{item.description}</p>
                  </div>
                  {/* Price positioned at bottom of card */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span className="font-bold text-lg text-red-600">{item.price}</span>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(item);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {debouncedSearchTerm || selectedCategory !== "all" ? "No results found" : "No items available"}
          </div>
        )}
      </div>
    </div>
  );
}

// CustomizeModal Component
function CustomizeModal({
  isOpen,
  onClose,
  item,
  customizationData,
  setCustomizationData,
  onAddToOrder
}: {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  customizationData: CustomizationData;
  setCustomizationData: (data: CustomizationData) => void;
  onAddToOrder: (item: MenuItem, data: CustomizationData) => void;
}) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Customize {item.name}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-gray-200 hover:text-red-600 transition-all duration-200 hover:scale-110"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Size Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Size</label>
            <Select
              value={customizationData.size}
              onValueChange={(value) => setCustomizationData({ ...customizationData, size: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Small">Small</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add-ons (placeholder for future expansion) */}
          <div>
            <label className="block text-sm font-medium mb-2">Add-ons</label>
            <p className="text-xs text-muted-foreground">Add-ons feature coming soon</p>
          </div>

          {/* Quantity Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCustomizationData({
                  ...customizationData,
                  quantity: Math.max(1, customizationData.quantity - 1)
                })}
                disabled={customizationData.quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[2rem] text-center">
                {customizationData.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCustomizationData({
                  ...customizationData,
                  quantity: customizationData.quantity + 1
                })}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium mb-2">Cooking Remarks (KOT)</label>
            <Textarea
              placeholder="Any special cooking instructions..."
              value={customizationData.specialRequests}
              onChange={(e) => setCustomizationData({
                ...customizationData,
                specialRequests: e.target.value
              })}
              rows={3}
            />
          </div>

          {/* Add to Order Button */}
          <Button
            onClick={() => {
              onAddToOrder(item, customizationData);
              onClose();
            }}
            className="w-full"
          >
            Add to Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main POS Page Component
function Sidebar({
  cart,
  orderType,
  setOrderType,
  selectedTable,
  setSelectedTable,
  onUpdateQuantity,
  onConfirmOrder,
  isCreatingOrder
}: {
  cart: CartItem[];
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  selectedTable: string;
  setSelectedTable: (table: string) => void;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onConfirmOrder: () => void;
  isCreatingOrder: boolean;
}) {
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="w-96 bg-card border-l flex flex-col">
      {/* Order Type Selection */}
      <div className="p-4 border-b">
        <h2 className="font-semibold mb-3">Order Type</h2>
        <div className="flex gap-2">
          {[
            { value: "dine_in", label: "Dine In" },
            { value: "delivery", label: "Delivery" },
            { value: "pickup", label: "Pickup" },
          ].map((type) => (
            <Button
              key={type.value}
              variant={orderType === type.value ? "default" : "outline"}
              size="sm"
              onClick={() => setOrderType(type.value as OrderType)}
              className="flex-1"
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table Assignment */}
      {orderType === "dine_in" && (
        <div className="p-4 border-b">
          <label className="block text-sm font-medium mb-2">Table Number</label>
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger>
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="T1">Table 1</SelectItem>
              <SelectItem value="T2">Table 2</SelectItem>
              <SelectItem value="T3">Table 3</SelectItem>
              <SelectItem value="T4">Table 4</SelectItem>
              <SelectItem value="T5">Table 5</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="font-semibold mb-3">Current Order</h3>
        {cart.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No items in cart</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">Rs {item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="h-6 w-6 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="p-4 border-t bg-muted">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Total QTY:</span>
            <span className="font-medium">{totalQuantity}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total Price:</span>
            <span className="text-red-600">Rs {cartTotal.toFixed(2)}</span>
          </div>
        </div>
        <Separator />
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1">
            Confirm & Print
          </Button>
          <Button
            className="flex-1"
            onClick={onConfirmOrder}
            disabled={isCreatingOrder}
          >
            {isCreatingOrder ? "Creating Order..." : "Confirm Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main POS Page Component
export default function POSPage() {
  const { isAuthenticated } = useAuthenticationStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [selectedTable, setSelectedTable] = useState<string>("");

  // Modal state
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [customizationData, setCustomizationData] = useState<CustomizationData>({
    size: "Medium",
    quantity: 1,
    specialRequests: "",
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Cart operations
  const addToCart = useCallback((item: MenuItem, customData?: CustomizationData) => {
    const quantity = customData?.quantity || 1;
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity, selectedVariant: customData }];
    });
  }, []);

  // Handle item click - determine if simple add or customize
  const handleItemClick = useCallback((item: MenuItem) => {
    if (item.isVariant || (item.discountPrice && item.discountPrice !== item.price)) {
      setCustomizingItem(item);
      setCustomizationData({
        size: "Medium",
        quantity: 1,
        specialRequests: "",
      });
      setIsCustomizeModalOpen(true);
    } else {
      addToCart(item);
    }
  }, [addToCart]);

  const updateQuantity = useCallback((itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== itemId));
    } else {
      setCart(prev => prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  }, []);

  const handleConfirmOrder = useCallback(async () => {
    if (cart.length === 0) {
      toast.error("No items in cart to confirm order");
      return;
    }

    if (orderType === "dine_in" && !selectedTable) {
      toast.error("Please select a table for dine-in orders");
      return;
    }

    setIsCreatingOrder(true);

    try {
      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Calculate subtotal
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Prepare order data
      const orderData = {
        orderNumber,
        status: "pending" as const,
        paymentMethod: null as null,
        paymentStatus: "pending" as const,
        subtotal: subtotal.toFixed(2),
        taxAmount: "0.00", // Default tax - could be calculated based on business rules
        discountAmount: "0.00", // Default discount - could be applied based on promotions
        deliveryCharge: orderType === "delivery" ? "5.00" : "0.00", // Default delivery charge
        customer: null as null, // No customer selected in POS
        diningTable: orderType === "dine_in" ? (selectedTable ? parseInt(selectedTable.replace('T', '')) : null) : null,
        servedBy: null as null, // Could be set to current user if available
      };

      // Create the order
      const orderResponse = await privateApiInstance
        .post("core-app/orders/create", {
          json: orderData,
        })
        .json<{ success: boolean; message: string; data: { id: number; orderNumber: string } }>();

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || "Failed to create order");
      }

      const createdOrder = orderResponse.data;

      // Create order items for each cart item
      for (const cartItem of cart) {
        const orderItemData = {
          order: createdOrder.id,
          orderItem: cartItem.id,
          quantity: cartItem.quantity,
          orderType: (orderType === "dine_in" ? "dine_in" :
                      orderType === "delivery" ? "delivery" : "takeaway") as "dine_in" | "delivery" | "takeaway",
          dietaryType: "veg" as const, // Default - could be determined from menu item
          spiceLevel: "none" as const, // Default - could be customized
          servingSize: cartItem.selectedVariant?.size || "Medium",
          status: "pending" as const,
          note: cartItem.selectedVariant?.specialRequests || null,
        };

        const itemResponse = await privateApiInstance
          .post("core-app/order_items/create", {
            json: orderItemData,
          })
          .json<{ success: boolean; message: string; data: { id: number } }>();

        if (!itemResponse.success) {
          console.error("Failed to create order item:", itemResponse.message);
          // Continue with other items, or handle error appropriately
        }
      }

      // Clear the cart after successful order creation
      setCart([]);
      setSelectedTable("");

      // Show success message
      toast.success(`Order ${orderNumber} created successfully!`);

      // TODO: Navigate to order details or receipt page
      console.log("Order created:", createdOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order. Please try again.");
    } finally {
      setIsCreatingOrder(false);
    }
  }, [cart, orderType, selectedTable]);

  if (!isAuthenticated) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">
            You need to be logged in to access the POS system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      <MenuGrid onItemClick={handleItemClick} />
      <Sidebar
        cart={cart}
        orderType={orderType}
        setOrderType={setOrderType}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
        onUpdateQuantity={updateQuantity}
        onConfirmOrder={handleConfirmOrder}
        isCreatingOrder={isCreatingOrder}
      />
      <CustomizeModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        item={customizingItem}
        customizationData={customizationData}
        setCustomizationData={setCustomizationData}
        onAddToOrder={addToCart}
      />
    </div>
  );
}