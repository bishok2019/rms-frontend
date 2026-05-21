"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import {
  CheckCircle2,
  ChefHat,
  ChevronRight,
  CircleOff,
  CookingPot,
  Edit2,
  Filter,
  Grid3X3,
  Hand,
  Layers3,
  Plus,
  UtensilsCrossed,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";



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
import { errorFunction } from "@/components/common/Alert";
import type {
  Kitchen as ApiKitchen,
  KitchenCategory as ApiKitchenCategory,
  OrderItem as ApiOrderItem,
} from "@/types/api";
import {
  useCreateKitchen,
  useCreateKitchenCategory,
  useKitchenDashboard,
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
  ordersCount: Array<{
    status: OrderStatus | string;
    count: number;
  }>;
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





const tableHeadClass =
  "bg-muted px-3 py-2 text-[11px] font-medium uppercase text-muted-foreground";

const tableCellClass = "px-3 py-3 text-sm";

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
  ordersCount: kitchen.ordersCount ?? [],
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

const toDietaryApiValue = (value: DietaryType): "veg" | "non_veg" | "vegan" | "gluten_free" => {
  const values: Record<DietaryType, "veg" | "non_veg" | "vegan" | "gluten_free"> = {
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

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
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
    <div className="pb-3 text-[13px] font-medium text-muted-foreground md:pb-3 md:pr-1">
      Showing <span className="text-foreground">{currentCount}</span> of{" "}
      <span className="text-foreground">{totalCount}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: CategoryStatus | OrderStatus }) {
  const classes: Record<string, string> = {
    Active: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    Inactive: "bg-muted text-muted-foreground",
    pending: "bg-amber-500/15 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    preparing: "bg-blue-500/15 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    ready: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    served: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    cancelled: "bg-red-500/15 text-red-600 dark:bg-red-950 dark:text-red-400",
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
    none: "bg-muted-foreground",
    mild: "bg-[#EF9F27]",
    medium: "bg-[#D85A30]",
    hot: "bg-[#E24B4A]",
    extra_hot: "bg-[#B42318]",
  };

  return (
    <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full", classes[spice])} />
      {spice}
    </span>
  );
}

function StatCard({
  label,
  value,
  subLabel,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  subLabel?: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "red" | "violet" | "amber" | "cyan" | "slate";
}) {
  const toneClasses = {
    blue: {
      card: "border-l-sky-500 bg-sky-50/70 dark:bg-sky-950/20",
      icon: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
      value: "text-sky-950 dark:text-sky-100",
    },
    green: {
      card: "border-l-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20",
      icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      value: "text-emerald-950 dark:text-emerald-100",
    },
    red: {
      card: "border-l-rose-500 bg-rose-50/70 dark:bg-rose-950/20",
      icon: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
      value: "text-rose-950 dark:text-rose-100",
    },
    violet: {
      card: "border-l-violet-500 bg-violet-50/70 dark:bg-violet-950/20",
      icon: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
      value: "text-violet-950 dark:text-violet-100",
    },
    amber: {
      card: "border-l-amber-500 bg-amber-50/70 dark:bg-amber-950/20",
      icon: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      value: "text-amber-950 dark:text-amber-100",
    },
    cyan: {
      card: "border-l-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/20",
      icon: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
      value: "text-cyan-950 dark:text-cyan-100",
    },
    slate: {
      card: "border-l-slate-500 bg-slate-50/70 dark:bg-slate-950/20",
      icon: "bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300",
      value: "text-slate-950 dark:text-slate-100",
    },
  }[tone];

  return (
    <div className={cn("overflow-hidden rounded-md border-l-4 px-4 py-[14px]", toneClasses.card)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase text-muted-foreground">{label}</p>
          <p className={cn("mt-2 text-[22px] font-medium leading-none", toneClasses.value)}>
            {value}
          </p>
        </div>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", toneClasses.icon)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      {subLabel && <p className="mt-1 text-[11px] text-muted-foreground">{subLabel}</p>}
    </div>
  );
}

const getPreparingLoadTone = (percent: number) => {
  if (percent >= 90) return "bg-[#DC2626]";
  if (percent >= 70) return "bg-[#F97316]";
  if (percent >= 40) return "bg-[#F59E0B]";
  return "bg-[#38BDF8]";
};

const getKitchenPreparingCount = (kitchen: Kitchen) =>
  kitchen.ordersCount.find((orderCount) => orderCount.status === "preparing")?.count ?? 0;

function EditIconButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <Button
      onClick={onClick}
      aria-label={label}
      size="icon"
      variant="outline"
      className="h-[30px] w-[30px] border border-border bg-transparent text-muted-foreground shadow-none hover:border-foreground/30 hover:bg-muted hover:text-foreground"
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
  const resolvedCategoryId = useMemo(() => {
    if (!initialData) return "";
    if (initialData.categoryId && Number.isFinite(Number(initialData.categoryId))) {
      return initialData.categoryId;
    }

    const matchingCategory = categories.find((category) => category.name === initialData.category);
    return matchingCategory ? matchingCategory.id.toString() : initialData.categoryId;
  }, [categories, initialData]);

  const categoryOptions = useMemo(() => {
    const apiOptions = categories.map((category) => ({
      ...category,
      value: category.id.toString(),
    }));

    if (!initialData?.categoryId || apiOptions.some((category) => category.value === resolvedCategoryId)) {
      return apiOptions;
    }

    return [
      {
        id: Number.isFinite(Number(resolvedCategoryId)) ? Number(resolvedCategoryId) : -1,
        value: resolvedCategoryId,
        name: initialData.category,
        description: "",
        displayOrder: 0,
        status: "Active" as CategoryStatus,
      },
      ...apiOptions,
    ];
  }, [categories, initialData, resolvedCategoryId]);

  const form = useForm<KitchenFormData>({
    resolver: zodResolver(kitchenSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      category: resolvedCategoryId,
      location: initialData.location,
      maxCapacity: initialData.maxCapacity,
    } : {
      name: "",
      category: "",
      location: "",
      maxCapacity: 1,
    },
  });

  useEffect(() => {
    form.reset(initialData ? {
      name: initialData.name,
      category: resolvedCategoryId,
      location: initialData.location,
      maxCapacity: initialData.maxCapacity,
    } : {
      name: "",
      category: "",
      location: "",
      maxCapacity: 1,
    });
  }, [form, initialData, resolvedCategoryId]);

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
                value={field.value}
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
  const [activeTab, setActiveTab] = useState<KitchenTab>("categories");
  const [ordersKitchen, setOrdersKitchen] = useState<Kitchen | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [dietaryFilter, setDietaryFilter] = useState<"all" | DietaryType>("all");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KitchenCategory | Kitchen | KitchenOrder | null>(null);

  // Order filters
  const [kitchenFilter, setKitchenFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [categoryOptionsEnabled, setCategoryOptionsEnabled] = useState(false);
  const [kitchenOptionsEnabled, setKitchenOptionsEnabled] = useState(false);
  const [categoryPage, setCategoryPage] = useState(1);
  const [kitchenPage, setKitchenPage] = useState(1);
  const [categoryPageSize, setCategoryPageSize] = useState(KITCHEN_PAGE_SIZE);
  const [kitchenPageSize, setKitchenPageSize] = useState(KITCHEN_PAGE_SIZE);

  useEffect(() => {
    if (!isFilterOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  const categoriesQuery = useKitchenCategories(activeTab === "categories" || categoryOptionsEnabled, {
    page: categoryPage,
    page_size: categoryPageSize,
  });
  const kitchensQuery = useKitchens(activeTab === "kitchens" || kitchenOptionsEnabled, {
    page: kitchenPage,
    page_size: kitchenPageSize,
  });
  const { data: dashboardData } = useKitchenDashboard();
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

  const totalKitchenCategories = dashboardData?.totalKitchenCategories ?? categories.length;
  const totalKitchens = dashboardData?.totalKitchens ?? kitchens.length;
  const activeCategories = dashboardData?.totalActiveKitchenCategories ?? categories.filter((category) => category.status === "Active").length;
  const inactiveCategories = dashboardData?.totalInactiveKitchenCategories ?? Math.max(totalKitchenCategories - activeCategories, 0);
  const activeKitchens = dashboardData?.totalActiveKitchens ?? kitchens.length;
  const inactiveKitchens = dashboardData?.totalInactiveKitchens ?? 0;
  const totalCapacity = dashboardData?.totalKitchenCapacity ?? kitchens.reduce((sum, kitchen) => sum + kitchen.maxCapacity, 0);

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
    activeTab === "categories" ? "Category" : activeTab === "kitchens" ? "Kitchen" : "";

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
    const categoryId = Number(data.category);
    if (!Number.isFinite(categoryId)) {
      errorFunction("Please select a valid kitchen category.");
      return;
    }

    createKitchenMutation.mutate({
      name: data.name,
      category: categoryId,
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
    const categoryId = Number(data.category);
    if (!Number.isFinite(categoryId)) {
      errorFunction("Please select a valid kitchen category.");
      return;
    }

    updateKitchenMutation.mutate({
      id: editingItem.id,
      data: {
        name: data.name,
        category: categoryId,
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
    if ("maxCapacity" in item) {
      setCategoryOptionsEnabled(true);
    }
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-background p-4 md:p-6 flex flex-col">
      <div className="flex h-full flex-col gap-4">
        <header className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[20px] font-medium leading-7 text-foreground">Kitchen management</h1>
            <p className="text-[13px] text-muted-foreground">Double-click a category to view its kitchen, or kitchen to view its order items</p>
            {/* <p className="text-[13px] text-muted-foreground">Manage stations, categories and live orders</p> */}
          </div>
          {activeTab !== "orders" && (
            <Button
              onClick={openCreateDialog}
              className="h-9 gap-2 rounded-md px-4 text-[13px] font-medium"
            >
              <Plus className="h-4 w-4" />
              {addButtonLabel}
            </Button>
          )}
         </header>

        {activeTab === "categories" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 -mb-2">
            <StatCard label="Total categories" value={totalKitchenCategories} subLabel="" icon={Layers3} tone="blue" />
            <StatCard label="Active" value={activeCategories} subLabel="" icon={CheckCircle2} tone="green" />
            <StatCard label="Inactive" value={inactiveCategories} subLabel="" icon={CircleOff} tone="red" />
            <StatCard label="Total kitchens" value={totalKitchens} subLabel="" icon={ChefHat} tone="amber" />
          </div>
        )}

        {(activeTab === "kitchens" || activeTab === "orders") && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 -mb-2">
            <StatCard label="Total kitchens" value={totalKitchens} icon={CookingPot} tone="blue" />
            <StatCard label="Active" value={activeKitchens} icon={CheckCircle2} tone="green" />
            <StatCard label="Inactive" value={inactiveKitchens} icon={CircleOff} tone="red" />
            <StatCard label="Total capacity" value={totalCapacity} icon={UtensilsCrossed} tone="amber" />
          </div>
        )}

        <nav className="relative border-b border-border">
          <div className="flex min-h-11 flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="flex min-h-11 items-end gap-1 overflow-x-auto overflow-y-hidden">
              <button
                type="button"
                onClick={() => setActiveTab("categories")}
                className={cn(
                  "flex h-11 items-center gap-2 border-b-2 px-4 text-[13px] font-medium transition-colors",
                  activeTab === "categories"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
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
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <CookingPot className="h-4 w-4" />
                Kitchens
                <CountBadge>{kitchens.length}</CountBadge>
              </button>
              {ordersKitchen && (
                 <div
                   className={cn(
                     "ml-2 flex h-10 items-center gap-2 rounded-t-md border-x border-t border-border bg-card px-3 text-[13px]",
                     activeTab === "orders" 
                       ? "-mt-px text-foreground" 
                       : "text-muted-foreground"
                   )}
                 >
                  <button type="button" onClick={() => setActiveTab("orders")} className="font-medium">
                    {selectedKitchenName} orders
                  </button>
                  {pendingOrders > 0 && (
                    <Badge className="border-0 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                      {pendingOrders} pending
                    </Badge>
                  )}
                  <button
                    type="button"
                    aria-label="Close orders tab"
                    onClick={closeOrdersTab}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {activeTab === "orders" && (
              <div className="relative" ref={filterRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsFilterOpen((prev) => !prev);
                  }}
                  className={cn(
                    "h-9 gap-2",
                    (kitchenFilter !== "all" || statusFilter !== "all" || dietaryFilter !== "all") &&
                      "border-primary text-primary"
                  )}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {(kitchenFilter !== "all" || statusFilter !== "all" || dietaryFilter !== "all") && (
                    <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Button>

                {isFilterOpen && (
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full z-[100] mt-2 w-72 rounded-lg border border-border bg-card p-4 shadow-md"
                  >
                    <div className="space-y-4">
                      {/* Kitchen Filter */}
                      <div>
                        <div className="mb-1.5 text-xs font-medium text-muted-foreground">Kitchen</div>
                        <Select
                          value={kitchenFilter}
                          onOpenChange={(open) => { if (open) setKitchenOptionsEnabled(true); }}
                          onValueChange={setKitchenFilter}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="All kitchens" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All kitchens</SelectItem>
                            {kitchensQuery.isFetching && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                            {kitchenOptions.map(k => (
                              <SelectItem key={k.id} value={k.id.toString()}>{k.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <div className="mb-1.5 text-xs font-medium text-muted-foreground">Status</div>
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="All status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="served">Served</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Dietary Filter */}
                      <div>
                        <div className="mb-1.5 text-xs font-medium text-muted-foreground">Dietary Type</div>
                        <Select value={dietaryFilter} onValueChange={(v) => setDietaryFilter(v as any)}>
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                            <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
                            <SelectItem value="Vegan">Vegan</SelectItem>
                            <SelectItem value="Gluten Free">Gluten Free</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(kitchenFilter !== "all" || statusFilter !== "all" || dietaryFilter !== "all") && (
                        <button
                          onClick={() => {
                            setKitchenFilter("all");
                            setStatusFilter("all");
                            setDietaryFilter("all");
                            setIsFilterOpen(false);
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activePaginationData && activeTab !== "orders" && (
              <PaginationMeta
                currentCount={activePaginationData.currentCount}
                totalCount={activePaginationData.totalCount}
              />
            )}
          </div>
        </nav>

        {/* <main className="min-h-0 flex-1 overflow-auto py-5"> */}
        <main className="min-h-0 flex-1 overflow-auto">

          {activeTab === "categories" && (
            <section className="flex flex-col gap-4">

              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-[15px] font-medium text-foreground">Kitchen categories</h2>
                  <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Hand className="h-3.5 w-3.5" />
                    Double-click a row to view its kitchens
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
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
                        className="cursor-pointer border-border hover:bg-muted"
                      >
                        <TableCell className={cn(tableCellClass, "font-medium text-foreground")}>{category.name}</TableCell>
                        <TableCell className={cn(tableCellClass, "text-muted-foreground")}>{category.description}</TableCell>
                        <TableCell className={cn(tableCellClass, "text-muted-foreground")}>{category.displayOrder}</TableCell>
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
            <section className="flex flex-col gap-4">

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {kitchens.map((kitchen) => {
                  const pendingCount = getPendingCount(kitchen.id);
                  const preparingCount = getKitchenPreparingCount(kitchen);
                  const preparingPercent = kitchen.maxCapacity > 0
                    ? Math.min(100, Math.round((preparingCount / kitchen.maxCapacity) * 100))
                    : 0;
                  const displayPercent = preparingCount > 0 ? Math.max(preparingPercent, 1) : 0;

                  return (
                    <article
                      key={kitchen.id}
                      onDoubleClick={() => openOrdersTab(kitchen)}
                      className="group flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-border"
                    >
                      <div className="flex items-start justify-between gap-3">
                         <div className="min-w-0">
                           <div className="flex flex-wrap items-center gap-2">
                             <h3 className="text-[14px] font-medium text-foreground">{kitchen.name}</h3>
                             {pendingCount > 0 && (
                               <Badge className="border-0 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                                 {pendingCount} pending
                               </Badge>
                             )}
                           </div>
                           <p className="mt-0.5 text-[12px] text-muted-foreground">{kitchen.category}</p>
                         </div>
                         <EditIconButton label={`Edit ${kitchen.name}`} onClick={() => openEditDialog(kitchen)} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-medium uppercase text-muted-foreground">Location</p>
                          <p className="mt-1 text-[13px] font-medium text-foreground">{kitchen.location}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium uppercase text-muted-foreground">Max capacity</p>
                          <p className="mt-1 text-[13px] font-medium text-foreground">{kitchen.maxCapacity}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-1 flex-1 rounded-full bg-muted">
                          <div
                            className={cn("h-1 rounded-full", getPreparingLoadTone(preparingPercent))}
                            style={{ width: `${displayPercent}%` }}
                          />
                        </div>
                        <span className="w-24 text-right text-[11px] text-muted-foreground">
                          {preparingCount}/{kitchen.maxCapacity} workload
                        </span>
                      </div>

                      <p className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
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
            <section className="flex flex-col gap-4">

              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between gap-3 px-3 py-3">
                  <h2 className="text-[15px] font-medium text-foreground">
                    {selectedKitchenName} - live orders
                  </h2>
                  <p className="text-[12px] text-muted-foreground">{filteredOrders.length} orders</p>
                </div>
                <Table>
                   <TableHeader>
                     <TableRow className="border-border hover:bg-transparent">
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
                       <TableRow className="border-border hover:bg-transparent">
                         <TableCell colSpan={8} className="px-[18px] py-10 text-center text-[13px] text-muted-foreground">
                           No orders match the current filters
                         </TableCell>
                       </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="border-border hover:bg-muted"
                        >
                          <TableCell className={cn(tableCellClass, "font-medium text-foreground")}>{order.orderNumber}</TableCell>
                          <TableCell className={cn(tableCellClass, "text-foreground")}>{order.item}</TableCell>
                          <TableCell className={cn(tableCellClass, "text-muted-foreground")}>{order.quantity.toFixed(2)}</TableCell>
                          <TableCell className={tableCellClass}>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className={tableCellClass}>
                            <DietaryBadge dietary={order.dietary} />
                          </TableCell>
                           <TableCell className={tableCellClass}>
                             <SpiceIndicator spice={order.spice} />
                           </TableCell>
                           <TableCell className={cn(tableCellClass, "text-muted-foreground")}>{order.notes}</TableCell>
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
