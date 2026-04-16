"use client";

import { useState } from "react";
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
import { Edit2, Plus } from "lucide-react";
import {
  useKitchenCategories,
  useCreateKitchenCategory,
  useUpdateKitchenCategory,
  useKitchens,
  useCreateKitchen,
  useUpdateKitchen,
} from "./Store/KitchenStores";
import type { KitchenCategory, Kitchen } from "@/types/api";

export default function KitchenPage() {
  const [activeTab, setActiveTab] = useState<"categories" | "kitchens">("categories");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isKitchenDialogOpen, setIsKitchenDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KitchenCategory | null>(null);
  const [editingKitchen, setEditingKitchen] = useState<Kitchen | null>(null);

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

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4 mb-6">
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
      </div>

      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-accent text-accent-foreground w-full md:w-auto"
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
                    className="w-full bg-accent text-accent-foreground"
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
                  className="bg-accent text-accent-foreground w-full md:w-auto"
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
                    className="w-full bg-accent text-accent-foreground"
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
                      <TableRow key={kitchen.id} className="border-border hover:bg-secondary/50">
                        <TableCell className="font-medium">{kitchen.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {kitchen.category || 'No Category'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{kitchen.location}</TableCell>
                        <TableCell>{kitchen.maxCapacity || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditKitchen(kitchen)}
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
    </div>
  );
}