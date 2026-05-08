"use client";

import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { privateApiInstance } from "@/Utils/ky";
import type { PaginatedApiResponse } from "@/types/api";
import { Info, Loader2, Search, ShieldCheck, Users } from "lucide-react";

interface PermissionCategory {
  id: number;
  name: string;
  description?: string;
}

interface Permission {
  id: number;
  name: string;
  codeName?: string;
  codename?: string;
  description?: string;
  category?: string | number;
}

const getItems = <T,>(payload: Partial<PaginatedApiResponse<T>> & { results?: T[] }): T[] => {
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const getPermissionCode = (permission: Permission) =>
  permission.codeName ?? permission.codename ?? `ID ${permission.id}`;

export default function PermissionsPage() {
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PermissionCategory | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categories;

    return categories.filter((category) =>
      [category.name, category.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [categories, categorySearch]);

  const filteredPermissions = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    if (!query) return permissions;

    return permissions.filter((permission) =>
      [permission.name, getPermissionCode(permission), permission.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [permissionSearch, permissions]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await privateApiInstance.get("auth-app/permissions/permission-category/list");
      const data = (await response.json()) as Partial<PaginatedApiResponse<PermissionCategory>>;
      const nextCategories = getItems(data);
      setCategories(nextCategories);

      if (!selectedCategory && nextCategories.length > 0) {
        const firstCategory = nextCategories[0];
        setSelectedCategory(firstCategory);
        fetchPermissions(firstCategory.id);
      }
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchPermissions = async (categoryId: number) => {
    setLoadingPermissions(true);
    try {
      const response = await privateApiInstance.get(
        `auth-app/permissions/permission/list?category=${categoryId}`
      );
      const data = (await response.json()) as Partial<PaginatedApiResponse<Permission>>;
      setPermissions(getItems(data));
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleCategoryClick = (category: PermissionCategory) => {
    setSelectedCategory(category);
    setPermissionSearch("");
    fetchPermissions(category.id);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <Card className="mb-0 flex h-[calc(100vh-3rem)] gap-0 overflow-hidden rounded-md border-border bg-card text-card-foreground shadow-none">
        <CardHeader className="border-b border-border px-6 pb-0 pt-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg font-medium text-foreground">Permissions</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                View system-defined permission categories and permission codes.
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>Read-only permissions can be assigned through roles.</span>
            </div>
          </div>

          <div className="mt-4 flex gap-0">
            <NavLink
              to="/roles"
              className="flex items-center gap-1.5 border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <Users className="h-4 w-4" />
              Roles
            </NavLink>
            <NavLink
              to="/permissions"
              className="flex items-center gap-1.5 border-b-2 border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400"
            >
              <ShieldCheck className="h-4 w-4" />
              Permissions
            </NavLink>
          </div>
        </CardHeader>

        <CardContent className="flex max-h-none min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div className="grid min-h-0 flex-1 divide-y divide-border overflow-hidden lg:grid-cols-[280px_minmax(320px,1fr)] lg:divide-x lg:divide-y-0">
            <section className="flex min-h-0 flex-col overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Categories
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {filteredCategories.length} of {categories.length}
                  </span>
                </div>
                <div className="relative flex h-8 items-center rounded-md border border-border bg-background transition-colors focus-within:border-emerald-500">
                  <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    className="h-8 border-0 bg-transparent pl-8 text-xs text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(event) => setCategorySearch(event.target.value)}
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {loadingCategories ? (
                  <div className="flex h-28 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading categories...
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">
                    No categories found
                  </div>
                ) : (
                  filteredCategories.map((category) => {
                    const isSelected = selectedCategory?.id === category.id;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryClick(category)}
                        className={cn(
                          "mb-1.5 flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                          isSelected
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "text-foreground hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400"
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{category.name}</span>
                          {category.description ? (
                            <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                              {category.description}
                            </span>
                          ) : null}
                        </span>
                        {isSelected ? (
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-600" />
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className="flex min-h-0 flex-col overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    {selectedCategory ? selectedCategory.name : "Permissions"}
                  </span>
                  <Badge variant="secondary" className="rounded-full text-[10px]">
                    {filteredPermissions.length} permissions
                  </Badge>
                </div>
                <div className="relative flex h-8 items-center rounded-md border border-border bg-background transition-colors focus-within:border-emerald-500">
                  <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    className="h-8 border-0 bg-transparent pl-8 text-xs text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
                    placeholder="Search permissions..."
                    value={permissionSearch}
                    onChange={(event) => setPermissionSearch(event.target.value)}
                    disabled={!selectedCategory}
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                {!selectedCategory ? (
                  <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">
                    Select a category to view permissions
                  </div>
                ) : loadingPermissions ? (
                  <div className="flex h-28 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading permissions...
                  </div>
                ) : filteredPermissions.length === 0 ? (
                  <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">
                    No permissions found for this category
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {filteredPermissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="rounded-md border border-border bg-background px-3 py-2.5 transition-colors hover:border-emerald-500 hover:bg-emerald-600/5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {permission.name}
                            </p>
                            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                              {getPermissionCode(permission)}
                            </p>
                            {permission.description ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            ) : null}
                          </div>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            Read only
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="flex h-9 shrink-0 items-center justify-between gap-3 border-t border-border bg-background px-3 py-1">
            <div className="inline-flex max-w-full items-center rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground shadow-sm">
              <span className="truncate leading-none">
                <strong className="text-foreground">{selectedCategory?.name ?? "No category selected"}</strong>
                {" · "}
                {filteredPermissions.length} permissions
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
