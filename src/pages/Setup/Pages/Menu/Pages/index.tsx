"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
 import { Trash2, Edit2, Plus, Edit } from "lucide-react";
import { errorFunction } from "@/components/common/Alert";
import { useCategories, useCreateMenuItem, useMenuItems, useUpdateMenuItem } from "../Store/MenuStores";
import { useKitchens } from "../../Kitchen/Store/KitchenStores";
import CreateCategory from "./CreateCategory";
import CreateItem from "./CreateItem";
import type { MenuCategory, MenuItem } from "@/types/api";

const resolveNamedField = (value: MenuItem["category"] | MenuItem["kitchen"]): string => {
  if (value == null) {
    return "";
  }

  if (typeof value === "object" && "name" in value) {
    return value.name;
  }

  return String(value);
};

export default function MenuSetup() {
  const [activeTab, setActiveTab] = useState("categories");
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data ?? [];
  const { data: kitchensData } = useKitchens(activeTab === "items");
  const kitchens = kitchensData?.data ?? [];
  const { data: menuItemsData } = useMenuItems(activeTab === "items");
  const menuItems = menuItemsData?.data ?? [];

  const createMenuItemMutation = useCreateMenuItem();
  const updateMenuItemMutation = useUpdateMenuItem();
  const [openCategory, setOpenCategory] = useState(false);
  const [openItem, setOpenItem] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [itemCategoryFilter, setItemCategoryFilter] = useState("all");
  const [itemKitchenFilter, setItemKitchenFilter] = useState("all");
  const [itemAvailabilityFilter, setItemAvailabilityFilter] = useState("all");
  const [itemVariantFilter, setItemVariantFilter] = useState("all");
  const closeRef = useRef<HTMLButtonElement>(null);

  const [editingItemId, setEditingItemId] = useState<number | null>(null);



  // // Category handlers
  // const handleAddCategory = () => {
  //   if (editingCategoryId) {
  //     setCategories(
  //       categories.map((c) =>
  //         c.id === editingCategoryId ? { ...c, ...categoryForm } : c
  //       )
  //     );
  //     setEditingCategoryId(null);
  //   } else {
  //     setCategories([
  //       ...categories,
  //       {
  //         id: Math.max(...categories.map((c) => c.id), 0) + 1,
  //         ...categoryForm,
  //       },
  //     ]);
  //   }
  //   setCategoryForm({ name: "", description: "" });
  //   setOpenCategory(false);
  // };

  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategoryId(category.id);
    setOpenCategory(true);
  };

  const handleDeleteCategory = (id: number) => {
    errorFunction(
      `Delete category (id: ${id}) is not implemented yet. Please connect delete API first.`
    );
  };

  // Menu item handlers
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
    setEditingItemId(item.id);
    setOpenItem(true);
  };

  const handleDeleteItem = (id: number) => {
    errorFunction(
      `Delete menu item (id: ${id}) is not implemented yet. Please connect delete API first.`
    );
  };

  const filteredMenuItems = menuItems.filter((item) => {
    const categoryName = resolveNamedField(item.category);
    const kitchenName = resolveNamedField(item.kitchen);
    const matchesCategory =
        itemCategoryFilter === "all" ||
        categoryName.trim().toLowerCase() ===
          itemCategoryFilter.trim().toLowerCase();
    const matchesKitchen =
        itemKitchenFilter === "all" ||
        kitchenName.trim().toLowerCase() ===
          itemKitchenFilter.trim().toLowerCase();
    const matchesAvailability =
        itemAvailabilityFilter === "all" ||
        (itemAvailabilityFilter === "available" && item.isAvailable) ||
        (itemAvailabilityFilter === "unavailable" && !item.isAvailable);
    const matchesVariant =
        itemVariantFilter === "all" ||
        (itemVariantFilter === "variants" && item.isVariant) ||
        (itemVariantFilter === "regular" && !item.isVariant);
    const matchesSearch =
      itemSearch.trim().length === 0 ||
      item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(itemSearch.toLowerCase());

    return matchesCategory && matchesKitchen && matchesAvailability && matchesVariant && matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen">
      <div className="sticky top-0 z-10 pb-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Menu Setup</h1>
      </div>

      <div className="flex gap-2 border-b border-border justify-start items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "categories"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab("items")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "items"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Menu Items
          </button>
        </div>
      </div>

        {/* Categories Tab */}
        {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openCategory} onOpenChange={setOpenCategory}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary text-primary-foreground w-full md:w-auto"
                  onClick={() => {
                    setEditingCategoryId(null);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full sm:max-w-md bg-card border-border">
                <CreateCategory
                  closeRef={closeRef}
                  edit={!!editingCategoryId}
                  data={editingCategoryId ? categories.find(c => c.id === editingCategoryId) : undefined}
                  categoryId={editingCategoryId || undefined}
                />
              </DialogContent>
            </Dialog>
          </div>

            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="pt-6 min-h-[528px] max-h-[528px] overflow-y-auto">
               <p className="text-sm text-muted-foreground mb-4">
                 Double-click any category card to open Menu Items filtered by that category.
               </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {categories.map((category) => {
                  const count = category.totalMenuItems || 0;

                  return (
                    <div
                      key={category.id}
                      onDoubleClick={() => {
                        setItemCategoryFilter(category.name);
                        setActiveTab("items");
                      }}
                      className="rounded-lg border border-border bg-background/40 p-4 hover:bg-secondary/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{category.name}</h3>
                          <p className="text-xs text-primary mt-1">{count} item{count === 1 ? "" : "s"}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            className="text-muted-foreground hover:text-foreground"

                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-muted-foreground hover:text-destructive"

                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Menu Items Tab */}
        {activeTab === "items" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openItem} onOpenChange={setOpenItem}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary text-primary-foreground w-full md:w-auto"
                  onClick={() => {
                    setEditingItemId(null);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full sm:max-w-lg bg-card border-border">
                <DialogHeader>
                  <DialogTitle>
                    {editingItemId ? "Edit Menu Item" : "Add New Menu Item"}
                  </DialogTitle>
                </DialogHeader>
    <CreateItem
      item={editingItemId ? menuItems.find(mi => mi.id === editingItemId) : undefined}
      onSubmit={handleAddItem}
      closeRef={closeRef}
      categories={categories}
    />
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="min-h-[528px] max-h-[528px] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMenuItems.map((item) => {
                  return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border p-4 min-h-[120px] bg-background/40 hover:bg-secondary/40 transition-colors relative overflow-hidden"
                    style={item.photo ? {
                      backgroundImage: `url(${item.photo})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    } : {}}
                  >
                    {/* Overlay for text readability when there's a background image */}
                    {item.photo && (
                      <div className="absolute inset-0 bg-black/40"></div>
                    )}

                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className={`font-semibold truncate ${item.photo ? 'text-white' : ''}`}>
                            {item.name}
                          </h4>
                          <p className={`text-xs mt-0.5 ${item.photo ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {resolveNamedField(item.category)}{item.kitchen ? ` • ${resolveNamedField(item.kitchen)}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                            className={`hover:bg-white/20 ${item.photo ? 'text-white hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className={`hover:bg-white/20 ${item.photo ? 'text-white hover:text-white' : 'text-destructive hover:text-destructive'}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <p className={`text-sm mt-3 line-clamp-3 min-h-14 ${item.photo ? 'text-white/90' : 'text-muted-foreground'}`}>
                        {item.description || "No description"}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="font-semibold text-red-600">{item.price}</span>
                    </div>
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        )}
    </div>
  );
}
