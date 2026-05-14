"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Trash2, Edit2, Loader2, Eye, EyeOff, Search } from "lucide-react";
import { fetchUsers, updateUser, createUser, type User, type UpdateUserData, type CreateUserData, type UserFilters } from "../Authentication/Store/api";

export default function UsersPage() {
  const uniqueValues = (users: User[], key: keyof User) =>
    Array.from(new Set(users.map((user) => user[key]).filter(Boolean))).sort();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<UserFilters>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    email: "",
    mobile_no: "",
    user_type: "waiter",
    is_active: true,
    password: "",
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await fetchUsers(filters);
        if (response.success && response.data) {
          setUsers(response.data);
        } else {
          setError(response.message || "Failed to load users");
        }
      } catch (err) {
        setError("Failed to load users");
        console.error("Error loading users:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [filters]);



  const userTypes = uniqueValues(users, "userType");
  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.length - activeUsers;
  const stats = [
    { label: "Total Users", value: users.length.toString() },
    { label: "Active Users", value: activeUsers.toString() },
    { label: "Inactive Users", value: inactiveUsers.toString() },
    { label: "User Types", value: userTypes.length.toString() },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev, username: query || undefined }));
  };

  const handleFilterChange = (key: keyof UserFilters, value: string | boolean | number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };



  const handleSubmit = async () => {
    try {
      if (isCreateMode) {
        setCreating(true);
        const createData: CreateUserData = {
          username: formData.first_name, // Using first_name as username for now
          email: formData.email || undefined,
          password: formData.password || "defaultpassword123", // Use provided password
          firstName: formData.first_name,
          mobileNo: formData.mobile_no,
          userType: formData.user_type,
          isActive: formData.is_active,
        };

        const response = await createUser(createData);
        if (response.success && response.data) {
          setUsers([...users, response.data]);
          setIsCreateMode(false);
          setFormData({ first_name: "", email: "", mobile_no: "", user_type: "waiter", is_active: true, password: "" });
          setOpen(false);
        } else {
          setError(response.message || "Failed to create user");
        }
      } else if (editingId) {
        setUpdating(true);
        const updateData: UpdateUserData = {
          firstName: formData.first_name,
          email: formData.email,
          mobileNo: formData.mobile_no,
          userType: formData.user_type,
          isActive: formData.is_active,
          ...(formData.password && { password: formData.password }),
        };

        const response = await updateUser(editingId, updateData);
        if (response.success && response.data) {
          setUsers(users.map((u) => (u.id === editingId ? response.data! : u)));
          setEditingId(null);
          setFormData({ first_name: "", email: "", mobile_no: "", user_type: "waiter", is_active: true, password: "" });
          setOpen(false);
        } else {
          setError(response.message || "Failed to update user");
        }
      }
    } catch (err) {
      setError(`Failed to ${isCreateMode ? 'create' : 'update'} user`);
      console.error(`Error ${isCreateMode ? 'creating' : 'updating'} user:`, err);
    } finally {
      setUpdating(false);
      setCreating(false);
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      first_name: user.username || "",
      email: user.email || "",
      mobile_no: user.mobileNo || "",
      user_type: user.userType || "waiter",
      is_active: user.isActive,
      password: "",
    });
    setEditingId(user.id);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setFormData({
      first_name: "",
      email: "",
      mobile_no: "",
      user_type: "waiter",
      is_active: true,
      password: "",
    });
    setIsFormOpen(true);
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  return (
    <div className="flex h-screen min-h-0 flex-col bg-background p-6 text-foreground">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Users Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage user accounts and permissions.
            </p>
          </div>
          <Button onClick={handleCreate}>Add User</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="gap-2 rounded-md py-4 shadow-none">
              <CardContent className="max-h-none px-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="min-h-0 flex-1 gap-0 rounded-md shadow-none">
          <CardContent className="flex max-h-none min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search users by username"
                  className="pl-9 shadow-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
                <Select value={filters.user_type || "all"} onValueChange={(value) => handleFilterChange("user_type", value === "all" ? undefined : value)}>
                  <SelectTrigger className="w-full min-w-40 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="shadow-none">
                    <SelectItem value="all">All Types</SelectItem>
                    {userTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.is_active === undefined ? "all" : filters.is_active ? "active" : "inactive"} onValueChange={(value) => handleFilterChange("is_active", value === "all" ? undefined : value === "active" ? true : false)}>
                  <SelectTrigger className="w-full min-w-40 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="shadow-none">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-8 text-sm text-muted-foreground">
                Loading users...
              </div>
            ) : error ? (
              <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-8 text-sm text-destructive">
                {error}
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto rounded-md border">
  <div className="sticky top-0 z-10 grid min-w-[720px] grid-cols-[2fr_2fr_1.5fr_1fr_1fr_88px] border-b bg-background px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                  <span>Username</span>
                  <span>Email</span>
                  <span>Phone</span>
                  <span>User Type</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="group grid min-w-[720px] grid-cols-[2fr_2fr_1.5fr_1fr_1fr_88px] items-center border-b px-4 py-3 last:border-b-0"
                  >
                    <span className="text-sm font-medium">{user.username}</span>
                    <span className="text-sm text-muted-foreground">{user.email || "No email"}</span>
                    <span className="text-sm text-muted-foreground">{user.mobileNo || "No phone"}</span>
                    <Badge variant="outline" className="rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {user.userType}
                    </Badge>
                    <span className={`text-sm ${user.isActive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                    <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(user)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        aria-label={`Edit ${user.username}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${user.username}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && users.length === 0 && (
              <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-8 text-sm text-muted-foreground">
                No users found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md shadow-none">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit User" : "Create User"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="space-y-2">
              <Label htmlFor="first_name">Username</Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Enter username"
                className="shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                type="email"
                className="shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile_no">Phone</Label>
              <Input
                id="mobile_no"
                name="mobile_no"
                value={formData.mobile_no}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="shadow-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="user_type">User Type</label>
              <Select
                value={formData.user_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, user_type: value }))}
              >
                <SelectTrigger id="user_type" className="shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="shadow-none">
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cleaner">Cleaner</SelectItem>
                  <SelectItem value="cook">Cook</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password {!editingId ? "(Required)" : "(Optional)"}</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={editingId ? "Leave empty to keep current" : "Enter password"}
                  className="pr-10 shadow-none"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || updating}>
                {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {updating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingId ? "Update User" : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}