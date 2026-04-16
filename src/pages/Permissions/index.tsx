"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { privateApiInstance } from "@/Utils/ky";

interface PermissionCategory {
  id: number;
  name: string;
  description?: string;
}

interface Permission {
  id: number;
  name: string;
  codename: string;
  description?: string;
  category: number;
}

export default function PermissionsPage() {
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PermissionCategory | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  useEffect(() => {
    console.log("Permissions page mounted");
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      console.log("Fetching categories...");
      const response = await privateApiInstance.get("auth-app/permissions/permission-category/list");
      const data = await response.json();
      console.log("Categories response:", data);
      setCategories(data.results || data.data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchPermissions = async (categoryId: number) => {
    setLoadingPermissions(true);
    try {
      console.log("Fetching permissions for category:", categoryId);
      const response = await privateApiInstance.get(`auth-app/permissions/permission/list?category=${categoryId}`);
      const data = await response.json();
      console.log("Permissions response:", data);
      setPermissions(data.results || data.data || []);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleCategoryClick = (category: PermissionCategory) => {
    setSelectedCategory(category);
    fetchPermissions(category.id);
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Section */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCategories ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory?.id === category.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleCategoryClick(category)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissions Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCategory ? `Permissions for ${selectedCategory.name}` : "Select a Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCategory ? (
              <p className="text-muted-foreground">Click on a category to view its permissions</p>
            ) : loadingPermissions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {permissions.map((permission) => (
                  <div key={permission.id} className="p-3 border rounded-md">
                    <div className="font-medium">{permission.name}</div>
                    <div className="text-sm text-muted-foreground">{permission.codename}</div>
                    {permission.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {permission.description}
                      </div>
                    )}
                  </div>
                ))}
                {permissions.length === 0 && (
                  <p className="text-muted-foreground">No permissions found for this category</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}