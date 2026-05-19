"use client";

import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  ChefHat,
  Eye,
  Grid3X3,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { errorFunction } from "@/components/common/Alert";
import {
  useCategories,
  useCreateMenuItem,
  useMenuItems,
  useUpdateMenuItem,
  useMenuDashboard,
} from "../Store/MenuStores";
import { useKitchens } from "../../Kitchen/Store/KitchenStores";
import CreateCategory from "./CreateCategory";
import CreateItem from "./CreateItem";
import MenuCategoryDashboard from "@/components/MenuCategoryDashboard";
import type { MenuCategory, MenuItem, NamedRelation } from "@/types/api";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type MenuTab = "categories" | "items";

const sampleItems: MenuItem[] = [
  {
    id: -1,
    name: "Fried Rice",
    description: "Wok-tossed rice with vegetables, egg, and scallions.",
    category: { id: -101, name: "Rice" },
    price: 320,
    discountPrice: null,
    photo: "",
    kitchen: { id: -201, name: "Hot Kitchen" },
    isAvailable: true,
    displayOrder: 1,
    parent: null,
    isVariant: false,
  },
  {
    id: -2,
    name: "Biryani",
    description: "Aromatic basmati rice layered with spices and herbs.",
    category: { id: -101, name: "Rice" },
    price: 480,
    discountPrice: null,
    photo: "",
    kitchen: { id: -201, name: "Hot Kitchen" },
    isAvailable: true,
    displayOrder: 2,
    parent: null,
    isVariant: false,
  },
  {
    id: -3,
    name: "Curry",
    description: "Slow-simmered curry with a rich house masala.",
    category: { id: -102, name: "Mains" },
    price: 420,
    discountPrice: null,
    photo: "",
    kitchen: { id: -201, name: "Hot Kitchen" },
    isAvailable: false,
    displayOrder: 3,
    parent: null,
    isVariant: false,
  },
  {
    id: -4,
    name: "Soup",
    description: "Comforting seasonal soup finished with fresh herbs.",
    category: { id: -103, name: "Starters" },
    price: 220,
    discountPrice: null,
    photo: "",
    kitchen: { id: -202, name: "Prep Kitchen" },
    isAvailable: true,
    displayOrder: 4,
    parent: null,
    isVariant: false,
  },
  {
    id: -5,
    name: "Salad",
    description: "Crisp greens, vegetables, seeds, and lemon dressing.",
    category: { id: -104, name: "Fresh" },
    price: 260,
    discountPrice: null,
    photo: "",
    kitchen: { id: -202, name: "Prep Kitchen" },
    isAvailable: true,
    displayOrder: 5,
    parent: null,
    isVariant: false,
  },
  {
    id: -6,
    name: "Bread",
    description: "Freshly baked flatbread served warm from the oven.",
    category: { id: -105, name: "Bakery" },
    price: 110,
    discountPrice: null,
    photo: "",
    kitchen: { id: -203, name: "Bakery" },
    isAvailable: true,
    displayOrder: 6,
    parent: null,
    isVariant: false,
  },
  {
    id: -7,
    name: "Dessert",
    description: "Chef's sweet plate with a rotating daily selection.",
    category: { id: -106, name: "Desserts" },
    price: 300,
    discountPrice: null,
    photo: "",
    kitchen: { id: -204, name: "Pastry" },
    isAvailable: false,
    displayOrder: 7,
    parent: null,
    isVariant: false,
  },
  {
    id: -8,
    name: "Juice",
    description: "Fresh fruit juice pressed to order.",
    category: { id: -107, name: "Drinks" },
    price: 180,
    discountPrice: null,
    photo: "",
    kitchen: { id: -205, name: "Beverage Bar" },
    isAvailable: true,
    displayOrder: 8,
    parent: null,
    isVariant: false,
  },
  {
    id: -9,
    name: "Coffee",
    description: "Freshly brewed coffee with balanced roast notes.",
    category: { id: -107, name: "Drinks" },
    price: 160,
    discountPrice: null,
    photo: "",
    kitchen: { id: -205, name: "Beverage Bar" },
    isAvailable: true,
    displayOrder: 9,
    parent: null,
    isVariant: false,
  },
  {
    id: -10,
    name: "Tea",
    description: "House tea served hot with optional milk and sugar.",
    category: { id: -107, name: "Drinks" },
    price: 90,
    discountPrice: null,
    photo: "",
    kitchen: { id: -205, name: "Beverage Bar" },
    isAvailable: true,
    displayOrder: 10,
    parent: null,
    isVariant: false,
  },
  {
    id: -11,
    name: "Ice Cream",
    description: "Creamy frozen dessert with rotating flavors.",
    category: { id: -106, name: "Desserts" },
    price: 240,
    discountPrice: null,
    photo: "",
    kitchen: { id: -204, name: "Pastry" },
    isAvailable: false,
    displayOrder: 11,
    parent: null,
    isVariant: false,
  },
  {
    id: -12,
    name: "Noodles",
    description: "Stir-fried noodles with vegetables and savory sauce.",
    category: { id: -108, name: "Noodles" },
    price: 350,
    discountPrice: null,
    photo: "",
    kitchen: { id: -201, name: "Hot Kitchen" },
    isAvailable: true,
    displayOrder: 12,
    parent: null,
    isVariant: false,
  },
];

const sampleThumbs: Record<string, string> = {
  "Fried Rice": "🍚",
  Biryani: "🍛",
  Curry: "🥘",
  Soup: "🍲",
  Salad: "🥗",
  Bread: "🫓",
  Dessert: "🍰",
  Juice: "🧃",
  Coffee: "☕",
  Tea: "🍵",
  "Ice Cream": "🍨",
  Noodles: "🍜",
};

const menuCssVars = {
  "--menu-surface": "var(--card)",
  "--menu-subtle": "var(--muted)",
  "--menu-line": "var(--border)",
  "--menu-category-bg": "oklch(0.92 0.08 190 / 0.72)",
  "--menu-category-fg": "oklch(0.31 0.09 196)",
  "--menu-kitchen-bg": "oklch(0.92 0.07 305 / 0.72)",
  "--menu-kitchen-fg": "oklch(0.36 0.12 303)",
  "--menu-available-bg": "oklch(0.93 0.08 145 / 0.72)",
  "--menu-available-fg": "oklch(0.35 0.11 145)",
  "--menu-unavailable-bg": "oklch(0.94 0.08 27 / 0.72)",
  "--menu-unavailable-fg": "oklch(0.43 0.15 27)",
} as CSSProperties;

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const resolveRelationName = (value: MenuItem["category"] | MenuItem["kitchen"]) => {
  if (value == null) return "Unassigned";
  if (typeof value === "object" && "name" in value) return value.name;
  return String(value);
};

const resolveRelationId = (value: MenuItem["category"] | MenuItem["kitchen"]) => {
  if (value == null) return "unassigned";
  if (typeof value === "object" && "id" in value) return String(value.id);
  return String(value);
};

const relationOption = (value: MenuItem["category"] | MenuItem["kitchen"]) => ({
  id: resolveRelationId(value),
  name: resolveRelationName(value),
});

const uniqueById = <T extends { id: string; name: string }>(items: T[]) =>
  Array.from(new Map(items.map((item) => [item.id, item])).values());

const relationToNamed = (value: MenuItem["category"] | MenuItem["kitchen"]): NamedRelation | null => {
  if (value == null) return null;
  if (typeof value === "object" && "id" in value && "name" in value) return value;
  return {
    id: Number(value) || 0,
    name: String(value),
  };
};

const ItemThumbnail = ({ item, size = "md" }: { item: MenuItem; size?: "sm" | "md" | "lg" }) => {
  const sizeClass =
    size === "sm" ? "h-11 w-11 text-xl" : size === "lg" ? "h-24 w-24 text-5xl" : "h-20 w-20 text-4xl";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted",
        sizeClass
      )}
    >
      {item.photo ? (
        <img
          src={item.photo}
          alt={item.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span aria-hidden="true">{sampleThumbs[item.name] ?? "🍽️"}</span>
      )}
    </div>
  );
};

export default function MenuSetup() {
  const [activeTab, setActiveTab] = useState<MenuTab>("categories");
  const [openCategory, setOpenCategory] = useState(false);
  const [openItem, setOpenItem] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [viewingItem, setViewingItem] = useState<MenuItem | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [itemCategoryFilter, setItemCategoryFilter] = useState("all");
  const [itemKitchenFilter, setItemKitchenFilter] = useState("all");
  const [itemAvailabilityFilter, setItemAvailabilityFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [kitchenOptionsEnabled, setKitchenOptionsEnabled] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const shouldLoadCategories = activeTab === "categories" || openCategory || openItem;
  const shouldLoadMenuItems = activeTab === "items";
  const shouldLoadKitchens = activeTab === "items" && kitchenOptionsEnabled;

  const { data: categoriesData } = useCategories(shouldLoadCategories);
  const { data: kitchensData } = useKitchens(shouldLoadKitchens);
  const { data: menuItemsData } = useMenuItems(shouldLoadMenuItems);
  const { data: dashboardData } = useMenuDashboard();

  const apiCategories = categoriesData?.data ?? [];
  const apiKitchens = kitchensData?.data ?? [];
  const apiMenuItems = menuItemsData?.data ?? [];
  const hasApiMenuItems = apiMenuItems.length > 0;
  const menuItems = hasApiMenuItems ? apiMenuItems : sampleItems;

  const categoryOptions = useMemo(() => {
    const apiOptions = apiCategories.map((category) => ({
      id: String(category.id),
      name: category.name,
    }));
    const itemOptions = menuItems.map((item) => relationOption(item.category));
    return uniqueById([...apiOptions, ...itemOptions]).filter((option) => option.name !== "Unassigned");
  }, [apiCategories, menuItems]);

  const kitchenOptions = useMemo(() => {
    const apiOptions = apiKitchens.map((kitchen) => ({
      id: String(kitchen.id),
      name: kitchen.name,
    }));
    const itemOptions = menuItems.map((item) => relationOption(item.kitchen));
    return uniqueById([...apiOptions, ...itemOptions]).filter((option) => option.name !== "Unassigned");
  }, [apiKitchens, menuItems]);

  const categoriesForForms = useMemo<MenuCategory[]>(() => {
    if (apiCategories.length > 0) return apiCategories;

    return categoryOptions.map((category) => ({
      id: Number(category.id),
      name: category.name,
      description: "",
      isActive: true,
      totalMenuItems: menuItems.filter((item) => resolveRelationId(item.category) === category.id).length,
    }));
  }, [apiCategories, categoryOptions, menuItems]);

  const filteredMenuItems = useMemo(() => {
    const search = itemSearch.trim().toLowerCase();

    return menuItems.filter((item) => {
      const category = relationOption(item.category);
      const kitchen = relationOption(item.kitchen);
      const matchesSearch =
        search.length === 0 ||
        item.name.toLowerCase().includes(search) ||
        (item.description || "").toLowerCase().includes(search) ||
        category.name.toLowerCase().includes(search) ||
        kitchen.name.toLowerCase().includes(search);
      const matchesCategory = itemCategoryFilter === "all" || category.id === itemCategoryFilter;
      const matchesKitchen = itemKitchenFilter === "all" || kitchen.id === itemKitchenFilter;
      const matchesAvailability =
        itemAvailabilityFilter === "all" ||
        (itemAvailabilityFilter === "available" && item.isAvailable) ||
        (itemAvailabilityFilter === "unavailable" && !item.isAvailable);

      return matchesSearch && matchesCategory && matchesKitchen && matchesAvailability;
    });
  }, [itemAvailabilityFilter, itemCategoryFilter, itemKitchenFilter, itemSearch, menuItems]);

  const stats = useMemo(() => {
    const categoriesInMenu = new Set(menuItems.map((item) => resolveRelationId(item.category)));
    const kitchensInMenu = new Set(menuItems.map((item) => resolveRelationId(item.kitchen)));

    return [
      {
        label: "Total Items",
        value: dashboardData?.totalMenuItems ?? menuItems.length,
        icon: UtensilsCrossed,
      },
      {
        label: "Available",
        value: dashboardData?.activeMenuItems ?? menuItems.filter((item) => item.isAvailable).length,
        icon: CheckCircle2,
      },
      {
        label: "Menus",
        value: dashboardData?.totalMenus ?? categoriesInMenu.size,
        icon: Grid3X3,
      },
      {
        label: "Kitchens",
        value: dashboardData?.totalKitchens ?? kitchensInMenu.size,
        icon: ChefHat,
      },
    ];
  }, [dashboardData, menuItems]);

  const hasActiveFilters =
    itemSearch.trim().length > 0 ||
    itemCategoryFilter !== "all" ||
    itemKitchenFilter !== "all" ||
    itemAvailabilityFilter !== "all";

  const createMenuItemMutation = useCreateMenuItem();
  const updateMenuItemMutation = useUpdateMenuItem();

  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategoryId(category.id);
    setOpenCategory(true);
  };

  const sendPrompt = (message: string) => {
    if (message.startsWith("Show menu items in ")) {
      const categoryName = message.replace("Show menu items in ", "");
      const category = categoriesForForms.find((cat) => cat.name === categoryName);
      if (category) {
        setItemCategoryFilter(String(category.id));
        setActiveTab("items");
      }
    } else if (message.startsWith("Edit the ")) {
      const categoryName = message.replace("Edit the ", "").replace(" category", "");
      const category = categoriesForForms.find((cat) => cat.name === categoryName);
      if (category) {
        handleEditCategory(category);
      }
    }
  };

  const handleAddItem = (formData: Partial<MenuItem> | FormData) => {
    if (editingItemId) {
      updateMenuItemMutation.mutate({ id: editingItemId, data: formData });
    } else {
      createMenuItemMutation.mutate(formData);
    }
    setEditingItemId(null);
    setOpenItem(false);
  };

  const handleEditItem = (item: MenuItem) => {
    if (item.id < 0) {
      errorFunction("Sample items are read-only. Add a real item to edit it.");
      return;
    }

    setEditingItemId(item.id);
    setOpenItem(true);
  };

  const handleDeleteItem = (id: number) => {
    errorFunction(
      id < 0
        ? "Sample items are read-only."
        : `Delete menu item (id: ${id}) is not implemented yet. Please connect delete API first.`
    );
  };

  const clearFilters = () => {
    setItemSearch("");
    setItemCategoryFilter("all");
    setItemKitchenFilter("all");
    setItemAvailabilityFilter("all");
  };

  return (
    <div className="h-screen overflow-hidden bg-background p-4 md:p-6" style={menuCssVars}>
      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Menu Setup</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage categories, kitchens, item visibility, and POS-ready pricing.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeTab === "categories" ? (
                <Dialog open={openCategory} onOpenChange={setOpenCategory}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => setEditingCategoryId(null)}
                      className="h-10 rounded-md"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full border-border bg-card sm:max-w-md">
                    <CreateCategory
                      closeRef={closeRef}
                      edit={!!editingCategoryId}
                      data={
                        editingCategoryId
                          ? categoriesForForms.find((category) => category.id === editingCategoryId)
                          : undefined
                      }
                      categoryId={editingCategoryId || undefined}
                    />
                  </DialogContent>
                </Dialog>
              ) : (
                <Dialog open={openItem} onOpenChange={setOpenItem}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => setEditingItemId(null)}
                      className="h-10 rounded-md"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full border-border bg-card sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{editingItemId ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
                    </DialogHeader>
                    <CreateItem
                      item={editingItemId ? menuItems.find((item) => item.id === editingItemId) : undefined}
                      onSubmit={handleAddItem}
                      closeRef={closeRef}
                      categories={categoriesForForms}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-md border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{stat.label}</p>
                      <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex w-fit rounded-md border border-border bg-muted p-1">
              <button
                type="button"
                onClick={() => setActiveTab("categories")}
                className={cn(
                  "rounded-sm px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "categories"
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Menu
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("items")}
                className={cn(
                  "rounded-sm px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "items"
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Menu Items
              </button>
            </div>

            {activeTab === "items" ? (
              <div className="flex rounded-md border border-border bg-muted p-1" aria-label="View mode">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  className="h-8 rounded-sm px-3"
                  aria-pressed="true"
                  title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
                >
                  {viewMode === "grid" ? (
                    <List className="h-4 w-4" />
                  ) : (
                    <Grid3X3 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {activeTab === "items" ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,1fr)_190px_190px_180px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={itemSearch}
                  onChange={(event) => setItemSearch(event.target.value)}
                  placeholder="Search items, categories, kitchens"
                  className="h-10 rounded-md pl-9"
                />
              </div>

              <select
                value={itemCategoryFilter}
                onChange={(event) => setItemCategoryFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                aria-label="Filter by category"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={itemKitchenFilter}
                onChange={(event) => setItemKitchenFilter(event.target.value)}
                onFocus={() => setKitchenOptionsEnabled(true)}
                onPointerDown={() => setKitchenOptionsEnabled(true)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                aria-label="Filter by kitchen"
              >
                <option value="all">All Kitchens</option>
                {kitchenOptions.map((kitchen) => (
                  <option key={kitchen.id} value={kitchen.id}>
                    {kitchen.name}
                  </option>
                ))}
              </select>

              <select
                value={itemAvailabilityFilter}
                onChange={(event) => setItemAvailabilityFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                aria-label="Filter by availability"
              >
                <option value="all">All Availability</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>

              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="h-10 rounded-md"
              >
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border bg-card p-3">
              {filteredMenuItems.length === 0 ? (
                <div className="flex min-h-80 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-center">
                  <div>
                    <p className="font-medium">No menu items match these filters.</p>
                    <p className="mt-1 text-sm text-muted-foreground">Clear a filter or search another item.</p>
                  </div>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {filteredMenuItems.map((item) => (
                    <MenuItemGridCard
                      key={item.id}
                      item={item}
                      onView={setViewingItem}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>
              ) : (
                // <div className="overflow-x-auto">
                <div className="max-h-[500px] overflow-auto">

                  <table className="w-full min-w-[860px] border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-background">
                      <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                        <th className="px-3 py-3 font-medium">Item</th>
                        <th className="px-3 py-3 font-medium">Category</th>
                        <th className="px-3 py-3 font-medium">Kitchen</th>
                        <th className="px-3 py-3 font-medium">Price</th>
                        <th className="px-3 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMenuItems.map((item) => (
                        <MenuItemListRow
                          key={item.id}
                          item={item}
                          onView={setViewingItem}
                          onEdit={handleEditItem}
                          onDelete={handleDeleteItem}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <MenuCategoryDashboard categories={categoriesForForms} sendPrompt={sendPrompt} />
          </div>
        )}

        <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
          <DialogContent className="border-border bg-card sm:max-w-md">
            {viewingItem ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <ItemThumbnail item={viewingItem} size="sm" />
                    <span>{viewingItem.name}</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {viewingItem.description || "No description added."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Tag tone="category">{resolveRelationName(viewingItem.category)}</Tag>
                    <Tag tone="kitchen">{resolveRelationName(viewingItem.kitchen)}</Tag>
                    <AvailabilityBadge available={viewingItem.isAvailable} />
                  </div>
                  <div className="rounded-md border border-border bg-muted p-4">
                    <p className="text-xs uppercase text-muted-foreground">Price</p>
                    <p className="mt-1 text-2xl font-semibold">{formatPrice(viewingItem.price)}</p>
                  </div>
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function MenuItemGridCard({
  item,
  onView,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  onView: (item: MenuItem) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
}) {
  const category = relationToNamed(item.category);
  const kitchen = relationToNamed(item.kitchen);

  return (
    <article className="group relative flex min-h-[195px] flex-col rounded-md border border-border bg-background p-3 transition-colors hover:border-foreground/30">
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <ActionButton label={`View ${item.name}`} onClick={() => onView(item)} icon={Eye} />
        <ActionButton label={`Edit ${item.name}`} onClick={() => onEdit(item)} icon={Pencil} />
        <ActionButton label={`Delete ${item.name}`} onClick={() => onDelete(item.id)} icon={Trash2} danger />
      </div>

      <div className="flex items-start gap-3 pr-24">
        <ItemThumbnail item={item} />
        <span
          className={cn(
            "mt-1 h-3 w-3 shrink-0 rounded-full",
            item.isAvailable ? "bg-green-500" : "bg-red-500"
          )}
          aria-label={item.isAvailable ? "Available" : "Unavailable"}
        />
      </div>

      <div className="mt-3 flex-1">
        <h3 className="line-clamp-1 text-base font-semibold">{item.name}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
          {item.description || "No description added."}
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          <Tag tone="category">{category?.name ?? "Unassigned"}</Tag>
          <Tag tone="kitchen">{kitchen?.name ?? "Unassigned"}</Tag>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-2">
        <span className="text-base font-semibold">{formatPrice(item.price)}</span>
        <AvailabilityBadge available={item.isAvailable} />
      </div>
    </article>
  );
}

function MenuItemListRow({
  item,
  onView,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  onView: (item: MenuItem) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <tr className="group border-b border-border last:border-b-0 hover:bg-muted/45">
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <ItemThumbnail item={item} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn("h-2.5 w-2.5 rounded-full", item.isAvailable ? "bg-green-500" : "bg-red-500")}
                aria-hidden="true"
              />
              <p className="truncate font-medium">{item.name}</p>
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {item.description || "No description added."}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <Tag tone="category">{resolveRelationName(item.category)}</Tag>
      </td>
      <td className="px-3 py-3">
        <Tag tone="kitchen">{resolveRelationName(item.kitchen)}</Tag>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{formatPrice(item.price)}</span>
          <AvailabilityBadge available={item.isAvailable} />
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex justify-end gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <ActionButton label={`View ${item.name}`} onClick={() => onView(item)} icon={Eye} />
          <ActionButton label={`Edit ${item.name}`} onClick={() => onEdit(item)} icon={Pencil} />
          <ActionButton label={`Delete ${item.name}`} onClick={() => onDelete(item.id)} icon={Trash2} danger />
        </div>
      </td>
    </tr>
  );
}

function Tag({ children, tone }: { children: string; tone: "category" | "kitchen" }) {
  return (
    <span
      className="inline-flex max-w-full items-center rounded-sm px-2 py-1 text-xs font-medium"
      style={{
        backgroundColor: tone === "category" ? "var(--menu-category-bg)" : "var(--menu-kitchen-bg)",
        color: tone === "category" ? "var(--menu-category-fg)" : "var(--menu-kitchen-fg)",
      }}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-sm px-2 py-1 text-xs font-medium"
      style={{
        backgroundColor: available ? "var(--menu-available-bg)" : "var(--menu-unavailable-bg)",
        color: available ? "var(--menu-available-fg)" : "var(--menu-unavailable-fg)",
      }}
    >
      {available ? "Available" : "Unavailable"}
    </span>
  );
}

function ActionButton({
  label,
  onClick,
  icon: Icon,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  icon: typeof Eye;
  danger?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "h-8 w-8 rounded-md border border-border bg-background",
        danger
          ? "text-destructive hover:bg-destructive hover:text-destructive-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
