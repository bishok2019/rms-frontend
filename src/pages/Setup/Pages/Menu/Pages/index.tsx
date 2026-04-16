"use client";

import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Trash2, Edit2, Plus } from "lucide-react";
import { errorFunction } from "@/components/common/Alert";
import { useCategories, useCreateMenuItem, useMenuItems, useUpdateMenuItem } from "../Store/MenuStores";
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
  const { data: menuItemsData } = useMenuItems(activeTab === "items");
  const menuItems = menuItemsData?.data ?? [];

  const createMenuItemMutation = useCreateMenuItem();
  const updateMenuItemMutation = useUpdateMenuItem();
  const [openCategory, setOpenCategory] = useState(false);
  const [openItem, setOpenItem] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [itemCategoryFilter, setItemCategoryFilter] = useState("all");
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
    const matchesCategory =
        itemCategoryFilter === "all" ||
        categoryName.trim().toLowerCase() ===
          itemCategoryFilter.trim().toLowerCase();
    const matchesSearch =
      itemSearch.trim().length === 0 ||
      item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(itemSearch.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Menu Setup</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openCategory} onOpenChange={setOpenCategory}>
              <DialogTrigger asChild>
                <Button
                  className="bg-accent text-accent-foreground w-full md:w-auto"
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
            <CardContent className="pt-6">
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
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-3 min-h-14">
                        {category.description || "No description"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Menu Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openItem} onOpenChange={setOpenItem}>
              <DialogTrigger asChild>
                <Button
                  className="bg-accent text-accent-foreground w-full md:w-auto"
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
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Search by item name or description"
                  className="md:col-span-2"
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
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Menu Items</h3>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredMenuItems.length} item{filteredMenuItems.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMenuItems.map((item) => {
                  return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border p-4 min-h-[120px] bg-cover bg-center bg-no-repeat relative overflow-hidden"
                    style={item.photo ? { backgroundImage: `url(${item.photo})` } : {}}
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
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className={`hover:bg-white/20 ${item.photo ? 'text-white hover:text-white' : 'text-destructive hover:text-destructive'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <p className={`text-sm mt-3 line-clamp-3 min-h-14 ${item.photo ? 'text-white/90' : 'text-muted-foreground'}`}>
                        {item.description || "No description"}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="font-semibold">Rs {item.price}</span>
                    </div>
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
