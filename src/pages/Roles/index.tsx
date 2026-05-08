"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { successFunction } from "@/components/common/Alert";
import { cn } from "@/lib/utils";
import { privateApiInstance } from "@/Utils/ky";
import type { PaginatedApiResponse } from "@/types/api";
import {
  fetchUsers,
  updateUser,
  type User,
} from "@/pages/Authentication/Store/api";
import { Check, ChevronDown, Loader2, Plus, RotateCcw, Save, Search, ShieldCheck, Users } from "lucide-react";

type PaginatedRoleResponse<T> = Partial<PaginatedApiResponse<T>> & {
  results?: T[];
  count?: number;
};

interface Permission {
  id: number;
  name: string;
  codeName?: string;
  codename?: string;
  category?: string | number | { id: number; name?: string };
  categoryId?: number;
}

interface PermissionCategory {
  id: number;
  name: string;
  description?: string;
}

type AccessUser = User & {
  permissions?: Array<Permission | number>;
};

interface Role {
  id: number;
  name: string;
  isActive: boolean;
  remarks: string | null;
  createdAt: string | null;
  permissions: Permission[];
}

interface RoleFormState {
  name: string;
  isActive: boolean;
  remarks: string;
  permissions: number[];
  assignedUserId: string;
}

const initialFormState: RoleFormState = {
  name: "",
  isActive: true,
  remarks: "",
  permissions: [],
  assignedUserId: "",
};

const getItems = <T,>(payload: PaginatedRoleResponse<T>): T[] => {
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const getUserLabel = (user: AccessUser) => user.username || user.email || `User ${user.id}`;

const getRoleFromPayload = (payload: unknown): Role | null => {
  if (!payload || typeof payload !== "object") return null;
  const response = payload as { data?: Role; id?: number };
  if (response.data?.id) return response.data;
  if (response.id) return response as Role;
  return null;
};

const getPermissionCode = (permission: Permission) =>
  permission.codeName ?? permission.codename ?? `ID ${permission.id}`;

const UserAvatar = ({ name }: { name: string }) => {
  const firstChar = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <span
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/15 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
    >
      {firstChar}
    </span>
  );
};

export default function RolesPage() {
  const [roleOptions, setRoleOptions] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([]);
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [rolesLoading, setRolesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [accessSaving, setAccessSaving] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [accessPermissionLoading, setAccessPermissionLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [selectedPermissionCategory, setSelectedPermissionCategory] = useState("all");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [accessPermissions, setAccessPermissions] = useState<Permission[]>([]);
  const [accessPermissionCount, setAccessPermissionCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleFormState>(initialFormState);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [collapsedPermissionCategories, setCollapsedPermissionCategories] = useState<string[]>([]);

  const roleEndpoint = "auth-app/role";

  const selectedPermissionNames = useMemo(() => {
    const selected = new Set(formData.permissions);
    return permissions.filter((permission) => selected.has(permission.id));
  }, [formData.permissions, permissions]);

  const selectedUser = useMemo(
    () => users.find((user) => String(user.id) === selectedUserId) ?? null,
    [selectedUserId, users]
  );

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => {
      const searchText = [
        user.username,
        user.email,
        user.mobileNo,
        user.userType,
        String(user.id),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText.includes(query);
    });
  }, [userSearch, users]);

  const selectedRolePermissionIds = useMemo(() => {
    const roleIds = new Set(selectedRoleIds);
    return new Set(
      roleOptions
        .filter((role) => roleIds.has(role.id))
        .flatMap((role) => role.permissions.map((permission) => permission.id))
    );
  }, [roleOptions, selectedRoleIds]);

  const getPermissionCategoryName = useCallback(
    (permission: Permission) => {
      if (typeof permission.category === "object" && permission.category?.name) {
        return permission.category.name;
      }

      if (typeof permission.category === "string" && permission.category.trim()) {
        return permission.category;
      }

      const categoryId =
        typeof permission.category === "number" ? permission.category : permission.categoryId;
      return (
        permissionCategories.find((category) => category.id === categoryId)?.name ??
        "Uncategorized"
      );
    },
    [permissionCategories]
  );

  const groupedAccessPermissions = useMemo(() => {
    return accessPermissions.reduce<Array<{ category: string; permissions: Permission[] }>>(
      (groups, permission) => {
        const category = getPermissionCategoryName(permission);
        const existingGroup = groups.find((group) => group.category === category);

        if (existingGroup) {
          existingGroup.permissions.push(permission);
        } else {
          groups.push({ category, permissions: [permission] });
        }

        return groups;
      },
      []
    );
  }, [accessPermissions, getPermissionCategoryName]);

  const selectedRoleCount = selectedRoleIds.length;
  const selectedPermissionCount = new Set([
    ...selectedPermissionIds,
    ...selectedRolePermissionIds,
  ]).size;

  const togglePermissionCategory = (category: string) => {
    setCollapsedPermissionCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const fetchRoleOptions = useCallback(async () => {
    setRolesLoading(true);
    try {
      const response = await privateApiInstance.get(`${roleEndpoint}/list`, {
        searchParams: { page: "1", limit: "500" },
      });
      const payload = (await response.json()) as PaginatedRoleResponse<Role>;
      setRoleOptions(getItems(payload));
    } finally {
      setRolesLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    setPermissionLoading(true);
    try {
      const response = await privateApiInstance.get(
        "auth-app/permissions/permission/list/dropdown",
        { searchParams: { limit: "500" } }
      );
      const payload = (await response.json()) as PaginatedRoleResponse<Permission>;
      setPermissions(getItems(payload));
    } finally {
      setPermissionLoading(false);
    }
  }, []);

  const fetchAccessPermissions = useCallback(async () => {
    setAccessPermissionLoading(true);
    try {
      const searchParams = new URLSearchParams({ limit: "500" });
      const searchValue = permissionSearch.trim();

      if (selectedPermissionCategory !== "all") {
        searchParams.set("category", selectedPermissionCategory);
      }

      if (searchValue) {
        searchParams.set("search", searchValue);
      }

      const response = await privateApiInstance.get(
        "auth-app/permissions/permission/list",
        { searchParams }
      );
      const payload = (await response.json()) as PaginatedRoleResponse<Permission>;
      const items = getItems(payload);

      setAccessPermissions(items);
      setAccessPermissionCount(payload.totalCount ?? payload.count ?? items.length);
    } finally {
      setAccessPermissionLoading(false);
    }
  }, [permissionSearch, selectedPermissionCategory]);

  const fetchPermissionCategories = useCallback(async () => {
    setCategoryLoading(true);
    try {
      const response = await privateApiInstance.get(
        "auth-app/permissions/permission-category/list",
        { searchParams: { limit: "500" } }
      );
      const payload = (await response.json()) as PaginatedRoleResponse<PermissionCategory>;
      setPermissionCategories(getItems(payload));
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  const getPermissionIdsForRoles = useCallback((roleIds: number[], sourceRoles = roleOptions) => {
    const roleIdSet = new Set(roleIds);
    return Array.from(
      new Set(
        sourceRoles
          .filter((role) => roleIdSet.has(role.id))
          .flatMap((role) => role.permissions.map((permission) => permission.id))
      )
    );
  }, [roleOptions]);

  const hydrateUserAccess = useCallback((user: AccessUser, sourceRoles = roleOptions) => {
    const nextRoleIds = user.roles?.map((role) => role.id) ?? [];
    const explicitPermissionIds =
      user.permissions
        ?.map((permission) =>
          typeof permission === "number" ? permission : permission.id
        )
        .filter((id): id is number => typeof id === "number") ?? [];

    setSelectedUserId(String(user.id));
    setSelectedRoleIds(nextRoleIds);
    setSelectedPermissionIds(
      explicitPermissionIds.length
        ? explicitPermissionIds
        : getPermissionIdsForRoles(nextRoleIds, sourceRoles)
    );
  }, [getPermissionIdsForRoles, roleOptions]);

  const fetchUserOptions = useCallback(async () => {
    setUsersLoading(true);
    try {
      const response = await fetchUsers();
      const nextUsers = (response.data ?? []) as AccessUser[];
      setUsers(nextUsers);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const handleUserSelect = (userId: string) => {
    const user = users.find((item) => String(item.id) === userId);
    if (!user) return;
    hydrateUserAccess(user);
  };

  const toggleUserRole = (roleId: number, checked: boolean) => {
    setSelectedRoleIds((current) => {
      const nextRoleIds = checked
        ? Array.from(new Set([...current, roleId]))
        : current.filter((id) => id !== roleId);

      setSelectedPermissionIds(getPermissionIdsForRoles(nextRoleIds));
      return nextRoleIds;
    });
  };

  const toggleUserPermission = (permissionId: number, checked: boolean) => {
    setSelectedPermissionIds((current) =>
      checked
        ? Array.from(new Set([...current, permissionId]))
        : current.filter((id) => id !== permissionId)
    );
  };

  const saveUserAccess = async () => {
    if (!selectedUser) return;

    setAccessSaving(true);
    try {
      const response = await updateUser(selectedUser.id, {
        roles: selectedRoleIds,
        permissions: selectedPermissionIds,
      });
      const updatedUser = response.data as AccessUser | undefined;

      setUsers((current) =>
        current.map((user) =>
          user.id === selectedUser.id
            ? updatedUser ?? {
                ...user,
                roles: roleOptions
                  .filter((role) => selectedRoleIds.includes(role.id))
                  .map((role) => ({ id: role.id, name: role.name })),
                permissions: selectedPermissionIds,
              }
            : user
        )
      );
      successFunction("User access updated successfully");
    } finally {
      setAccessSaving(false);
    }
  };

  useEffect(() => {
    fetchPermissionCategories();
    fetchPermissions();
    fetchRoleOptions();
    fetchUserOptions();
  }, [fetchPermissionCategories, fetchPermissions, fetchRoleOptions, fetchUserOptions]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchAccessPermissions();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [fetchAccessPermissions]);

  useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      hydrateUserAccess(users[0], roleOptions);
    }
  }, [hydrateUserAccess, roleOptions, selectedUserId, users]);

  useEffect(() => {
    if (
      selectedUser &&
      roleOptions.length > 0 &&
      selectedRoleIds.length > 0 &&
      selectedPermissionIds.length === 0
    ) {
      setSelectedPermissionIds(getPermissionIdsForRoles(selectedRoleIds, roleOptions));
    }
  }, [
    getPermissionIdsForRoles,
    roleOptions,
    selectedPermissionIds.length,
    selectedRoleIds,
    selectedUser,
  ]);

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormData(initialFormState);
    setDialogOpen(true);
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const togglePermission = (permissionId: number, checked: boolean) => {
    setFormData((current) => ({
      ...current,
      permissions: checked
        ? Array.from(new Set([...current.permissions, permissionId]))
        : current.permissions.filter((id) => id !== permissionId),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        isActive: formData.isActive,
        remarks: formData.remarks.trim() || null,
        permissions: formData.permissions,
      };

      if (editingRole) {
        await privateApiInstance
          .patch(`${roleEndpoint}/update/${editingRole.id}`, { json: payload })
          .json();
        if (formData.assignedUserId) {
          const user = users.find((item) => String(item.id) === formData.assignedUserId);
          const userRoleIds = user?.roles?.map((role) => role.id) ?? [];
          await updateUser(Number(formData.assignedUserId), {
            roles: Array.from(new Set([...userRoleIds, editingRole.id])),
          });
        }
        successFunction("Role updated successfully");
      } else {
        const createdPayload = await privateApiInstance
          .post(`${roleEndpoint}/create`, { json: payload })
          .json();
        const createdRole = getRoleFromPayload(createdPayload);
        if (formData.assignedUserId && createdRole?.id) {
          const user = users.find((item) => String(item.id) === formData.assignedUserId);
          const userRoleIds = user?.roles?.map((role) => role.id) ?? [];
          await updateUser(Number(formData.assignedUserId), {
            roles: Array.from(new Set([...userRoleIds, createdRole.id])),
          });
        }
        successFunction("Role created successfully");
      }

      setDialogOpen(false);
      await fetchRoleOptions();
      await fetchUserOptions();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
          <p className="text-sm text-muted-foreground">
            Create roles, control status, and assign permissions.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <AccessManagementNav />
        </div>
      </div> */}

      <Card className="mb-0 flex h-[calc(100vh-3rem)] gap-0 overflow-hidden rounded-md border-border bg-card text-card-foreground shadow-none">
        <CardHeader className="border-b border-border px-6 pb-0 pt-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg font-medium text-foreground">Role Management</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Select a user, assign roles, and fine-tune permissions.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {["Select User", "Assign Roles", "Set Permissions"].map((step, index) => {
                const isActive =
                  (index === 0 && selectedUser) ||
                  (index === 1 && selectedRoleCount > 0) ||
                  index === 2;

                return (
                  <div key={step} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition-colors hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400",
                        isActive
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] transition-colors",
                          isActive
                            ? "border-emerald-500 bg-emerald-600 text-white"
                            : "border-border group-hover:border-emerald-500"
                        )}
                      >
                        {index === 0 && selectedUser ? <Check className="h-3 w-3" /> : index + 1}
                      </span>
                      {step}
                    </span>
                    {index < 2 ? <span className="text-emerald-600 dark:text-emerald-400/50">/</span> : null}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 flex gap-0">
            <NavLink
              to="/roles"
              className="flex items-center gap-1.5 border-b-2 border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400"
            >
              <Users className="h-4 w-4" />
              Roles
            </NavLink>
            <NavLink
              to="/permissions"
              className="flex items-center gap-1.5 border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <ShieldCheck className="h-4 w-4" />
              Permissions
            </NavLink>
          </div>
        </CardHeader>

        <CardContent className="flex max-h-none min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div className="grid min-h-0 flex-1 divide-y divide-border overflow-hidden lg:grid-cols-[240px_minmax(280px,1fr)_280px] lg:divide-x lg:divide-y-0">
            <section className="flex min-h-0 flex-col overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Users
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {filteredUsers.length} of {users.length}
                  </span>
                </div>
                <div className="relative flex h-8 items-center rounded-md border border-border bg-background transition-colors focus-within:border-emerald-500">
                  <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    className="h-8 border-0 bg-transparent pl-8 text-xs text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                  />
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
                {usersLoading ? (
                  <div className="flex h-28 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading users...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">
                    No users found
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = String(user.id) === selectedUserId;

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleUserSelect(String(user.id))}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                          isSelected
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "text-foreground hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400"
                        )}
                      >
                        <UserAvatar name={getUserLabel(user)} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {getUserLabel(user)}
                          </span>
                          {user.email ? (
                            <span
                              className={cn(
                                "block truncate text-xs",
                                isSelected
                                  ? "text-emerald-600 dark:text-emerald-400/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {user.email}
                            </span>
                          ) : null}
                        </span>
                        {(user.roles?.length ?? 0) > 0 ? (
                          <span
                            className={cn(
                              "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                              isSelected ? "bg-emerald-600" : "bg-emerald-600"
                            )}
                          />
                        ) : (
                          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className="flex min-h-0 flex-col overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Roles
                </span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                    {selectedRoleCount} assigned
                  </span>
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {rolesLoading ? (
                  <div className="flex h-28 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading roles...
                  </div>
                ) : roleOptions.length === 0 ? (
                  <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">
                    No roles available
                  </div>
                ) : (
                  roleOptions.map((role) => {
                    const isSelected = selectedRoleIds.includes(role.id);
                    const previewPermissions = role.permissions.slice(0, 3);

                    return (
                      <div
                        key={role.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectedUser && toggleUserRole(role.id, !isSelected)}
                        onKeyDown={(event) => {
                          if ((event.key === "Enter" || event.key === " ") && selectedUser) {
                            event.preventDefault();
                            toggleUserRole(role.id, !isSelected);
                          }
                        }}
                        className={cn(
                          "rounded-[10px] border p-3.5 transition-colors",
                          selectedUser ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/15"
                            : "border-border bg-background hover:border-emerald-500 hover:bg-emerald-600/5"
                        )}
                      >
                        <div className="mb-2.5 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{role.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {role.permissions.length} permissions
                            </p>
                          </div>
                          <span
                            className={cn(
                              "flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border text-[11px]",
                              isSelected
                                ? "border-emerald-500 bg-emerald-600 text-white"
                                : "border-border text-transparent"
                            )}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {previewPermissions.map((permission) => (
                            <span
                              key={permission.id}
                              className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                            >
                              {getPermissionCategoryName(permission)}
                            </span>
                          ))}
                          {role.permissions.length > previewPermissions.length ? (
                            <span className="text-[10px] text-muted-foreground">
                              +{role.permissions.length - previewPermissions.length} more
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}

                <button
                  type="button"
                  onClick={openCreateDialog}
                  className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border bg-background p-3.5 text-sm text-muted-foreground transition-colors hover:border-emerald-500 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  <Plus className="h-4 w-4" />
                  Add Role
                </button>
              </div>
            </section>

            <section className="flex min-h-0 flex-col overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Permissions
                    </span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedPermissionCategory}
                      onValueChange={setSelectedPermissionCategory}
                      disabled={categoryLoading}
                    >
                      <SelectTrigger className="h-7 w-28 border-border bg-background px-2 text-xs text-muted-foreground shadow-none focus:border-emerald-500 focus:ring-0 data-[state=open]:border-emerald-500">
                        <SelectValue placeholder={categoryLoading ? "Loading..." : "All"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {permissionCategories.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="relative flex h-8 items-center rounded-md border border-border bg-background transition-colors focus-within:border-emerald-500">
                  <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    className="h-8 border-0 bg-transparent pl-8 text-xs text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
                    placeholder="Search permissions..."
                    value={permissionSearch}
                    onChange={(event) => setPermissionSearch(event.target.value)}
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                {accessPermissionLoading ? (
                  <div className="flex h-28 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading permissions...
                  </div>
                ) : accessPermissionCount === 0 ? (
                  <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">
                    No permissions available
                  </div>
                ) : (
                  groupedAccessPermissions.map((group) => {
                    const isCollapsed = collapsedPermissionCategories.includes(group.category);

                    return (
                    <div key={group.category} className="mb-4">
                      <button
                        type="button"
                        onClick={() => togglePermissionCategory(group.category)}
                        className="flex w-full items-center justify-between gap-2 border-b border-border pb-2 pt-1 text-left transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                        aria-expanded={!isCollapsed}
                      >
                        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                          {group.category}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          {group.permissions.length}
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 transition-transform",
                              isCollapsed ? "-rotate-90" : "rotate-0"
                            )}
                          />
                        </span>
                      </button>
                      {!isCollapsed ? group.permissions.map((permission) => {
                        const inheritedFromRole = selectedRolePermissionIds.has(permission.id);
                        const isChecked =
                          inheritedFromRole || selectedPermissionIds.includes(permission.id);

                        return (
                          <div
                            key={permission.id}
                            className={cn(
                              "flex items-center justify-between gap-3 border-b border-border py-2 transition-colors",
                              inheritedFromRole
                                ? "text-muted-foreground"
                                : "text-foreground hover:bg-emerald-600/5"
                            )}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-medium">
                                {permission.name}
                              </span>
                              <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                                {getPermissionCode(permission)}
                              </span>
                            </span>
                            <button
                              type="button"
                              disabled={!selectedUser || inheritedFromRole}
                              onClick={() => toggleUserPermission(permission.id, !isChecked)}
                              className={cn(
                                "relative h-[18px] w-8 flex-shrink-0 rounded-full transition-colors after:absolute after:top-[3px] after:h-3 after:w-3 after:rounded-full after:transition-all",
                                inheritedFromRole
                                  ? "cursor-default bg-emerald-500/15 opacity-70 after:left-[17px] after:bg-emerald-600"
                                  : isChecked
                                    ? "bg-emerald-600 after:left-[17px] after:bg-white"
                                    : "bg-muted after:left-[3px] after:bg-muted-foreground hover:bg-emerald-600/30"
                              )}
                              aria-label={`${isChecked ? "Disable" : "Enable"} ${permission.name}`}
                            />
                          </div>
                        );
                      }) : null}
                    </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="flex h-9 shrink-0 items-center justify-between gap-3 border-t border-border bg-background px-3 py-1">
            <div className="min-w-0 text-xs text-muted-foreground">
              {selectedUser ? (
                <div className="inline-flex max-w-full items-center rounded-md border border-border bg-card px-2.5 py-1 shadow-sm">
                  <span className="truncate leading-none">
                    <strong className="text-foreground">{getUserLabel(selectedUser)}</strong>
                    {" · "}
                    {selectedPermissionCount} permissions / {selectedRoleCount} roles
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center rounded-md border border-border bg-card px-2.5 py-1 shadow-sm">
                  <span className="leading-none">Select a user to manage access.</span>
                </div>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!selectedUser}
                onClick={() => selectedUser && hydrateUserAccess(selectedUser)}
                className="h-6 px-2 text-xs"
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={saveUserAccess}
                disabled={!selectedUser || accessSaving}
                className="h-6 bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-700 disabled:bg-emerald-600/60 disabled:text-white disabled:opacity-100 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-700 dark:disabled:bg-emerald-600/60 dark:disabled:text-white"
              >
                {accessSaving ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1 h-3.5 w-3.5" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update role details and permission access."
                : "Add a role and select the permissions it should include."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="assignedUserId">Assign to user</Label>
              <Select
                value={formData.assignedUserId}
                onValueChange={(value) =>
                  setFormData((current) => ({ ...current, assignedUserId: value }))
                }
              >
                <SelectTrigger id="assignedUserId" className="w-full">
                  <SelectValue placeholder="Select user for this role" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {getUserLabel(user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Role name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Manager"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleFormChange}
                placeholder="Optional notes for this role"
              />
            </div>

            <div className="flex items-center gap-3 rounded-md border p-3">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((current) => ({ ...current, isActive: checked === true }))
                }
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active role
              </Label>
            </div>

            <div className="grid gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Label>Permissions</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        permissions: permissions.map((permission) => permission.id),
                      }))
                    }
                    disabled={permissionLoading}
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData((current) => ({ ...current, permissions: [] }))
                    }
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {selectedPermissionNames.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPermissionNames.slice(0, 8).map((permission) => (
                    <Badge key={permission.id} variant="secondary">
                      {permission.name}
                    </Badge>
                  ))}
                  {selectedPermissionNames.length > 8 ? (
                    <Badge variant="secondary">
                      +{selectedPermissionNames.length - 8}
                    </Badge>
                  ) : null}
                </div>
              ) : null}

              <div className="max-h-[16.5rem] overflow-y-auto rounded-md border">
                {permissionLoading ? (
                  <div className="flex h-28 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading permissions...
                  </div>
                ) : permissions.length === 0 ? (
                  <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">
                    No permissions available
                  </div>
                ) : (
                  <div className="grid gap-1 p-2 sm:grid-cols-2">
                    {permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted"
                      >
                        <Checkbox
                          checked={formData.permissions.includes(permission.id)}
                          onCheckedChange={(checked) =>
                            togglePermission(permission.id, checked === true)
                          }
                        />
                        <span className="grid gap-0.5">
                          <span className="text-sm font-medium">{permission.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {permission.codeName ?? permission.codename ?? `ID ${permission.id}`}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !formData.name.trim()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingRole ? "Update Role" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
