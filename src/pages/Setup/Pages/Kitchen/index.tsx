"use client";

import { useState, useEffect, useCallback } from "react";
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
import { privateApiInstance } from "@/Utils/ky";
import type { PaginatedApiResponse, Kitchen, KitchenCategory, OrderItem } from "@/types/api";

export default function KitchenPage() {
  const [activeTab, setActiveTab] = useState<"categories" | "kitchens" | "order-items">("categories");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isKitchenDialogOpen, setIsKitchenDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KitchenCategory | null>(null);
  const [editingKitchen, setEditingKitchen] = useState<Kitchen | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<KitchenCategory | null>(null);
  const [selectedKitchen, setSelectedKitchen] = useState<Kitchen | null>(null);
  const [kitchenOrderItems, setKitchenOrderItems] = useState<OrderItem[]>([]);
  const [isLoadingOrderItems, setIsLoadingOrderItems] = useState(false);
  const [filters, setFilters] = useState({
    kitchenId: "",
    status: "all",
    dietaryType: "all",
  });
  const [allKitchensList, setAllKitchensList] = useState<Kitchen[]>([]);

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

  const { data: categoriesData } = useKitchenCategories(activeTab === "categories" || activeTab === "kitchens");
  const { data: kitchensData } = useKitchens(
    activeTab === "kitchens",
    selectedCategoryFilter ? { category: selectedCategoryFilter.id } : undefined
  );
  const { mutateAsync: createCategory } = useCreateKitchenCategory();
  const { mutateAsync: updateCategory } = useUpdateKitchenCategory();
  const { mutateAsync: createKitchen } = useCreateKitchen();
  const { mutateAsync: updateKitchen } = useUpdateKitchen();

  const categories = categoriesData?.data ?? [];
  const kitchens = (kitchensData?.data ?? []).filter((kitchen) => {
    if (!selectedCategoryFilter) {
      return true;
    }

    if (typeof kitchen.category === "object") {
      return kitchen.category.id === selectedCategoryFilter.id;
    }

    return (
      kitchen.category?.toString() === selectedCategoryFilter.id.toString() ||
      kitchen.category?.toString().toLowerCase() === selectedCategoryFilter.name.toLowerCase()
    );
  });

  useEffect(() => {
    if (selectedKitchen) {
      setFilters(prev => ({ ...prev, kitchenId: selectedKitchen.id.toString() }));
    }
  }, [selectedKitchen]);

  useEffect(() => {
    const fetchKitchens = async () => {
      try {
        const response = await privateApiInstance.get("core-app/kitchen/list").json() as PaginatedApiResponse<Kitchen>;
        setAllKitchensList(response.data || []);
      } catch (error) {
        console.error("Error fetching kitchens:", error);
        setAllKitchensList([]);
      }
    };
    fetchKitchens();
  }, []);

  useEffect(() => {
    if (filters.kitchenId) {
      const kitchen = allKitchensList.find(k => k.id.toString() === filters.kitchenId);
      setSelectedKitchen(kitchen || null);
    } else {
      setSelectedKitchen(null);
    }
  }, [filters.kitchenId, allKitchensList]);

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

  const handleCategoryDoubleClick = (category: KitchenCategory) => {
    setSelectedCategoryFilter(category);
    setActiveTab("kitchens");
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
    setFilters(prev => ({ ...prev, kitchenId: kitchen.id.toString() }));
    setActiveTab("order-items");
    await fetchKitchenOrderItems();
  };

  const fetchKitchenOrderItems = useCallback(async () => {
    if (!filters.kitchenId) {
      setKitchenOrderItems([]);
      setIsLoadingOrderItems(false);
      return;
    }

    try {
      setIsLoadingOrderItems(true);
      const params: { [key: string]: any } = {
        order_item__kitchen: parseInt(filters.kitchenId),
        page_size: 100,
      };

      if (filters.status !== "all") {
        params.status = filters.status;
      }

      if (filters.dietaryType !== "all") {
        params.dietary_type = filters.dietaryType;
      }

      const response = await ordersApi.getOrderItemsList(params);

      if (response.data) {
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
  }, [filters]);

  return (
    <div className="p-4 md:p-6 space-y-6 h-full overflow-hidden flex flex-col">
      <div className="sticky top-0 z-10 pb-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Kitchen Management</h1>
      </div>

      <div className="flex gap-2 border-b border-border justify-between items-center">
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
            onClick={() => {
              setSelectedCategoryFilter(null);
              setActiveTab("kitchens");
            }}
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

        {/* Add button aligned with tabs */}
        <div className="flex">
          {activeTab === "categories" && (
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary text-primary-foreground"
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
                    <Label htmlFor="categoryDisplayOrder">Display Order</Label>
                    <Input
                      id="categoryDisplayOrder"
                      type="number"
                      value={categoryForm.displayOrder}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                      className="bg-background text-foreground border-border"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="categoryIsActive"
                      checked={categoryForm.isActive}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="categoryIsActive">Active</Label>
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
          )}

          {activeTab === "kitchens" && (
            <Dialog open={isKitchenDialogOpen} onOpenChange={setIsKitchenDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary text-primary-foreground"
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
                    <Label htmlFor="kitchenMaxCapacity">Max Capacity</Label>
                    <Input
                      id="kitchenMaxCapacity"
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
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "categories" && (
          <Card>
            <CardHeader>
              <CardTitle>Kitchen Categories</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <div className="mb-3 text-sm text-muted-foreground">
                Double-click a category to view kitchens in that category
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Display Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow
                      key={category.id}
                      onDoubleClick={() => handleCategoryDoubleClick(category)}
                      className="cursor-pointer hover:bg-muted"
                    >
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell>{category.displayOrder}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          category.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditCategory(category);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === "kitchens" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>
                  {selectedCategoryFilter
                    ? `${selectedCategoryFilter.name} Kitchens`
                    : "Kitchens"}
                </span>
                {selectedCategoryFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategoryFilter(null)}
                  >
                    Clear Filter
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Max Capacity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kitchens.map((kitchen) => (
                    <TableRow
                      key={kitchen.id}
                      onDoubleClick={() => handleKitchenDoubleClick(kitchen)}
                      className="cursor-pointer hover:bg-muted"
                    >
                      <TableCell>{kitchen.name}</TableCell>
                      <TableCell>
                        {typeof kitchen.category === 'object'
                          ? kitchen.category.name
                          : kitchen.category || 'N/A'}
                      </TableCell>
                      <TableCell>{kitchen.location}</TableCell>
                      <TableCell>{kitchen.maxCapacity || 'N/A'}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditKitchen(kitchen)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {kitchens.length > 0 && (
                <div className="mt-4 text-sm text-muted-foreground">
                  Double-click a kitchen to view its orders
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "order-items" && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedKitchen ? `${selectedKitchen.name} Orders` : "Order Items"}
              </CardTitle>
              {selectedKitchen && (
                <div className="flex gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="statusFilter">Status:</Label>
                    <select
                      id="statusFilter"
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="h-8 rounded border border-border bg-background px-2 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="served">Served</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                   <div className="flex items-center gap-2">
                     <Label htmlFor="dietaryFilter">Dietary Type:</Label>
                     <select
                       id="dietaryFilter"
                       value={filters.dietaryType}
                       onChange={(e) => setFilters(prev => ({ ...prev, dietaryType: e.target.value }))}
                       className="h-8 rounded border border-border bg-background px-2 text-sm"
                     >
                       <option value="all">All Types</option>
                       <option value="vegetarian">Vegetarian</option>
                       <option value="non-vegetarian">Non-Vegetarian</option>
                       <option value="vegan">Vegan</option>
                     </select>
                   </div>
                   <div className="flex items-center gap-2">
                     <Label htmlFor="kitchenFilter">Kitchen:</Label>
                     <select
                       id="kitchenFilter"
                       value={filters.kitchenId}
                       onChange={(e) => setFilters(prev => ({ ...prev, kitchenId: e.target.value }))}
                       className="h-8 rounded border border-border bg-background px-2 text-sm"
                     >
                       <option value="">All Kitchens</option>
                      {allKitchensList.map((kitchen) => (
                        <option key={kitchen.id} value={kitchen.id.toString()}>{kitchen.name}</option>
                      ))}
                     </select>
                   </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {isLoadingOrderItems ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : selectedKitchen ? (
                kitchenOrderItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dietary Type</TableHead>
                        <TableHead>Spice Level</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kitchenOrderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>#{item.order}</TableCell>
                          <TableCell>{item.menu_item?.name || 'N/A'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              item.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                              item.status === 'ready' ? 'bg-green-100 text-green-800' :
                              item.status === 'served' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.status || 'Unknown'}
                            </span>
                          </TableCell>
                          <TableCell>{item.dietary_type || 'N/A'}</TableCell>
                          <TableCell>{item.spice_level || 'N/A'}</TableCell>
                          <TableCell>{item.special_instructions || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No order items found for this kitchen
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a kitchen to view its orders
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
