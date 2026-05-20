"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import {
  ChevronRight,
  CookingPot,
  Edit2,
  Grid3X3,
  Hand,
  Plus,
  X,
} from "lucide-react";

import { useTheme } from "@/contexts/theme-context";

import { ListPagination } from "@/components/common/ListPagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ordersApi } from "@/services/orders";
import type {
  Kitchen as ApiKitchen,
  KitchenCategory as ApiKitchenCategory,
  OrderItem as ApiOrderItem,
} from "@/types/api";
import {
  useCreateKitchen,
  useCreateKitchenCategory,
  useKitchenCategories,
  useKitchens,
  useUpdateKitchen,
  useUpdateKitchenCategory,
} from "./Store/KitchenStores";

type KitchenTab = "categories" | "kitchens" | "orders";
type CategoryStatus = "Active" | "Inactive";
type OrderStatus = "pending" | "preparing" | "ready" | "served" | "cancelled";
type DietaryType = "Vegetarian" | "Non-Vegetarian" | "Vegan" | "Gluten Free";
type SpiceLevel = "none" | "mild" | "medium" | "hot" | "extra_hot";
const KITCHEN_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 40, 50];

type KitchenCategory = {
  id: number;
  name: string;
  description: string;
  displayOrder: number;
  status: CategoryStatus;
};

type Kitchen = {
  id: number;
  name: string;
  category: string;
  categoryId: string;
  location: string;
  maxCapacity: number;
};

type KitchenOrder = {
  id: number;
  orderNumber: string;
  item: string;
  quantity: number;
  status: OrderStatus;
  dietary: DietaryType;
  spice: SpiceLevel;
  notes: string;
};

// Form schemas
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  displayOrder: z.number().min(1, "Display order must be at least 1"),
  status: z.enum(["Active", "Inactive"]),
});

const kitchenSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  location: z.string().min(1, "Location is required"),
  maxCapacity: z.number().min(1, "Max capacity must be at least 1"),
});

const orderItemSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  item: z.string().min(1, "Item is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  status: z.enum(["pending", "preparing", "ready", "served", "cancelled"]),
  dietary: z.enum(["Vegetarian", "Non-Vegetarian", "Vegan", "Gluten Free"]),
  spice: z.enum(["none", "mild", "medium", "hot", "extra_hot"]),
  notes: z.string(),
});

type CategoryFormData = z.infer<typeof categorySchema>;
type KitchenFormData = z.infer<typeof kitchenSchema>;
type OrderItemFormData = z.infer<typeof orderItemSchema>;



const darkPageStyle = {
  "--color-background-primary": "#121212",
  "--color-background-secondary": "#1b1b1b",
  "--color-background-tertiary": "#0f0f0f",
  "--color-text-primary": "#f4f4f4",
  "--color-text-secondary": "rgba(244, 244, 244, 0.68)",
  "--color-text-tertiary": "rgba(244, 244, 244, 0.46)",
  "--color-border-tertiary": "rgba(255, 255, 255, 0.15)",
  "--color-border-secondary": "rgba(255, 255, 255, 0.3)",
  "--color-background-success": "rgba(29, 158, 117, 0.16)",
  "--color-text-success": "#52d7a7",
  "--color-background-warning": "rgba(239, 159, 39, 0.16)",
  "--color-text-warning": "#f2b661",
  "--color-background-info": "rgba(78, 150, 255, 0.16)",
  "--color-text-info": "#82b7ff",
  "--color-background-danger": "rgba(226, 75, 74, 0.16)",
  "--color-text-danger": "#ff8d8c",
  "--border-radius-md": "8px",
  "--border-radius-lg": "12px",
} as React.CSSProperties;

const lightPageStyle = {
  "--color-background-primary": "#ffffff",
  "--color-background-secondary": "#f8f9fa",
  "--color-background-tertiary": "#f1f3f4",
  "--color-text-primary": "#1a1a1a",
  "--color-text-secondary": "rgba(26, 26, 26, 0.68)",
  "--color-text-tertiary": "rgba(26, 26, 26, 0.46)",
  "--color-border-tertiary": "rgba(0, 0, 0, 0.12)",
  "--color-border-secondary": "rgba(0, 0, 0, 0.24)",
  "--color-background-success": "rgba(29, 158, 117, 0.12)",
  "--color-text-success": "#1d9e75",
  "--color-background-warning": "rgba(239, 159, 39, 0.12)",
  "--color-text-warning": "#ef9f27",
  "--color-background-info": "rgba(78, 150, 255, 0.12)",
  "--color-text-info": "#4e96ff",
  "--color-background-danger": "rgba(226, 75, 74, 0.12)",
  "--color-text-danger": "#e24b4a",
  "--border-radius-md": "8px",
  "--border-radius-lg": "12px",
} as React.CSSProperties;

const tableHeadClass =
  "bg-[var(--color-background-secondary)] px-[18px] py-[10px] text-[11px] font-medium uppercase text-[var(--color-text-secondary)]";

const tableCellClass = "px-[18px] py-3 text-[13px]";

const getRelationId = (value: ApiKitchen["category"]) => {
  if (typeof value === "object" && value !== null && "id" in value) {
    return String(value.id);
  }

  return value ? String(value) : "";
};

const getRelationName = (value: ApiKitchen["category"]) => {
  if (typeof value === "object" && value !== null && "name" in value) {
    return value.name;
  }

  return value ? String(value) : "Unassigned";
};

const getOrderItemName = (item: ApiOrderItem) => {
  const relation = item.orderItem ?? item.menu_item;
  if (typeof relation === "object" && relation !== null && "name" in relation) {
    return relation.name;
  }

  return relation ? String(relation) : "Unnamed item";
};

const toFiniteNumber = (value: unknown, fallback = 0) => {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const toCategoryRow = (category: ApiKitchenCategory): KitchenCategory => ({
  id: category.id,
  name: category.name,
  description: category.description ?? "",
  displayOrder: category.displayOrder ?? 1,
  status: category.isActive ? "Active" : "Inactive",
});

const toKitchenRow = (kitchen: ApiKitchen): Kitchen => ({
  id: kitchen.id,
  name: kitchen.name,
  category: getRelationName(kitchen.category),
  categoryId: getRelationId(kitchen.category),
  location: kitchen.location ?? "",
  maxCapacity: kitchen.maxCapacity ?? 0,
});

const toDietaryLabel = (value?: string | null): DietaryType => {
  const labels: Record<string, DietaryType> = {
    veg: "Vegetarian",
    non_veg: "Non-Vegetarian",
    vegan: "Vegan",
    gluten_free: "Gluten Free",
  };

  return labels[value ?? ""] ?? "Vegetarian";
};

const toDietaryApiValue = (value: DietaryType) => {
  const values: Record<DietaryType, string> = {
    Vegetarian: "veg",
    "Non-Vegetarian": "non_veg",
    Vegan: "vegan",
    "Gluten Free": "gluten_free",
  };

  return values[value];
};

const toOrderRow = (item: ApiOrderItem): KitchenOrder => ({
  id: item.id,
  orderNumber: `#${item.order}`,
  item: getOrderItemName(item),
  quantity: toFiniteNumber(item.quantity),
  status: item.status,
  dietary: toDietaryLabel(item.dietaryType ?? item.dietary_type),
  spice: item.spiceLevel ?? item.spice_level ?? "none",
  notes: item.note ?? item.special_instructions ?? "N/A",
});

const getFloor = (location: string) => location.split(" - ")[0];

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[var(--color-background-secondary)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
      {children}
    </span>
  );
}

function PaginationMeta({
  currentCount,
  totalCount,
}: {
  currentCount: number;
  totalCount: number;
}) {
  return (
    <div className="pb-3 text-[13px] font-medium text-[var(--color-text-secondary)] md:pb-3 md:pr-1">
      Showing <span className="text-[var(--color-text-primary)]">{currentCount}</span> of{" "}
      <span className="text-[var(--color-text-primary)]">{totalCount}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: CategoryStatus | OrderStatus }) {
  const classes = {
    Active: "bg-[var(--color-background-success)] text-[var(--color-text-success)]",
    Inactive: "bg-[var(--color-background-secondary)] text-[var(--color-text-tertiary)]",
    pending: "bg-[var(--color-background-warning)] text-[var(--color-text-warning)]",
    preparing: "bg-[var(--color-background-info)] text-[var(--color-text-info)]",
    ready: "bg-[var(--color-background-success)] text-[var(--color-text-success)]",
    served: "bg-[var(--color-background-success)] text-[var(--color-text-success)]",
    cancelled: "bg-[var(--color-background-danger)] text-[var(--color-text-danger)]",
  };

  return (
    <Badge variant="outline" className={cn("border-0 px-2 py-0.5 text-[11px] capitalize", classes[status])}>
      {status}
    </Badge>
  );
}

function DietaryBadge({ dietary }: { dietary: DietaryType }) {
  const classes = {
    Vegetarian: "bg-[#EAF3DE] text-[#3B6D11]",
    "Non-Vegetarian": "bg-[#FAECE7] text-[#993C1D]",
    Vegan: "bg-[#E1F5EE] text-[#0F6E56]",
    "Gluten Free": "bg-[#FFF5D6] text-[#76550D]",
  };

  return (
    <Badge variant="outline" className={cn("border-0 px-2 py-0.5 text-[11px]", classes[dietary])}>
      {dietary}
    </Badge>
  );
}

function SpiceIndicator({ spice }: { spice: SpiceLevel }) {
  const classes = {
    none: "bg-[var(--color-text-tertiary)]",
    mild: "bg-[#EF9F27]",
    medium: "bg-[#D85A30]",
    hot: "bg-[#E24B4A]",
    extra_hot: "bg-[#B42318]",
  };

  return (
    <span className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
      <span className={cn("h-2 w-2 rounded-full", classes[spice])} />
      {spice}
    </span>
  );
}

function StatCard({
  label,
  value,
  subLabel,
  success,
}: {
  label: string;
  value: string | number;
  subLabel?: string;
  success?: boolean;
}) {
  return (
    <div className="rounded-[var(--border-radius-md)] bg-[var(--color-background-secondary)] px-4 py-[14px]">
      <p className="text-[11px] font-medium uppercase text-[var(--color-text-secondary)]">{label}</p>
      <p className={cn("mt-2 text-[22px] font-medium leading-none text-[var(--color-text-primary)]", success && "text-[var(--color-text-success)]")}>
        {value}
      </p>
      {subLabel && <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">{subLabel}</p>}
    </div>
  );
}

function EditIconButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <Button
      onClick={onClick}
      aria-label={label}
      size="icon"
      variant="outline"
      className="h-[30px] w-[30px] border-[0.5px] border-[var(--color-border-tertiary)] bg-transparent text-[var(--color-text-secondary)] shadow-none hover:border-[var(--color-border-secondary)] hover:bg-[var(--color-background-secondary)] hover:text-[var(--color-text-primary)]"
    >
      <Edit2 className="h-[13px] w-[13px]" />
    </Button>
  );
}

function CategoryForm({
  onSubmit,
  initialData,
}: {
  onSubmit: (data: CategoryFormData) => void;
  initialData?: KitchenCategory;
}) {
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description,
      displayOrder: initialData.displayOrder,
      status: initialData.status,
    } : {
      name: "",
      description: "",
      displayOrder: 1,
      status: "Active" as CategoryStatus,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="displayOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Order</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit">
            {initialData ? "Update" : "Create"} Category
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function KitchenForm({
  onSubmit,
  initialData,
  categories,
  isCategoriesFetching,
  onCategorySelectOpenChange,
}: {
  onSubmit: (data: KitchenFormData) => void;
  initialData?: Kitchen;
  categories: KitchenCategory[];
  isCategoriesFetching?: boolean;
  onCategorySelectOpenChange?: (open: boolean) => void;
}) {
  const categoryOptions = useMemo(() => {
    const apiOptions = categories.map((category) => ({
      ...category,
      value: category.id.toString(),
    }));

    if (!initialData?.categoryId || apiOptions.some((category) => category.value === initialData.categoryId)) {
      return apiOptions;
    }

    return [
      {
        id: Number.isFinite(Number(initialData.categoryId)) ? Number(initialData.categoryId) : -1,
        value: initialData.categoryId,
        name: initialData.category,
        description: "",
        displayOrder: 0,
        status: "Active" as CategoryStatus,
      },
      ...categories,
    ];
  }, [categories, initialData]);

  const form = useForm<KitchenFormData>({
    resolver: zodResolver(kitchenSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      category: initialData.categoryId,
      location: initialData.location,
      maxCapacity: initialData.maxCapacity,
    } : {
      name: "",
      category: "",
      location: "",
      maxCapacity: 1,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onOpenChange={onCategorySelectOpenChange}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isCategoriesFetching && (
                    <SelectItem value="loading" disabled>
                      Loading categories...
                    </SelectItem>
                  )}
                  {!isCategoriesFetching && categoryOptions.length === 0 && (
                    <SelectItem value="no-categories" disabled>
                      No categories found
                    </SelectItem>
                  )}
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxCapacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Capacity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit">
            {initialData ? "Update" : "Create"} Kitchen
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function OrderItemForm({
  onSubmit,
  initialData,
}: {
  onSubmit: (data: OrderItemFormData) => void;
  initialData?: KitchenOrder;
}) {
  const form = useForm<OrderItemFormData>({
    resolver: zodResolver(orderItemSchema),
    defaultValues: initialData ? {
      orderNumber: initialData.orderNumber,
      item: initialData.item,
      quantity: initialData.quantity,
      status: initialData.status,
      dietary: initialData.dietary,
      spice: initialData.spice,
      notes: initialData.notes,
    } : {
      orderNumber: "",
      item: "",
      quantity: 1,
      status: "pending" as OrderStatus,
      dietary: "Vegetarian" as DietaryType,
      spice: "none" as SpiceLevel,
      notes: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="orderNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order Number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="item"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="served">Served</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dietary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dietary Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dietary type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
                  <SelectItem value="Vegan">Vegan</SelectItem>
                  <SelectItem value="Gluten Free">Gluten Free</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Spice Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select spice level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="extra_hot">Extra hot</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit">
            {initialData ? "Update" : "Create"} Order Item
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function KitchenPage() {
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<KitchenTab>("categories");
  const [ordersKitchen, setOrdersKitchen] = useState<Kitchen | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [dietaryFilter, setDietaryFilter] = useState<"all" | DietaryType>("all");
  const [effectiveTheme, setEffectiveTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const updateEffectiveTheme = () => {
      if (theme === "dark") {
        setEffectiveTheme("dark");
      } else if (theme === "light") {
        setEffectiveTheme("light");
      } else {
        // system
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        setEffectiveTheme(systemTheme);
      }
    };

    updateEffectiveTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", updateEffectiveTheme);
      return () => mediaQuery.removeEventListener("change", updateEffectiveTheme);
    }
  }, [theme]);

  const pageStyle = effectiveTheme === "dark" ? darkPageStyle : lightPageStyle;

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KitchenCategory | Kitchen | KitchenOrder | null>(null);

  // Order filters
  const [kitchenFilter, setKitchenFilter] = useState<string>("all");
  const [categoryOptionsEnabled, setCategoryOptionsEnabled] = useState(false);
  const [kitchenOptionsEnabled, setKitchenOptionsEnabled] = useState(false);
  const [categoryPage, setCategoryPage] = useState(1);
  const [kitchenPage, setKitchenPage] = useState(1);
  const [categoryPageSize, setCategoryPageSize] = useState(KITCHEN_PAGE_SIZE);
  const [kitchenPageSize, setKitchenPageSize] = useState(KITCHEN_PAGE_SIZE);

  const categoriesQuery = useKitchenCategories(activeTab === "categories" || categoryOptionsEnabled, {
    page: categoryPage,
    page_size: categoryPageSize,
  });
  const kitchensQuery = useKitchens(activeTab === "kitchens" || kitchenOptionsEnabled, {
    page: kitchenPage,
    page_size: kitchenPageSize,
  });
  const createCategoryMutation = useCreateKitchenCategory();
  const updateCategoryMutation = useUpdateKitchenCategory();
  const createKitchenMutation = useCreateKitchen();
  const updateKitchenMutation = useUpdateKitchen();

  const orderQueryParams = useMemo(() => ({
    page_size: 100,
    status: statusFilter,
    dietary_type: dietaryFilter === "all" ? "all" : toDietaryApiValue(dietaryFilter),
    order_item__kitchen: kitchenFilter === "all" ? undefined : kitchenFilter,
  }), [dietaryFilter, kitchenFilter, statusFilter]);

  const kitchenOrdersQuery = useQuery({
    queryKey: ["kitchen-order-items", orderQueryParams],
    queryFn: () => ordersApi.getOrderItemsList(orderQueryParams),
    enabled: activeTab === "orders",
  });

  const updateOrderItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ApiOrderItem> }) =>
      ordersApi.updateOrderItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-order-items"] });
      setIsEditDialogOpen(false);
      setEditingItem(null);
    },
  });

  const categories = useMemo(
    () => (categoriesQuery.data?.data ?? []).map(toCategoryRow),
    [categoriesQuery.data]
  );
  const kitchens = useMemo(
    () => (kitchensQuery.data?.data ?? []).map(toKitchenRow),
    [kitchensQuery.data]
  );
  const kitchenOptions = useMemo(() => {
    if (!ordersKitchen || kitchens.some((kitchen) => kitchen.id === ordersKitchen.id)) {
      return kitchens;
    }

    return [ordersKitchen, ...kitchens];
  }, [kitchens, ordersKitchen]);
  const filteredOrders = useMemo(
    () => (kitchenOrdersQuery.data?.data ?? []).map(toOrderRow),
    [kitchenOrdersQuery.data]
  );

  const maxKitchenCapacity = Math.max(1, ...kitchens.map((kitchen) => kitchen.maxCapacity));
  const activeCategories = categories.filter((category) => category.status === "Active").length;
  const totalCapacity = kitchens.reduce((sum, kitchen) => sum + kitchen.maxCapacity, 0);
  const avgCapacity = kitchens.length > 0 ? Math.round(totalCapacity / kitchens.length) : 0;
  const floorsCovered = new Set(kitchens.map((kitchen) => getFloor(kitchen.location))).size;

  const getPendingCount = useCallback((kitchenId: number) =>
    kitchenFilter === kitchenId.toString()
      ? filteredOrders.filter((order) => order.status === "pending").length
      : 0, [filteredOrders, kitchenFilter]);

  const pendingOrders = useMemo(() => {
    return filteredOrders.filter(order => order.status === "pending").length;
  }, [filteredOrders]);
  const selectedKitchenName = useMemo(() => {
    if (kitchenFilter === "all") {
      return "All kitchens";
    }

    return kitchenOptions.find(k => k.id.toString() === kitchenFilter)?.name || "Unknown kitchen";
  }, [kitchenFilter, kitchenOptions]);
  const activePaginationData =
    activeTab === "categories" ? categoriesQuery.data : activeTab === "kitchens" ? kitchensQuery.data : null;

  const addButtonLabel =
    activeTab === "categories" ? "Add category" : activeTab === "kitchens" ? "Add kitchen" : "";

  const openOrdersTab = (kitchen: Kitchen) => {
    setOrdersKitchen(kitchen);
    setKitchenFilter(kitchen.id.toString());
    setStatusFilter("all");
    setDietaryFilter("all");
    setActiveTab("orders");
  };

  const closeOrdersTab = () => {
    setOrdersKitchen(null);
    setKitchenFilter("all");
    setActiveTab("kitchens");
  };

  // Create handlers
  const handleCreateCategory = (data: CategoryFormData) => {
    createCategoryMutation.mutate({
      name: data.name,
      description: data.description,
      displayOrder: data.displayOrder,
      isActive: data.status === "Active",
    }, {
      onSuccess: () => setIsCreateDialogOpen(false),
    });
  };

  const handleCreateKitchen = (data: KitchenFormData) => {
    createKitchenMutation.mutate({
      name: data.name,
      category: Number(data.category),
      location: data.location,
      maxCapacity: data.maxCapacity,
    }, {
      onSuccess: () => setIsCreateDialogOpen(false),
    });
  };

  // Edit handlers
  const handleEditCategory = (data: CategoryFormData) => {
    if (!editingItem || !('displayOrder' in editingItem)) return;
    updateCategoryMutation.mutate({
      id: editingItem.id,
      data: {
        name: data.name,
        description: data.description,
        displayOrder: data.displayOrder,
        isActive: data.status === "Active",
      },
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingItem(null);
      },
    });
  };

  const handleEditKitchen = (data: KitchenFormData) => {
    if (!editingItem || !('maxCapacity' in editingItem)) return;
    updateKitchenMutation.mutate({
      id: editingItem.id,
      data: {
        name: data.name,
        category: Number(data.category),
        location: data.location,
        maxCapacity: data.maxCapacity,
      },
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingItem(null);
      },
    });
  };

  const handleEditOrderItem = (data: OrderItemFormData) => {
    if (!editingItem || !('orderNumber' in editingItem)) return;
    updateOrderItemMutation.mutate({
      id: editingItem.id,
      data: {
        quantity: data.quantity,
        status: data.status,
        dietaryType: toDietaryApiValue(data.dietary),
        spiceLevel: data.spice,
        note: data.notes,
      },
    });
  };

  // Dialog open handlers
  const openCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (item: KitchenCategory | Kitchen | KitchenOrder) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  return (
    <div
      className="flex h-screen min-h-0 flex-col overflow-hidden bg-[var(--color-background-tertiary)] p-6 text-[var(--color-text-primary)]"
      style={pageStyle}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">
        <header className="flex flex-col gap-4 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[20px] font-medium leading-7 text-[var(--color-text-primary)]">Kitchen management</h1>
            <p className="text-[13px] text-[var(--color-text-secondary)]">Manage stations, categories and live orders</p>
          </div>
          {activeTab !== "orders" && (
            <Button
              onClick={openCreateDialog}
              className="h-9 gap-2 rounded-[var(--border-radius-md)] px-4 text-[13px] font-medium"
            >
              <Plus className="h-4 w-4" />
              {addButtonLabel}
            </Button>
          )}
        </header>

        <nav className="relative border-b-[0.5px] border-[var(--color-border-tertiary)]">
          <div className="flex min-h-11 flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="flex min-h-11 items-end gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("categories")}
                className={cn(
                  "flex h-11 items-center gap-2 border-b-2 px-4 text-[13px] font-medium transition-colors",
                  activeTab === "categories"
                    ? "border-[var(--color-text-primary)] text-[var(--color-text-primary)]"
                    : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                )}
              >
                <Grid3X3 className="h-4 w-4" />
                Categories
                <CountBadge>{categories.length}</CountBadge>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("kitchens")}
                className={cn(
                  "flex h-11 items-center gap-2 border-b-2 px-4 text-[13px] font-medium transition-colors",
                  activeTab === "kitchens"
                    ? "border-[var(--color-text-primary)] text-[var(--color-text-primary)]"
                    : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                )}
              >
                <CookingPot className="h-4 w-4" />
                Kitchens
                <CountBadge>{kitchens.length}</CountBadge>
              </button>
              {ordersKitchen && (
                <div
                  className={cn(
                    "ml-2 flex h-10 items-center gap-2 rounded-t-[var(--border-radius-md)] border-x-[0.5px] border-t-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] px-3 text-[13px]",
                    activeTab === "orders" ? "translate-y-px text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
                  )}
                >
                  <button type="button" onClick={() => setActiveTab("orders")} className="font-medium">
                    {ordersKitchen.name} orders
                  </button>
                  {pendingOrders > 0 && (
                    <Badge className="border-0 bg-[var(--color-background-warning)] px-2 py-0.5 text-[11px] text-[var(--color-text-warning)]">
                      {pendingOrders} pending
                    </Badge>
                  )}
                  <button
                    type="button"
                    aria-label="Close orders tab"
                    onClick={closeOrdersTab}
                    className="rounded p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-background-secondary)] hover:text-[var(--color-text-primary)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            {activePaginationData ? (
              <PaginationMeta
                currentCount={activePaginationData.currentCount}
                totalCount={activePaginationData.totalCount}
              />
            ) : null}
          </div>
        </nav>

        <main className="min-h-0 flex-1 overflow-auto py-5">
          {activeTab === "categories" && (
            <section className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total categories" value={categories.length} subLabel="All kitchen types" />
                <StatCard label="Active" value={activeCategories} subLabel="Currently in use" success />
                <StatCard label="Inactive" value={categories.length - activeCategories} subLabel="Disabled" />
                <StatCard label="Total kitchens" value={kitchensQuery.isFetched ? kitchens.length : "-"} subLabel="Across all categories" />
              </div>

              <div className="overflow-hidden rounded-[var(--border-radius-lg)] border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)]">
                <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-[15px] font-medium text-[var(--color-text-primary)]">Kitchen categories</h2>
                  <p className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-tertiary)]">
                    <Hand className="h-3.5 w-3.5" />
                    Double-click a row to view its kitchens
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[var(--color-border-tertiary)] hover:bg-transparent">
                      <TableHead className={tableHeadClass}>Name</TableHead>
                      <TableHead className={tableHeadClass}>Description</TableHead>
                      <TableHead className={tableHeadClass}>Display order</TableHead>
                      <TableHead className={tableHeadClass}>Status</TableHead>
                      <TableHead className={cn(tableHeadClass, "text-right")}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow
                        key={category.id}
                        onDoubleClick={() => setActiveTab("kitchens")}
                        className="cursor-pointer border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-secondary)]"
                      >
                        <TableCell className={cn(tableCellClass, "font-medium text-[var(--color-text-primary)]")}>{category.name}</TableCell>
                        <TableCell className={cn(tableCellClass, "text-[var(--color-text-secondary)]")}>{category.description}</TableCell>
                        <TableCell className={cn(tableCellClass, "text-[var(--color-text-secondary)]")}>{category.displayOrder}</TableCell>
                        <TableCell className={tableCellClass}>
                          <StatusBadge status={category.status} />
                        </TableCell>
                         <TableCell className={cn(tableCellClass, "text-right")}>
                           <EditIconButton label={`Edit ${category.name}`} onClick={() => openEditDialog(category)} />
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {categoriesQuery.data ? (
                <ListPagination
                  currentCount={categoriesQuery.data.currentCount}
                  currentPage={categoriesQuery.data.currentPage}
                  isLoading={categoriesQuery.isFetching}
                  onNextPage={() => setCategoryPage((page) => page + 1)}
                  onPageSizeChange={(pageSize) => {
                    setCategoryPage(1);
                    setCategoryPageSize(pageSize);
                  }}
                  onPreviousPage={() => setCategoryPage((page) => Math.max(1, page - 1))}
                  pageSize={categoryPageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  showSummary={false}
                  totalCount={categoriesQuery.data.totalCount}
                  totalPages={categoriesQuery.data.totalPages}
                />
              ) : null}
            </section>
          )}

          {activeTab === "kitchens" && (
            <section className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total kitchens" value={kitchens.length} />
                <StatCard label="Total capacity" value={totalCapacity} />
                <StatCard label="Avg capacity" value={avgCapacity} />
                <StatCard label="Floors covered" value={floorsCovered} />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {kitchens.map((kitchen) => {
                  const pendingCount = getPendingCount(kitchen.id);
                  const capacityPercent = Math.round((kitchen.maxCapacity / maxKitchenCapacity) * 100);

                  return (
                    <article
                      key={kitchen.id}
                      onDoubleClick={() => openOrdersTab(kitchen)}
                      className="group flex cursor-pointer flex-col gap-4 rounded-[var(--border-radius-lg)] border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] p-4 transition-colors hover:border-[var(--color-border-secondary)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                         <div className="min-w-0">
                           <div className="flex flex-wrap items-center gap-2">
                             <h3 className="text-[14px] font-medium text-[var(--color-text-primary)]">{kitchen.name}</h3>
                             {pendingCount > 0 && (
                               <Badge className="border-0 bg-[var(--color-background-warning)] px-2 py-0.5 text-[11px] text-[var(--color-text-warning)]">
                                 {pendingCount} pending
                               </Badge>
                             )}
                           </div>
                           <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">{kitchen.category}</p>
                         </div>
                         <EditIconButton label={`Edit ${kitchen.name}`} onClick={() => openEditDialog(kitchen)} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-medium uppercase text-[var(--color-text-tertiary)]">Location</p>
                          <p className="mt-1 text-[13px] font-medium text-[var(--color-text-primary)]">{kitchen.location}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium uppercase text-[var(--color-text-tertiary)]">Max capacity</p>
                          <p className="mt-1 text-[13px] font-medium text-[var(--color-text-primary)]">{kitchen.maxCapacity}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-1 flex-1 rounded-full bg-[var(--color-background-secondary)]">
                          <div
                            className="h-1 rounded-full bg-[#1D9E75]"
                            style={{ width: `${capacityPercent}%` }}
                          />
                        </div>
                        <span className="w-9 text-right text-[11px] text-[var(--color-text-tertiary)]">{capacityPercent}%</span>
                      </div>

                      <p className="ml-auto flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100">
                        <Hand className="h-3.5 w-3.5" />
                        Double-click to view orders
                      </p>
                    </article>
                  );
                })}
              </div>
              {kitchensQuery.data ? (
                <ListPagination
                  currentCount={kitchensQuery.data.currentCount}
                  currentPage={kitchensQuery.data.currentPage}
                  isLoading={kitchensQuery.isFetching}
                  onNextPage={() => setKitchenPage((page) => page + 1)}
                  onPageSizeChange={(pageSize) => {
                    setKitchenPage(1);
                    setKitchenPageSize(pageSize);
                  }}
                  onPreviousPage={() => setKitchenPage((page) => Math.max(1, page - 1))}
                  pageSize={kitchenPageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  showSummary={false}
                  totalCount={kitchensQuery.data.totalCount}
                  totalPages={kitchensQuery.data.totalPages}
                />
              ) : null}
            </section>
          )}

          {activeTab === "orders" && ordersKitchen && (
            <section className="flex flex-col gap-5">
              <div className="flex items-center gap-2 text-[12px] text-[var(--color-text-tertiary)]">
                <button
                  type="button"
                  onClick={() => setActiveTab("kitchens")}
                  className="hover:text-[var(--color-text-primary)]"
                >
                  Kitchens
                </button>
                <ChevronRight className="h-3.5 w-3.5" />
                <span>
                  {selectedKitchenName} - live orders
                </span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Select
                  value={kitchenFilter}
                  onOpenChange={(open) => {
                    if (open) setKitchenOptionsEnabled(true);
                  }}
                  onValueChange={setKitchenFilter}
                >
                  <SelectTrigger className="h-9 w-full border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] text-[13px] text-[var(--color-text-primary)] shadow-none sm:w-48">
                    <SelectValue placeholder="All kitchens" />
                  </SelectTrigger>
                  <SelectContent className="border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)]">
                    <SelectItem value="all">All kitchens</SelectItem>
                    {kitchensQuery.isFetching && (
                      <SelectItem value="loading" disabled>
                        Loading kitchens...
                      </SelectItem>
                    )}
                    {kitchenOptions.map((kitchen) => (
                      <SelectItem key={kitchen.id} value={kitchen.id.toString()}>
                        {kitchen.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | OrderStatus)}>
                  <SelectTrigger className="h-9 w-full border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] text-[13px] text-[var(--color-text-primary)] shadow-none sm:w-44">
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent className="border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)]">
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="pending">pending</SelectItem>
                    <SelectItem value="preparing">preparing</SelectItem>
                    <SelectItem value="ready">ready</SelectItem>
                    <SelectItem value="served">served</SelectItem>
                    <SelectItem value="cancelled">cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dietaryFilter} onValueChange={(value) => setDietaryFilter(value as "all" | DietaryType)}>
                  <SelectTrigger className="h-9 w-full border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] text-[13px] text-[var(--color-text-primary)] shadow-none sm:w-48">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent className="border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)]">
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
                    <SelectItem value="Vegan">Vegan</SelectItem>
                    <SelectItem value="Gluten Free">Gluten Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-hidden rounded-[var(--border-radius-lg)] border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)]">
                <div className="flex items-center justify-between gap-3 px-4 py-4">
                  <h2 className="text-[15px] font-medium text-[var(--color-text-primary)]">
                    {selectedKitchenName} - live orders
                  </h2>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">{filteredOrders.length} orders</p>
                </div>
                <Table>
                   <TableHeader>
                     <TableRow className="border-[var(--color-border-tertiary)] hover:bg-transparent">
                       <TableHead className={tableHeadClass}>Order #</TableHead>
                       <TableHead className={tableHeadClass}>Item</TableHead>
                       <TableHead className={tableHeadClass}>Qty</TableHead>
                       <TableHead className={tableHeadClass}>Status</TableHead>
                       <TableHead className={tableHeadClass}>Dietary</TableHead>
                       <TableHead className={tableHeadClass}>Spice</TableHead>
                       <TableHead className={tableHeadClass}>Notes</TableHead>
                       <TableHead className={cn(tableHeadClass, "text-right")}>Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                  <TableBody>
                     {filteredOrders.length === 0 ? (
                       <TableRow className="border-[var(--color-border-tertiary)] hover:bg-transparent">
                         <TableCell colSpan={8} className="px-[18px] py-10 text-center text-[13px] text-[var(--color-text-secondary)]">
                           No orders match the current filters
                         </TableCell>
                       </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-secondary)]"
                        >
                          <TableCell className={cn(tableCellClass, "font-medium text-[var(--color-text-primary)]")}>{order.orderNumber}</TableCell>
                          <TableCell className={cn(tableCellClass, "text-[var(--color-text-primary)]")}>{order.item}</TableCell>
                          <TableCell className={cn(tableCellClass, "text-[var(--color-text-secondary)]")}>{order.quantity.toFixed(2)}</TableCell>
                          <TableCell className={tableCellClass}>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className={tableCellClass}>
                            <DietaryBadge dietary={order.dietary} />
                          </TableCell>
                           <TableCell className={tableCellClass}>
                             <SpiceIndicator spice={order.spice} />
                           </TableCell>
                           <TableCell className={cn(tableCellClass, "text-[var(--color-text-secondary)]")}>{order.notes}</TableCell>
                           <TableCell className={cn(tableCellClass, "text-right")}>
                             <EditIconButton label={`Edit order ${order.orderNumber}`} onClick={() => openEditDialog(order)} />
                           </TableCell>
                         </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </section>
          )}
        </main>

        {/* Create Dialog */}
        {activeTab !== "orders" && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  Create {activeTab === "categories" ? "Category" : "Kitchen"}
                </DialogTitle>
                <DialogDescription>
                  Add a new {activeTab.slice(0, -1)} to the kitchen management system.
                </DialogDescription>
              </DialogHeader>
              {activeTab === "categories" && (
                <CategoryForm onSubmit={handleCreateCategory} />
              )}
              {activeTab === "kitchens" && (
                <KitchenForm
                  onSubmit={handleCreateKitchen}
                  categories={categories}
                  isCategoriesFetching={categoriesQuery.isFetching}
                  onCategorySelectOpenChange={(open) => {
                    if (open) setCategoryOptionsEnabled(true);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                Edit {editingItem && 'displayOrder' in editingItem ? "Category" : editingItem && 'maxCapacity' in editingItem ? "Kitchen" : "Order Item"}
              </DialogTitle>
              <DialogDescription>
                Update the {editingItem && 'displayOrder' in editingItem ? "category" : editingItem && 'maxCapacity' in editingItem ? "kitchen" : "order item"} details.
              </DialogDescription>
            </DialogHeader>
            {editingItem && 'displayOrder' in editingItem && (
              <CategoryForm onSubmit={handleEditCategory} initialData={editingItem} />
            )}
            {editingItem && 'maxCapacity' in editingItem && (
              <KitchenForm
                onSubmit={handleEditKitchen}
                initialData={editingItem}
                categories={categories}
                isCategoriesFetching={categoriesQuery.isFetching}
                onCategorySelectOpenChange={(open) => {
                  if (open) setCategoryOptionsEnabled(true);
                }}
              />
            )}
            {editingItem && 'orderNumber' in editingItem && (
              <OrderItemForm onSubmit={handleEditOrderItem} initialData={editingItem} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
