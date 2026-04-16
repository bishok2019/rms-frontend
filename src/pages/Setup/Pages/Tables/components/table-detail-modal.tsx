import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { Section } from "@/types/api";

interface TableRecord {
  id: string;
  tableCode: string;
  area: string;
  capacity: number;
  canTakeMultipleOrder: boolean;
  remarks?: string;
  qrCode?: string;
}

interface TableDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableRecord | null;
  areas: Section[];
  onSave: (table: TableRecord) => void;
}

export function TableDetailModal({
  open,
  onOpenChange,
  table,
  areas,
  onSave,
}: TableDetailModalProps) {
  const [formData, setFormData] = useState<TableRecord>({
    id: "",
    tableCode: "",
    area: "",
    capacity: 4,
    canTakeMultipleOrder: false,
    remarks: "",
  });

  useEffect(() => {
    if (table) {
      setFormData(table);
    } else {
      setFormData({
        id: "",
        tableCode: "",
        area: areas?.[0]?.name || "",
        capacity: 4,
        canTakeMultipleOrder: false,
        remarks: "",
      });
    }
  }, [table, areas, open]);

  const handleSave = () => {
    if (!formData.tableCode.trim() || !formData.area) {
      alert("Please fill in all required fields");
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>{table ? "Edit Table" : "Add New Table"}</DialogTitle>
          <DialogDescription>
            {table
              ? "Update table details"
              : "Create a new table for your restaurant"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Table Code */}
          <div className="space-y-2">
            <Label htmlFor="tableCode">Table Code *</Label>
            <Input
              id="tableCode"
              placeholder="e.g., P1, A2"
              value={formData.tableCode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tableCode: e.target.value.toUpperCase(),
                })
              }
            />
          </div>

          {/* Area */}
          <div className="space-y-2">
            <Label htmlFor="area">Area *</Label>
            <Select
              value={formData.area}
              onValueChange={(value) =>
                setFormData({ ...formData, area: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {areas?.map((area) => (
                  <SelectItem key={area.id} value={area.name}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (Seats) *</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="20"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacity: Number.parseInt(e.target.value) || 1,
                })
              }
            />
          </div>

          {/* Multiple Order Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="multipleOrder"
              checked={formData.canTakeMultipleOrder}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  canTakeMultipleOrder: checked as boolean,
                })
              }
            />
            <Label
              htmlFor="multipleOrder"
              className="font-normal cursor-pointer"
            >
              Can take multiple orders
            </Label>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              placeholder="e.g., Window seat, Near kitchen..."
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={"default"} onClick={handleSave}>
            {table ? "Update Table" : "Add Table"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
