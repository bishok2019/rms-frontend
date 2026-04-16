"use client";

import { useForm } from "@tanstack/react-form";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useKitchens } from "../../Kitchen/Store/KitchenStores";
import type { Kitchen, MenuCategory, MenuItem } from "@/types/api";

interface CreateItemProps {
  item?: MenuItem;
  onSubmit: (data: Partial<MenuItem> | FormData) => void;
  closeRef?: React.RefObject<HTMLButtonElement | null>;
  categories: MenuCategory[];
}

function FieldInfo({ field }: { field: { state: { meta: { isTouched: boolean; errors: string[] }; isValidating: boolean } } }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <em className="text-red-500 text-sm">{field.state.meta.errors.join(",")}</em>
      ) : null}
      {field.state.meta.isValidating ? "Validating..." : null}
    </>
  );
}

const getRelationId = (value: MenuItem["category"] | MenuItem["kitchen"]): number | null => {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "object" && "id" in value) {
    return value.id;
  }

  return null;
};

const getRelationName = (value: MenuItem["category"] | MenuItem["kitchen"]): string => {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "name" in value) {
    return value.name;
  }

  return "";
};

export default function CreateItem({
  item,
  onSubmit,
  closeRef,
  categories,
}: CreateItemProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isKitchenOpen, setIsKitchenOpen] = useState(false);
  const { data: kitchensData } = useKitchens(isKitchenOpen);
  const kitchens = useMemo(() => {
    const list = kitchensData?.data ?? [];
    if (item?.kitchen && typeof item.kitchen === 'object' && 'id' in item.kitchen && !list.find(k => k.id === item.kitchen.id)) {
      list.push(item.kitchen as Kitchen);
    }
    return list;
  }, [kitchensData, item]);

  const selectedCategoryId = useMemo(() => {
    if (!item) {
      return categories[0]?.id ?? 1;
    }

    const directId = getRelationId(item.category);
    if (directId) {
      return directId;
    }

    const categoryName = getRelationName(item.category);
    if (categoryName) {
      const found = categories.find((c) => c.name === categoryName);
      if (found) {
        return found.id;
      }
    }

    return categories[0]?.id ?? 1;
  }, [item, categories]);

  const selectedKitchenValue = useMemo(() => {
    if (!item) {
      return "none";
    }

    const directId = getRelationId(item.kitchen);
    if (directId) {
      return directId.toString();
    }

    const kitchenName = getRelationName(item.kitchen);
    if (kitchenName) {
      const found = kitchens.find((k) => k.name === kitchenName);
      if (found) {
        return found.id.toString();
      }
    }

    return "none";
  }, [item, kitchens]);

  const defaultValues = useMemo(
    () => ({
      category: selectedCategoryId,
      name: item?.name || "",
      description: item?.description || "",
      price: item?.price?.toString() || "",
      discountPrice: item?.discountPrice?.toString() || "",
      photo: item?.photo || "",
      kitchen: selectedKitchenValue,
      isAvailable: item?.isAvailable ?? true,
      displayOrder: item?.displayOrder || 0,
      parent: item?.parent || null,
      isVariant: item?.isVariant || false,
    }),
    [item, selectedCategoryId, selectedKitchenValue]
  );

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      if (photoFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("category", value.category.toString());
        formData.append("name", value.name);
        formData.append("description", value.description);
        formData.append("price", value.price);
        if (value.discountPrice) {
          formData.append("discountPrice", value.discountPrice);
        }
        formData.append("photo", photoFile);
        if (value.kitchen && value.kitchen !== "none") {
          formData.append("kitchen", value.kitchen);
        }
        formData.append("isAvailable", value.isAvailable.toString());
        formData.append("displayOrder", value.displayOrder.toString());
        if (value.parent) {
          formData.append("parent", value.parent.toString());
        }
        formData.append("isVariant", value.isVariant.toString());

        onSubmit(formData);
      } else {
        // Use regular object for non-file data
        const formData = {
          category: value.category,
          name: value.name,
          description: value.description,
          price: parseFloat(value.price),
          discountPrice: value.discountPrice ? parseFloat(value.discountPrice) : null,
          photo: value.photo || undefined,
          kitchen:
            value.kitchen && value.kitchen !== "none"
              ? parseInt(value.kitchen, 10)
              : null,
          isAvailable: value.isAvailable,
          displayOrder: parseInt(value.displayOrder.toString(), 10) || 0,
          parent: value.parent,
          isVariant: value.isVariant,
        } as Record<string, unknown>;

        Object.keys(formData).forEach((key) => {
          if (formData[key] === undefined) {
            delete formData[key];
          }
        });

        onSubmit(formData as Partial<MenuItem>);
      }
      closeRef?.current?.click();
    },
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field
          name="category"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Category</Label>
              <Select
                value={field.state.value?.toString()}
                onValueChange={(value) => field.handleChange(parseInt(value, 10))}
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
              <FieldInfo field={field} />
            </div>
          )}
        />

        <form.Field
          name="kitchen"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Kitchen (Optional)</Label>
              <Select
                value={field.state.value || "none"}
                onValueChange={(value) => field.handleChange(value)}
                onOpenChange={setIsKitchenOpen}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a kitchen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No kitchen</SelectItem>
                  {kitchens.map((kitchen) => (
                    <SelectItem key={kitchen.id} value={kitchen.id.toString()}>
                      {kitchen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldInfo field={field} />
            </div>
          )}
        />

        <form.Field
          name="name"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Item Name</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="bg-background text-foreground border-border"
              />
              <FieldInfo field={field} />
            </div>
          )}
        />

        <form.Field
          name="description"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Description</Label>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="bg-background text-foreground border-border"
              />
              <FieldInfo field={field} />
            </div>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="price"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Price</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  step="0.01"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="bg-background text-foreground border-border"
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="discountPrice"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Discount Price (Optional)</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  step="0.01"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="bg-background text-foreground border-border"
                />
                <FieldInfo field={field} />
              </div>
            )}
          />
        </div>

        <form.Field
          name="displayOrder"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Display Order</Label>
              <Input
                id={field.name}
                name={field.name}
                type="number"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(parseInt(e.target.value, 10) || 0)}
                className="bg-background text-foreground border-border"
              />
              <FieldInfo field={field} />
            </div>
          )}
        />

        <div className="space-y-2">
          <Label htmlFor="photo">Photo</Label>
          <Input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            className="bg-background text-foreground border-border"
          />
          <p className="text-xs text-muted-foreground">
            Upload an image file for the menu item.
          </p>
        </div>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-accent text-accent-foreground"
            >
              {isSubmitting ? "Saving..." : item ? "Update Item" : "Create Item"}
            </Button>
          )}
        />
      </form>
    </div>
  );
}
