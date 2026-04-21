import type React from "react";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Trash2, Edit2, Plus, AlertCircle } from "lucide-react";

const mockInventory = [
  {
    id: 1,
    name: "Rice",
    quantity: 50,
    unit: "kg",
    minStock: 10,
    category: "Grains",
    supplier: "Local Supplier",
  },
  {
    id: 2,
    name: "Tea Leaves",
    quantity: 5,
    unit: "kg",
    minStock: 5,
    category: "Beverages",
    supplier: "Tea Supplier",
  },
  {
    id: 3,
    name: "Milk",
    quantity: 80,
    unit: "liters",
    minStock: 20,
    category: "Dairy",
    supplier: "Dairy Farm",
  },
  {
    id: 4,
    name: "Eggs",
    quantity: 2,
    unit: "dozen",
    minStock: 5,
    category: "Protein",
    supplier: "Farm Fresh",
  },
];

export default function InventorySetup() {
  const [inventory, setInventory] = useState(mockInventory);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unit: "",
    minStock: "",
    category: "",
    supplier: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    if (editingId) {
      setInventory(
        inventory.map((i) =>
          i.id === editingId
            ? {
                ...i,
                ...formData,
                quantity: Number.parseInt(formData.quantity),
                minStock: Number.parseInt(formData.minStock),
              }
            : i
        )
      );
      setEditingId(null);
    } else {
      setInventory([
        ...inventory,
        {
          id: Math.max(...inventory.map((i) => i.id), 0) + 1,
          ...formData,
          quantity: Number.parseInt(formData.quantity),
          minStock: Number.parseInt(formData.minStock),
        },
      ]);
    }
    setFormData({
      name: "",
      quantity: "",
      unit: "",
      minStock: "",
      category: "",
      supplier: "",
    });
    setOpen(false);
  };

  const handleEdit = (item: (typeof mockInventory)[0]) => {
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      minStock: item.minStock.toString(),
      category: item.category,
      supplier: item.supplier,
    });
    setEditingId(item.id);
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    setInventory(inventory.filter((i) => i.id !== id));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="sticky top-0 z-10 pb-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Inventory Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary text-primary-foreground w-full md:w-auto"
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: "",
                  quantity: "",
                  unit: "",
                  minStock: "",
                  category: "",
                  supplier: "",
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full sm:max-w-lg bg-card border-border">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Inventory Item" : "Add New Item"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="kg, liters, etc"
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Min Stock</Label>
                  <Input
                    id="minStock"
                    name="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={handleChange}
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                    className="bg-background text-foreground border-border"
                  />
                </div>
              </div>
              <Button
                onClick={handleAdd}
                className="w-full bg-accent text-accent-foreground"
              >
                {editingId ? "Update" : "Add"} Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-foreground">Item</TableHead>
                  <TableHead className="text-foreground hidden md:table-cell">
                    Category
                  </TableHead>
                  <TableHead className="text-foreground">Stock</TableHead>
                  <TableHead className="text-foreground hidden lg:table-cell">
                    Supplier
                  </TableHead>
                  <TableHead className="text-foreground text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => {
                  const isLowStock = item.quantity < item.minStock;
                  return (
                    <TableRow
                      key={item.id}
                      className={`border-border ${
                        isLowStock
                          ? "bg-destructive/10"
                          : "hover:bg-secondary/50"
                      }`}
                    >
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {item.category}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isLowStock && (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                          <span>
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                        {item.supplier}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
