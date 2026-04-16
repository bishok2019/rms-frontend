"use client";

import { Button } from "../ui/button";
import { Plus, Edit } from "lucide-react";
import type { Order } from "../../types/api";

interface OrderFormProps {
  order?: Order | null;
  onSuccess: (order: Order) => void;
  onCancel?: () => void;
}

export function OrderForm({ order, onSuccess, onCancel }: OrderFormProps) {
  const isEditing = !!order;

  // Prevent any potential crashes by adding error boundary
  try {
    // Simplified version for debugging
    if (isEditing) {
      return (
        <Button variant="outline" size="sm" onClick={() => console.log("Edit button clicked")}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Order
        </Button>
      );
    }

    return (
      <Button onClick={() => console.log("Create button clicked")}>
        <Plus className="h-4 w-4 mr-2" />
        Create Order
      </Button>
    );
  } catch (error) {
    console.error("OrderForm rendering error:", error);
    return (
      <div className="text-red-500 p-2 border border-red-300 rounded">
        Error rendering OrderForm: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }
}