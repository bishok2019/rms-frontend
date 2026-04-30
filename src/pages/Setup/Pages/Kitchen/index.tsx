"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Plus, ChefHat, Loader2 } from "lucide-react";
import {
  useKitchenCategories,
  useCreateKitchenCategory,
  useUpdateKitchenCategory,
  useKitchens,
  useCreateKitchen,
  useUpdateKitchen,
} from "./Store/KitchenStores";
import { ordersApi } from "@/services/orders";
import type { KitchenCategory, Kitchen, OrderItem } from "@/types/api";

export default function KitchenPage() {
  const [activeTab, setActiveTab] = useState<"categories" | "kitchens" | "order-items">("categories");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isKitchenDialogOpen, setIsKitchenDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KitchenCategory | null>(null);
  const [editingKitchen, setEditingKitchen] = useState<Kitchen | null>(null);
  const [selectedKitchen, setSelectedKitchen] = useState<Kitchen | null>(null);
  const [kitchenOrderItems, setKitchenOrderItems] = useState<OrderItem[]>([]);
  const [isLoadingOrderItems, setIsLoadingOrderItems] = useState(false);
  const [filters, setFilters] = useState({
    kitchenId: "",
    status: "all",
    dietaryType: "all",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    isActive: true,
    displayOrder: 0,
  });

  const [kitchenForm, setKitchenForm] = useState({
    category: "",
    name: "",
    location: "",
    maxCapacity: "",
  });

  const { data: categoriesData } = useKitchenCategories(activeTab === "categories");
  const { data: kitchensData } = useKitchens(activeTab === "kitchens");
  const { mutateAsync: createCategory } = useCreateKitchenCategory();
  const { mutateAsync: updateCategory } = useUpdateKitchenCategory();
  const { mutateAsync: createKitchen } = useCreateKitchen();
  const { mutateAsync: updateKitchen } = useUpdateKitchen();

  const categories = categoriesData?.data ?? [];
  const kitchens = kitchensData?.data ?? [];

  useEffect(() => {
    if (selectedKitchen) {
      setFilters(prev => ({ ...prev, kitchenId: selectedKitchen.id.toString() }));
    }
  }, [selectedKitchen]);

  const handleCategorySubmit = async () => {
    const data = {
      ...categoryForm,
      displayOrder: parseInt(categoryForm.displayOrder.toString()),
    };

    if (editingCategory) {
      await updateCategory({ id: editingCategory.id, data });
    } else {
      await createCategory(data);
    }

    setIsCategoryDialogOpen(false);
    resetCategoryForm();
  };

  const handleKitchenSubmit = async () => {
    if (!kitchenForm.category) {
      alert("Please select a category");
      return;
    }

    const data = {
      category: parseInt(kitchenForm.category),
      name: kitchenForm.name,
      location: kitchenForm.location,
      maxCapacity: kitchenForm.maxCapacity ? parseInt(kitchenForm.maxCapacity) : null,
    };

    if (editingKitchen) {
      await updateKitchen({ id: editingKitchen.id, data });
    } else {
      await createKitchen(data);
    }

    setIsKitchenDialogOpen(false);
    resetKitchenForm();
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
      description: "",
      isActive: true,
      displayOrder: 0,
    });
    setEditingCategory(null);
  };

  const resetKitchenForm = () => {
    setKitchenForm({
      category: "",
      name: "",
      location: "",
      maxCapacity: "",
    });
    setEditingKitchen(null);
  };

  const handleEditCategory = (category: KitchenCategory) => {
    setCategoryForm({
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      displayOrder: category.displayOrder,
    });
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const handleEditKitchen = (kitchen: Kitchen) => {
    setKitchenForm({
      category: typeof kitchen.category === 'object' ? kitchen.category.id.toString() : kitchen.category.toString(),
      name: kitchen.name,
      location: kitchen.location,
      maxCapacity: kitchen.maxCapacity?.toString() || "",
    });
    setEditingKitchen(kitchen);
    setIsKitchenDialogOpen(true);
  };

  const handleKitchenDoubleClick = async (kitchen: Kitchen) => {
    setSelectedKitchen(kitchen);
    setActiveTab("order-items");
    await fetchKitchenOrderItems(kitchen.id);
  };

  const fetchKitchenOrderItems = async (kitchenId: number) => {
    try {
      setIsLoadingOrderItems(true);
      const response = await ordersApi.getOrderItemsList({
        order_item__kitchen: kitchenId,
        page_size: 100,
      });

      if (response.success && response.data) {
        setKitchenOrderItems(response.data);
      } else {
        setKitchenOrderItems([]);
      }
    } catch (error) {
      console.error("Error fetching kitchen order items:", error);
      setKitchenOrderItems([]);
    } finally {
      setIsLoadingOrderItems(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="sticky top-0 z-10 pb-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Kitchen Management</h1>
      </div>

      <div className="flex gap-2 border-b border-border">
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
          onClick={() => setActiveTab("kitchens")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "kitchens"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Kitchens
        </button>
        {selectedKitchen && (
          <button
            onClick={() => setActiveTab("order-items")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "order-items"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ChefHat className="w-4 h-4 mr-1 inline" />
            {selectedKitchen.name} Orders
          </button>
        )}
      </div>

      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary text-primary-foreground w-full md:w-auto"
                  onClick={resetCategoryForm}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Name</Label>
                    <Input
                      id="categoryName"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-background text-foreground border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryDescription">Description</Label>
                    <Textarea
                      id="categoryDescription"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-background text-foreground border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayOrder">Display Order</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={categoryForm.displayOrder}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                      className="bg-background text-foreground border-border"
                    />
                  </div>
                  <Button
                    onClick={handleCategorySubmit}
                   className="w-full"
                  >
                    {editingCategory ? "Update" : "Create"} Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-card border-border overflow-hidden">
            <CardHeader>
              <CardTitle>Kitchen Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-foreground">Name</TableHead>
                      <TableHead className="text-foreground">Description</TableHead>
                      <TableHead className="text-foreground">Order</TableHead>
                      <TableHead className="text-foreground">Status</TableHead>
                      <TableHead className="text-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id} className="border-border hover:bg-secondary/50">
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-muted-foreground">{category.description}</TableCell>
                        <TableCell>{category.displayOrder}</TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            category.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}>
                            {category.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "kitchens" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isKitchenDialogOpen} onOpenChange={setIsKitchenDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary text-primary-foreground w-full md:w-auto"
                  onClick={resetKitchenForm}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Kitchen
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>
                    {editingKitchen ? "Edit Kitchen" : "Add New Kitchen"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="kitchenCategory">Category</Label>
                    <Select
                      value={kitchenForm.category}
                      onValueChange={(value) => setKitchenForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kitchenName">Name</Label>
                    <Input
                      id="kitchenName"
                      value={kitchenForm.name}
                      onChange={(e) => setKitchenForm(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-background text-foreground border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kitchenLocation">Location</Label>
                    <Input
                      id="kitchenLocation"
                      value={kitchenForm.location}
                      onChange={(e) => setKitchenForm(prev => ({ ...prev, location: e.target.value }))}
                      className="bg-background text-foreground border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxCapacity">Max Capacity (Optional)</Label>
                    <Input
                      id="maxCapacity"
                      type="number"
                      value={kitchenForm.maxCapacity}
                      onChange={(e) => setKitchenForm(prev => ({ ...prev, maxCapacity: e.target.value }))}
                      className="bg-background text-foreground border-border"
                    />
                  </div>
                  <Button
                    onClick={handleKitchenSubmit}
                   className="w-full"
                  >
                    {editingKitchen ? "Update" : "Create"} Kitchen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-card border-border overflow-hidden">
            <CardHeader>
              <CardTitle>Kitchens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-foreground">Name</TableHead>
                      <TableHead className="text-foreground">Category</TableHead>
                      <TableHead className="text-foreground">Location</TableHead>
                      <TableHead className="text-foreground">Max Capacity</TableHead>
                      <TableHead className="text-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kitchens.map((kitchen) => (
                      <TableRow
                        key={kitchen.id}
                        className="border-border hover:bg-secondary/50 cursor-pointer"
                        onDoubleClick={() => handleKitchenDoubleClick(kitchen)}
                        title="Double-click to view order items"
                      >
                        <TableCell className="font-medium">{kitchen.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {typeof kitchen.category === 'object' ? kitchen.category.name : kitchen.category || 'No Category'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{kitchen.location}</TableCell>
                        <TableCell>{kitchen.maxCapacity || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditKitchen(kitchen);
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "order-items" && selectedKitchen && (
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Kitchen Wise Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kitchenFilter">Kitchen</Label>
                  <Select
                    value={filters.kitchenId}
                    onValueChange={async (value) => {
                      setFilters(prev => ({ ...prev, kitchenId: value }));
                      const kitchen = kitchens.find(k => k.id.toString() === value);
                      if (kitchen) {
                        setSelectedKitchen(kitchen);
                        await fetchKitchenOrderItems(kitchen.id);
                      }
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select Kitchen" />
                    </SelectTrigger>
                    <SelectContent>
                      {kitchens.map((kitchen) => (
                        <SelectItem key={kitchen.id} value={kitchen.id.toString()}>
                          {kitchen.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statusFilter">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="served">Served</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dietaryFilter">Dietary Type</Label>
                  <Select
                    value={filters.dietaryType}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, dietaryType: value }))}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="veg">🥬 Veg</SelectItem>
                      <SelectItem value="non_veg">🍖 Non-Veg</SelectItem>
                      <SelectItem value="vegan">🌱 Vegan</SelectItem>
                      <SelectItem value="gluten_free">🌾 Gluten-Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setFilters(prev => ({ ...prev, status: "all", dietaryType: "all" }))}
                    className="text-muted-foreground"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Order Items for {selectedKitchen.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Double-clicked kitchen to view all order items assigned to this kitchen
              </p>
            </CardHeader>
            <CardContent>
              {(() => {
                const filteredItems = kitchenOrderItems.filter(item => {
                  if (filters.status !== "all" && item.status !== filters.status) return false;
                  if (filters.dietaryType !== "all" && item.dietaryType !== filters.dietaryType) return false;
                  return true;
                });

                return isLoadingOrderItems ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading order items...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{kitchenOrderItems.length === 0 ? "No order items found for this kitchen" : "No items match the current filters"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-foreground">Order #</TableHead>
                        <TableHead className="text-foreground">Item</TableHead>
                        <TableHead className="text-foreground">Quantity</TableHead>
                        <TableHead className="text-foreground">Status</TableHead>
                        <TableHead className="text-foreground">Dietary Type</TableHead>
                        <TableHead className="text-foreground">Table</TableHead>
                        <TableHead className="text-foreground">Prepared At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <TableRow key={item.id} className="border-border hover:bg-secondary/50">
                          <TableCell className="font-medium">#{item.order}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.orderItem ? (typeof item.orderItem === "object" ? item.orderItem.name : item.orderItem) : "Unknown Item"}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.status === "preparing"
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                : item.status === "ready"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : item.status === "served"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            }`}>
                              {item.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.dietaryType === "veg" && "🥬 Veg"}
                            {item.dietaryType === "non_veg" && "🍖 Non-Veg"}
                            {item.dietaryType === "vegan" && "🌱 Vegan"}
                            {item.dietaryType === "gluten_free" && "🌾 Gluten-Free"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.tableNumber || "N/A"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.preparedAt ? new Date(item.preparedAt).toLocaleString() : "Not started"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}