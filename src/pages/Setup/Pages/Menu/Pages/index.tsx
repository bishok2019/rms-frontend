"use client";

import { useEffect, useRef, useState } from "react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24); // 4 rows × 6 columns
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoriesPerPage] = useState(24); // 4 rows × 6 columns
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

  // Menu Items Pagination logic
  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMenuItems = filteredMenuItems.slice(startIndex, endIndex);

  // Categories Pagination logic
  const totalCategoryPages = Math.ceil(categories.length / categoriesPerPage);
  const categoryStartIndex = (categoryPage - 1) * categoriesPerPage;
  const categoryEndIndex = categoryStartIndex + categoriesPerPage;
  const paginatedCategories = categories.slice(categoryStartIndex, categoryEndIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [itemSearch, itemCategoryFilter, itemKitchenFilter, itemAvailabilityFilter, itemVariantFilter]);

  // Reset category page when switching tabs
  useEffect(() => {
    setCategoryPage(1);
  }, [activeTab]);

  return (
    <div className="p-4 md:p-6 space-y-6 h-screen overflow-hidden flex flex-col">
      <div className="sticky top-0 z-10 pb-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Menu Setup</h1>
      </div>

      <div className="flex gap-2 border-b border-border justify-between items-center mb-6">
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

        {/* Categories Tab */}
        {activeTab === "categories" && (
        <div className="space-y-4">

            <Card className="bg-card border-border">
              <CardContent className="p-6">
              <div className="min-h-[650px] max-h-[650px] overflow-y-auto">
                 <p className="text-sm text-muted-foreground mb-4">
                   Double-click any category card to open Menu Items filtered by that category.
                 </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {paginatedCategories.map((category) => {
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
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Grid3x3 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{category.name}</h3>
                              <p className="text-xs text-primary mt-1">{count} item{count === 1 ? "" : "s"}</p>
                            </div>
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
                </div>

                {/* Categories Pagination Controls - Outside scrollable area */}
                {totalCategoryPages > 1 && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Showing {categoryStartIndex + 1}-{Math.min(categoryEndIndex, categories.length)} of {categories.length} categories
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCategoryPage(prev => Math.max(prev - 1, 1))}
                        disabled={categoryPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {categoryPage} of {totalCategoryPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCategoryPage(prev => Math.min(prev + 1, totalCategoryPages))}
                        disabled={categoryPage === totalCategoryPages}
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
  );
}
