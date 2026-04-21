"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Check, ChevronDown, Edit, Loader2 } from "lucide-react";
import { privateApiInstance } from "../../Utils/ky";
import { cn } from "../../lib/utils";
import { ordersApi } from "../../services/orders";
import { useOrdersStore } from "../../stores/ordersStore";
import type {
  Customer,
  DietaryType,
  DiningTable,
  MenuItem,
  Order,
  OrderItem,
  OrderItemStatus,
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderStatus,
  OrderType,
} from "../../types/api";

interface OrderFormProps {
  editingOrder?: Order | null;
  editingItem?: OrderItem | null;
  onSuccess: (order: Order) => void;
  onCancel?: () => void;
}

interface EmployeeOption {
  id: number;
  user: string;
  position: string;
}

interface OrderFormState {
  orderNumber: string;
  deliveryAddress: string;
  status: OrderStatus;
  paymentMethod: Exclude<OrderPaymentMethod, null>;
  paymentStatus: OrderPaymentStatus;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  deliveryCharge: string;
  confirmedAt: string;
  completedAt: string;
  customer: string;
  diningTable: string;
  servedBy: string;
}

interface ItemFormState {
  orderType: OrderType;
  quantity: number;
  dietaryType: DietaryType;
  spiceLevel: OrderItem["spiceLevel"];
  servingSize: string;
  status: OrderItemStatus;
  preparedAt: string;
  readyAt: string;
  servedAt: string;
  note: string;
  order: string;
  orderItem: string;
}

type LookupField = "customer" | "diningTable" | "servedBy" | "order" | "orderItem";

interface SearchableOption {
  value: string;
  label: string;
  keywords?: string;
}

interface LazySearchSelectProps {
  emptyLabel: string;
  isLoading: boolean;
  isOpen: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (value: string) => void;
  onToggle: () => void;
  options: SearchableOption[];
  placeholder: string;
  searchPlaceholder: string;
  searchValue: string;
  selectedLabel: string;
  selectedValue?: string;
}

const NONE_OPTION_VALUE = "__none__";
const UNCHANGED_OPTION_VALUE = "__unchanged__";

const formatDateTimeLocal = (value: string | null | undefined) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";

const extractListData = <T,>(payload: unknown): T[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const response = payload as { data?: unknown; results?: unknown };

  if (Array.isArray(response.data)) {
    return response.data as T[];
  }

  if (Array.isArray(response.results)) {
    return response.results as T[];
  }

  return [];
};

function LazySearchSelect({
  emptyLabel,
  isLoading,
  isOpen,
  onSearchChange,
  onSelect,
  onToggle,
  options,
  placeholder,
  searchPlaceholder,
  searchValue,
  selectedLabel,
  selectedValue,
}: LazySearchSelectProps) {
  const filteredOptions = options.filter((option) => {
    const needle = searchValue.trim().toLowerCase();

    if (!needle) {
      return true;
    }

    return `${option.label} ${option.keywords || ""}`.toLowerCase().includes(needle);
  });

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between font-normal"
        onClick={onToggle}
      >
        <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-60" />
      </Button>

      {isOpen && (
        <div className="space-y-2 rounded-md border bg-background p-2">
          <Input
            autoFocus
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />

          <div className="max-h-52 space-y-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading options...
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => onSelect(option.value)}
                >
                  <span className="truncate">{option.label}</span>
                  {selectedValue === option.value && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))
            ) : (
              <div className="px-2 py-3 text-sm text-muted-foreground">{emptyLabel}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderForm({ editingOrder, editingItem, onSuccess }: OrderFormProps) {
  const isEditingOrder = !!editingOrder;
  const isEditingItem = !!editingItem;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { setError } = useOrdersStore();
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [diningTableOptions, setDiningTableOptions] = useState<DiningTable[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [orderOptions, setOrderOptions] = useState<Order[]>([]);
  const [menuItemOptions, setMenuItemOptions] = useState<MenuItem[]>([]);
  const [openLookup, setOpenLookup] = useState<LookupField | null>(null);
  const [lookupSearch, setLookupSearch] = useState<Record<LookupField, string>>({
    customer: "",
    diningTable: "",
    servedBy: "",
    order: "",
    orderItem: "",
  });
  const [lookupLoading, setLookupLoading] = useState<Record<LookupField, boolean>>({
    customer: false,
    diningTable: false,
    servedBy: false,
    order: false,
    orderItem: false,
  });
  const [lookupLoaded, setLookupLoaded] = useState<Record<LookupField, boolean>>({
    customer: false,
    diningTable: false,
    servedBy: false,
    order: false,
    orderItem: false,
  });

  const getCustomerValue = (order?: Order | null) => {
    if (!order?.customer) {
      return "";
    }

    if (typeof order.customer === "number") {
      return order.customer.toString();
    }

    return order.customer.id.toString();
  };

  const getDiningTableValue = (order?: Order | null) => {
    if (!order?.diningTable) {
      return "";
    }

    if (typeof order.diningTable === "number") {
      return order.diningTable.toString();
    }

    const matchedTable = diningTableOptions.find((table) => table.tableNumber === order.diningTable);
    return matchedTable ? matchedTable.id.toString() : "";
  };

  const getServedByValue = (order?: Order | null) => {
    if (!order?.servedBy) {
      return "";
    }

    if (typeof order.servedBy === "number") {
      return order.servedBy.toString();
    }

    const matchedEmployee = employeeOptions.find((employee) => employee.user === order.servedBy);
    return matchedEmployee ? matchedEmployee.id.toString() : "";
  };

  const getOrderItemValue = (item?: OrderItem | null) => {
    if (!item?.orderItem) {
      return "";
    }

    if (typeof item.orderItem === "number") {
      return item.orderItem.toString();
    }

    if (typeof item.orderItem === "object") {
      return item.orderItem.id.toString();
    }

    const matchedMenuItem = menuItemOptions.find((menuItem) => menuItem.name === item.orderItem);
    return matchedMenuItem ? matchedMenuItem.id.toString() : "";
  };

  const getOrderFormData = (order?: Order | null): OrderFormState => ({
    orderNumber: order?.orderNumber || "",
    deliveryAddress: order?.deliveryAddress || "",
    status: order?.status || "pending",
    paymentMethod: order?.paymentMethod || "",
    paymentStatus: order?.paymentStatus || "pending",
    subtotal: order?.subtotal?.toString() || "0.00",
    taxAmount: order?.taxAmount?.toString() || "0.00",
    discountAmount: order?.discountAmount?.toString() || "0.00",
    deliveryCharge: order?.deliveryCharge?.toString() || "0.00",
    confirmedAt: formatDateTimeLocal(order?.confirmedAt),
    completedAt: formatDateTimeLocal(order?.completedAt),
    customer: getCustomerValue(order),
    diningTable: getDiningTableValue(order),
    servedBy: getServedByValue(order),
  });

  const getItemFormData = (item?: OrderItem | null): ItemFormState => ({
    orderType: item?.orderType || "dine_in",
    quantity: item?.quantity || 1,
    dietaryType: item?.dietaryType || "veg",
    spiceLevel: item?.spiceLevel || "none",
    servingSize: item?.servingSize || "",
    status: item?.status || "pending",
    preparedAt: formatDateTimeLocal(item?.preparedAt),
    readyAt: formatDateTimeLocal(item?.readyAt),
    servedAt: formatDateTimeLocal(item?.servedAt),
    note: item?.note || "",
    order: item?.order ? item.order.toString() : "",
    orderItem: getOrderItemValue(item),
  });

  // Form data for order editing
  const [orderFormData, setOrderFormData] = useState<OrderFormState>(getOrderFormData(editingOrder));

  // Form data for item editing
  const [itemFormData, setItemFormData] = useState<ItemFormState>(getItemFormData(editingItem));

  // Update form data and open dialog when editing props change
  useEffect(() => {
    if (editingOrder) {
      setOrderFormData(getOrderFormData(editingOrder));
      setIsDialogOpen(true);
    }
  }, [editingOrder]);

  // Close dialog when editing props are cleared
  useEffect(() => {
    if (!editingOrder && !editingItem) {
      setIsDialogOpen(false);
    }
  }, [editingOrder, editingItem]);

  useEffect(() => {
    if (editingItem) {
      setItemFormData(getItemFormData(editingItem));
      setIsDialogOpen(true);
    }
  }, [editingItem]);

  useEffect(() => {
    if (!isDialogOpen) {
      setOpenLookup(null);
    }
  }, [isDialogOpen]);

  const setLookupLoadingState = (field: LookupField, isLoading: boolean) => {
    setLookupLoading((previous) => ({ ...previous, [field]: isLoading }));
  };

  const setLookupLoadedState = (field: LookupField) => {
    setLookupLoaded((previous) => ({ ...previous, [field]: true }));
  };

  const loadCustomers = async () => {
    if (lookupLoaded.customer || lookupLoading.customer) {
      return;
    }

    try {
      setLookupLoadingState("customer", true);
      const response = await privateApiInstance.get("customer-app/customer/list").json<unknown>();
      setCustomerOptions(extractListData<Customer>(response));
      setLookupLoadedState("customer");
    } catch (error) {
      console.error("Failed to load customers:", error);
      setError("Failed to load customers");
    } finally {
      setLookupLoadingState("customer", false);
    }
  };

  const loadDiningTables = async () => {
    if (lookupLoaded.diningTable || lookupLoading.diningTable) {
      return;
    }

    try {
      setLookupLoadingState("diningTable", true);
      const response = await privateApiInstance.get("core-app/dining_table/list").json<unknown>();
      const tables = extractListData<DiningTable>(response);
      setDiningTableOptions(tables);
      setLookupLoadedState("diningTable");

      setOrderFormData((previous) => {
        if (previous.diningTable || typeof editingOrder?.diningTable !== "string") {
          return previous;
        }

        const matched = tables.find((table) => table.tableNumber === editingOrder.diningTable);
        return matched ? { ...previous, diningTable: matched.id.toString() } : previous;
      });
    } catch (error) {
      console.error("Failed to load dining tables:", error);
      setError("Failed to load dining tables");
    } finally {
      setLookupLoadingState("diningTable", false);
    }
  };

  const loadEmployees = async () => {
    if (lookupLoaded.servedBy || lookupLoading.servedBy) {
      return;
    }

    try {
      setLookupLoadingState("servedBy", true);
      const response = await privateApiInstance.get("core-app/employee/list").json<unknown>();
      const employees = extractListData<EmployeeOption>(response);
      setEmployeeOptions(employees);
      setLookupLoadedState("servedBy");

      setOrderFormData((previous) => {
        if (previous.servedBy || typeof editingOrder?.servedBy !== "string") {
          return previous;
        }

        const matched = employees.find((employee) => employee.user === editingOrder.servedBy);
        return matched ? { ...previous, servedBy: matched.id.toString() } : previous;
      });
    } catch (error) {
      console.error("Failed to load employees:", error);
      setError("Failed to load employees");
    } finally {
      setLookupLoadingState("servedBy", false);
    }
  };

  const loadOrders = async () => {
    if (lookupLoaded.order || lookupLoading.order) {
      return;
    }

    try {
      setLookupLoadingState("order", true);
      const response = await ordersApi.getOrders({ page_size: 100 });
      setOrderOptions(response.data || []);
      setLookupLoadedState("order");
    } catch (error) {
      console.error("Failed to load orders:", error);
      setError("Failed to load orders");
    } finally {
      setLookupLoadingState("order", false);
    }
  };

  const loadMenuItems = async () => {
    if (lookupLoaded.orderItem || lookupLoading.orderItem) {
      return;
    }

    try {
      setLookupLoadingState("orderItem", true);
      const response = await privateApiInstance.get("core-app/menu/items/list").json<unknown>();
      const menuItems = extractListData<MenuItem>(response);
      setMenuItemOptions(menuItems);
      setLookupLoadedState("orderItem");

      setItemFormData((previous) => {
        if (previous.orderItem || typeof editingItem?.orderItem !== "string") {
          return previous;
        }

        const matched = menuItems.find((menuItem) => menuItem.name === editingItem.orderItem);
        return matched ? { ...previous, orderItem: matched.id.toString() } : previous;
      });
    } catch (error) {
      console.error("Failed to load menu items:", error);
      setError("Failed to load menu items");
    } finally {
      setLookupLoadingState("orderItem", false);
    }
  };

  const ensureLookupLoaded = async (field: LookupField) => {
    switch (field) {
      case "customer":
        await loadCustomers();
        break;
      case "diningTable":
        await loadDiningTables();
        break;
      case "servedBy":
        await loadEmployees();
        break;
      case "order":
        await loadOrders();
        break;
      case "orderItem":
        await loadMenuItems();
        break;
    }
  };

  const toggleLookup = (field: LookupField) => {
    if (openLookup === field) {
      setOpenLookup(null);
      return;
    }

    setOpenLookup(field);
    setLookupSearch((previous) => ({ ...previous, [field]: "" }));
    void ensureLookupLoaded(field);
  };

  const customerLookupOptions: SearchableOption[] = [
    { value: NONE_OPTION_VALUE, label: "None" },
    ...customerOptions.map((customer) => ({
      value: customer.id.toString(),
      label: `${customer.fullName} (${customer.phone})`,
      keywords: `${customer.fullName} ${customer.phone} ${customer.address || ""}`,
    })),
  ];

  const diningTableLookupOptions: SearchableOption[] = [
    { value: NONE_OPTION_VALUE, label: "None" },
    ...diningTableOptions.map((table) => ({
      value: table.id.toString(),
      label: `Table ${table.tableNumber}`,
      keywords: `${table.tableNumber}`,
    })),
  ];

  const employeeLookupOptions: SearchableOption[] = [
    { value: NONE_OPTION_VALUE, label: "None" },
    ...employeeOptions.map((employee) => ({
      value: employee.id.toString(),
      label: employee.position ? `${employee.user} (${employee.position})` : employee.user,
      keywords: `${employee.user} ${employee.position || ""}`,
    })),
  ];

  const orderLookupOptions: SearchableOption[] = orderOptions.map((order) => ({
    value: order.id.toString(),
    label: `#${order.orderNumber}`,
    keywords: `${order.orderNumber} ${typeof order.customer === "object" ? order.customer?.fullName || "" : ""}`,
  }));

  const orderItemLookupOptions: SearchableOption[] = [
    { value: UNCHANGED_OPTION_VALUE, label: "Keep current item" },
    ...menuItemOptions.map((menuItem) => ({
      value: menuItem.id.toString(),
      label: menuItem.name,
      keywords: `${menuItem.name} ${menuItem.description || ""}`,
    })),
  ];

  const getSelectedOptionLabel = (options: SearchableOption[], value: string) =>
    options.find((option) => option.value === value)?.label || "";

  const customerSelectedLabel =
    orderFormData.customer === NONE_OPTION_VALUE
      ? "None"
      : getSelectedOptionLabel(customerLookupOptions, orderFormData.customer) ||
        (editingOrder?.customer && typeof editingOrder.customer === "object"
          ? `${editingOrder.customer.fullName} (${editingOrder.customer.phone})`
          : "");

  const diningTableSelectedLabel =
    orderFormData.diningTable === NONE_OPTION_VALUE
      ? "None"
      : getSelectedOptionLabel(diningTableLookupOptions, orderFormData.diningTable) ||
        (typeof editingOrder?.diningTable === "string" ? `Table ${editingOrder.diningTable}` : "");

  const servedBySelectedLabel =
    orderFormData.servedBy === NONE_OPTION_VALUE
      ? "None"
      : getSelectedOptionLabel(employeeLookupOptions, orderFormData.servedBy) ||
        (typeof editingOrder?.servedBy === "string" ? editingOrder.servedBy : "");

  const orderSelectedLabel =
    getSelectedOptionLabel(orderLookupOptions, itemFormData.order) ||
    (editingItem?.order ? `#${editingItem.order}` : "");

  const orderItemSelectedLabel =
    itemFormData.orderItem === UNCHANGED_OPTION_VALUE
      ? typeof editingItem?.orderItem === "string"
        ? editingItem.orderItem
        : "Keep current item"
      : getSelectedOptionLabel(orderItemLookupOptions, itemFormData.orderItem) ||
        (typeof editingItem?.orderItem === "string" ? editingItem.orderItem : "");

  const handleOrderSubmit = async () => {
    if (!editingOrder) return;

    try {
      const updateData: Record<string, unknown> = {
        orderNumber: orderFormData.orderNumber,
        deliveryAddress: orderFormData.deliveryAddress,
        status: orderFormData.status,
        paymentMethod: orderFormData.paymentMethod || null,
        paymentStatus: orderFormData.paymentStatus,
        subtotal: orderFormData.subtotal,
        taxAmount: orderFormData.taxAmount,
        discountAmount: orderFormData.discountAmount,
        deliveryCharge: orderFormData.deliveryCharge,
      };

      if (orderFormData.customer === NONE_OPTION_VALUE) {
        updateData.customer = null;
      } else if (orderFormData.customer.trim()) {
        updateData.customer = parseInt(orderFormData.customer.trim(), 10);
      } else if (!editingOrder.customer) {
        updateData.customer = null;
      }

      if (orderFormData.diningTable === NONE_OPTION_VALUE) {
        updateData.diningTable = null;
      } else if (orderFormData.diningTable.trim()) {
        updateData.diningTable = parseInt(orderFormData.diningTable.trim(), 10);
      } else if (!editingOrder.diningTable) {
        updateData.diningTable = null;
      }

      if (orderFormData.servedBy === NONE_OPTION_VALUE) {
        updateData.servedBy = null;
      } else if (orderFormData.servedBy.trim()) {
        updateData.servedBy = parseInt(orderFormData.servedBy.trim(), 10);
      } else if (!editingOrder.servedBy) {
        updateData.servedBy = null;
      }

      // Only include date fields if they have values
      if (orderFormData.confirmedAt) updateData.confirmedAt = orderFormData.confirmedAt;
      if (orderFormData.completedAt) updateData.completedAt = orderFormData.completedAt;

      const response = await ordersApi.updateOrder(editingOrder.id, updateData);

      if (response.success) {
        onSuccess(response.data);
        setIsDialogOpen(false);
      } else {
        setError(response.message || "Failed to update order");
      }
    } catch {
      setError("Failed to update order");
    }
  };

  const handleItemSubmit = async () => {
    if (!editingItem) return;

    try {
      const updateData: Record<string, unknown> = {
        orderType: itemFormData.orderType,
        quantity: itemFormData.quantity,
        dietaryType: itemFormData.dietaryType,
        spiceLevel: itemFormData.spiceLevel,
        servingSize: itemFormData.servingSize,
        status: itemFormData.status,
        note: itemFormData.note || null,
        order: parseInt(itemFormData.order, 10),
      };

      if (itemFormData.orderItem && itemFormData.orderItem !== UNCHANGED_OPTION_VALUE) {
        updateData.orderItem = parseInt(itemFormData.orderItem, 10);
      }

      // Only include date fields if they have values
      if (itemFormData.preparedAt) updateData.preparedAt = itemFormData.preparedAt;
      if (itemFormData.readyAt) updateData.readyAt = itemFormData.readyAt;
      if (itemFormData.servedAt) updateData.servedAt = itemFormData.servedAt;

      const response = await ordersApi.updateOrderItem(editingItem.id, updateData);

      if (response.success) {
        onSuccess({} as Order); // Refresh the list
        setIsDialogOpen(false);
      } else {
        setError(response.message || "Failed to update order item");
      }
    } catch {
      setError("Failed to update order item");
    }
  };


    if (isEditingOrder) {
      return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Order #{editingOrder.orderNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="orderNumber">Order Number</Label>
                <Input
                  id="orderNumber"
                  value={orderFormData.orderNumber}
                  onChange={(e) => setOrderFormData({ ...orderFormData, orderNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={orderFormData.status} onValueChange={(value) => setOrderFormData({ ...orderFormData, status: value as OrderStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
              <div>
                <Label htmlFor="deliveryAddress">Delivery Address</Label>
                <Textarea
                  id="deliveryAddress"
                  value={orderFormData.deliveryAddress}
                  onChange={(e) => setOrderFormData({ ...orderFormData, deliveryAddress: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={orderFormData.paymentMethod || NONE_OPTION_VALUE}
                  onValueChange={(value) =>
                    setOrderFormData({
                      ...orderFormData,
                      paymentMethod: value === NONE_OPTION_VALUE ? "" : (value as Exclude<OrderPaymentMethod, null>),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_OPTION_VALUE}>None</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="wallet">Digital Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select
                  value={orderFormData.paymentStatus}
                  onValueChange={(value) => setOrderFormData({ ...orderFormData, paymentStatus: value as OrderPaymentStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subtotal">Subtotal</Label>
                <Input
                  id="subtotal"
                  type="text"
                  value={orderFormData.subtotal}
                  onChange={(e) => setOrderFormData({ ...orderFormData, subtotal: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="taxAmount">Tax Amount</Label>
                <Input
                  id="taxAmount"
                  type="text"
                  value={orderFormData.taxAmount}
                  onChange={(e) => setOrderFormData({ ...orderFormData, taxAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="discountAmount">Discount Amount</Label>
                <Input
                  id="discountAmount"
                  type="text"
                  value={orderFormData.discountAmount}
                  onChange={(e) => setOrderFormData({ ...orderFormData, discountAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="deliveryCharge">Delivery Charge</Label>
                <Input
                  id="deliveryCharge"
                  type="text"
                  value={orderFormData.deliveryCharge}
                  onChange={(e) => setOrderFormData({ ...orderFormData, deliveryCharge: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="confirmedAt">Confirmed At</Label>
                <Input
                  id="confirmedAt"
                  type="datetime-local"
                  value={orderFormData.confirmedAt}
                  onChange={(e) => setOrderFormData({ ...orderFormData, confirmedAt: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="completedAt">Completed At</Label>
                <Input
                  id="completedAt"
                  type="datetime-local"
                  value={orderFormData.completedAt}
                  onChange={(e) => setOrderFormData({ ...orderFormData, completedAt: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="customer">Customer</Label>
                <LazySearchSelect
                  emptyLabel="No customers found"
                  isLoading={lookupLoading.customer}
                  isOpen={openLookup === "customer"}
                  onSearchChange={(value) => setLookupSearch((previous) => ({ ...previous, customer: value }))}
                  onSelect={(value) => {
                    setOrderFormData({ ...orderFormData, customer: value });
                    setOpenLookup(null);
                  }}
                  onToggle={() => toggleLookup("customer")}
                  options={customerLookupOptions}
                  placeholder="Select customer"
                  searchPlaceholder="Search customers..."
                  searchValue={lookupSearch.customer}
                  selectedLabel={customerSelectedLabel}
                  selectedValue={orderFormData.customer}
                />
              </div>
              <div>
                <Label htmlFor="diningTable">Dining Table</Label>
                <LazySearchSelect
                  emptyLabel="No dining tables found"
                  isLoading={lookupLoading.diningTable}
                  isOpen={openLookup === "diningTable"}
                  onSearchChange={(value) => setLookupSearch((previous) => ({ ...previous, diningTable: value }))}
                  onSelect={(value) => {
                    setOrderFormData({ ...orderFormData, diningTable: value });
                    setOpenLookup(null);
                  }}
                  onToggle={() => toggleLookup("diningTable")}
                  options={diningTableLookupOptions}
                  placeholder="Select dining table"
                  searchPlaceholder="Search tables..."
                  searchValue={lookupSearch.diningTable}
                  selectedLabel={diningTableSelectedLabel}
                  selectedValue={orderFormData.diningTable}
                />
              </div>
              <div>
                <Label htmlFor="servedBy">Served By</Label>
                <LazySearchSelect
                  emptyLabel="No employees found"
                  isLoading={lookupLoading.servedBy}
                  isOpen={openLookup === "servedBy"}
                  onSearchChange={(value) => setLookupSearch((previous) => ({ ...previous, servedBy: value }))}
                  onSelect={(value) => {
                    setOrderFormData({ ...orderFormData, servedBy: value });
                    setOpenLookup(null);
                  }}
                  onToggle={() => toggleLookup("servedBy")}
                  options={employeeLookupOptions}
                  placeholder="Select employee"
                  searchPlaceholder="Search employees..."
                  searchValue={lookupSearch.servedBy}
                  selectedLabel={servedBySelectedLabel}
                  selectedValue={orderFormData.servedBy}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleOrderSubmit}>Update Order</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    if (isEditingItem) {
      return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Order Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orderType">Order Type</Label>
                  <Select value={itemFormData.orderType} onValueChange={(value) => setItemFormData({ ...itemFormData, orderType: value as OrderType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dine_in">Dine In</SelectItem>
                      <SelectItem value="takeaway">Takeaway</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={itemFormData.quantity}
                    onChange={(e) => setItemFormData({ ...itemFormData, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dietaryType">Dietary Type</Label>
                  <Select value={itemFormData.dietaryType} onValueChange={(value) => setItemFormData({ ...itemFormData, dietaryType: value as DietaryType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veg">Vegetarian</SelectItem>
                      <SelectItem value="non_veg">Non-Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="gluten_free">Gluten Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="spiceLevel">Spice Level</Label>
                  <Select value={itemFormData.spiceLevel} onValueChange={(value) => setItemFormData({ ...itemFormData, spiceLevel: value as OrderItem["spiceLevel"] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Spice</SelectItem>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hot">Hot</SelectItem>
                      <SelectItem value="extra_hot">Extra Hot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="servingSize">Serving Size</Label>
                  <Input
                    id="servingSize"
                    value={itemFormData.servingSize}
                    onChange={(e) => setItemFormData({ ...itemFormData, servingSize: e.target.value })}
                    placeholder="e.g., 1 plate, 250g"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={itemFormData.status} onValueChange={(value) => setItemFormData({ ...itemFormData, status: value as OrderItemStatus })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="served">Served</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="preparedAt">Prepared At</Label>
                  <Input
                    id="preparedAt"
                    type="datetime-local"
                    value={itemFormData.preparedAt}
                    onChange={(e) => setItemFormData({ ...itemFormData, preparedAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="readyAt">Ready At</Label>
                  <Input
                    id="readyAt"
                    type="datetime-local"
                    value={itemFormData.readyAt}
                    onChange={(e) => setItemFormData({ ...itemFormData, readyAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="servedAt">Served At</Label>
                  <Input
                    id="servedAt"
                    type="datetime-local"
                    value={itemFormData.servedAt}
                    onChange={(e) => setItemFormData({ ...itemFormData, servedAt: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="order">Order</Label>
                  <LazySearchSelect
                    emptyLabel="No orders found"
                    isLoading={lookupLoading.order}
                    isOpen={openLookup === "order"}
                    onSearchChange={(value) => setLookupSearch((previous) => ({ ...previous, order: value }))}
                    onSelect={(value) => {
                      setItemFormData({ ...itemFormData, order: value });
                      setOpenLookup(null);
                    }}
                    onToggle={() => toggleLookup("order")}
                    options={orderLookupOptions}
                    placeholder="Select order"
                    searchPlaceholder="Search orders..."
                    searchValue={lookupSearch.order}
                    selectedLabel={orderSelectedLabel}
                    selectedValue={itemFormData.order}
                  />
                </div>
                <div>
                  <Label htmlFor="orderItem">Order Item</Label>
                  <LazySearchSelect
                    emptyLabel="No menu items found"
                    isLoading={lookupLoading.orderItem}
                    isOpen={openLookup === "orderItem"}
                    onSearchChange={(value) => setLookupSearch((previous) => ({ ...previous, orderItem: value }))}
                    onSelect={(value) => {
                      setItemFormData({ ...itemFormData, orderItem: value });
                      setOpenLookup(null);
                    }}
                    onToggle={() => toggleLookup("orderItem")}
                    options={orderItemLookupOptions}
                    placeholder="Select menu item"
                    searchPlaceholder="Search menu items..."
                    searchValue={lookupSearch.orderItem}
                    selectedLabel={orderItemSelectedLabel}
                    selectedValue={itemFormData.orderItem}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  value={itemFormData.note}
                  onChange={(e) => setItemFormData({ ...itemFormData, note: e.target.value })}
                  placeholder="Add special instructions..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleItemSubmit}>Update Item</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return null;
}
