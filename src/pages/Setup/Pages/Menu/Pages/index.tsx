"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Edit2 } from "lucide-react";
import { errorFunction } from "@/components/common/Alert";
import { useCategories, useCreateMenuItem, useMenuItems, useUpdateMenuItem } from "../Store/MenuStores";
import { useKitchens } from "../../Kitchen/Store/KitchenStores";
import { Card, CardContent } from "@/components/ui/card";
import CreateCategory from "./CreateCategory";
import CreateItem from "./CreateItem";
import MenuCategoryDashboard from "@/components/MenuCategoryDashboard";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24); // 4 rows × 6 columns
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



  const sendPrompt = (message: string) => {
    if (message.startsWith('Show menu items in ')) {
      const categoryName = message.replace('Show menu items in ', '');
      const category = categories.find(cat => cat.name === categoryName);
      if (category) {
        setItemCategoryFilter(category.name);
        setActiveTab("items");
      }
    } else if (message.startsWith('Edit the ')) {
      const categoryName = message.replace('Edit the ', '').replace(' category', '');
      const category = categories.find(cat => cat.name === categoryName);
      if (category) {
        handleEditCategory(category);
      }
    }
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

  // Menu Items Pagination logic
  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMenuItems = filteredMenuItems.slice(startIndex, endIndex);



  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [itemSearch, itemCategoryFilter, itemKitchenFilter, itemAvailabilityFilter, itemVariantFilter]);

  return (
    <div className="p-4 md:p-6 h-screen overflow-hidden flex flex-col">
      <div className="sticky top-0 z-10 pb-4 mb-6 bg-background">
        <h1 className="text-2xl md:text-3xl font-bold">Menu Setup</h1>
      </div>

      <div className="sticky top-[4.5rem] z-10 bg-background border-b border-border mb-6">
        <div className="flex gap-2 justify-between items-center py-2">
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

        {/* Add buttons aligned with navigation */}
        <div className="flex">
          {activeTab === "categories" && (
            <Dialog open={openCategory} onOpenChange={setOpenCategory}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary text-primary-foreground"
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
          )}
          {activeTab === "items" && (
            <Dialog open={openItem} onOpenChange={setOpenItem}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary text-primary-foreground"
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
          )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Categories Tab */}
        {activeTab === "categories" && (
          <MenuCategoryDashboard
            categories={categories}
            sendPrompt={sendPrompt}
          />
        )}

        {/* Menu Items Tab */}
        {activeTab === "items" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Input
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Search menu items"
              className="lg:col-span-1"
            />
            <select
              value={itemCategoryFilter}
              onChange={(e) => setItemCategoryFilter(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={itemKitchenFilter}
              onChange={(e) => setItemKitchenFilter(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="all">All Kitchens</option>
              {kitchens.map((kitchen) => (
                <option key={kitchen.id} value={kitchen.name}>
                  {kitchen.name}
                </option>
              ))}
            </select>
            <select
              value={itemAvailabilityFilter}
              onChange={(e) => setItemAvailabilityFilter(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="all">All Availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <select
              value={itemVariantFilter}
              onChange={(e) => setItemVariantFilter(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="all">All Variants</option>
              <option value="variants">Has Variants</option>
              <option value="regular">Regular Only</option>
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setItemSearch("");
                setItemCategoryFilter("all");
                setItemKitchenFilter("all");
                setItemAvailabilityFilter("all");
                setItemVariantFilter("all");
              }}
              className="h-10"
            >
              Clear Filters
            </Button>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
                <div className="min-h-[650px] max-h-[650px] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {paginatedMenuItems.map((item) => {
                    return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border p-3 min-h-[100px] bg-background/40 hover:bg-secondary/40 transition-colors relative overflow-hidden"
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
              </div>

              {/* Pagination Controls - Outside scrollable area */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredMenuItems.length)} of {filteredMenuItems.length} items
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </div>
  );
}
