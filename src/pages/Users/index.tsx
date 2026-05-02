"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Edit2, Loader2, Eye, EyeOff } from "lucide-react";
import { fetchUsers, updateUser, createUser, type User, type UpdateUserData, type CreateUserData, type UserFilters } from "../Authentication/Store/api";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<UserFilters>({});
  const [showPassword, setShowPassword] = useState(false);
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
          password: "defaultpassword123", // This should be handled better in production
          first_name: formData.first_name,
          mobile_no: formData.mobile_no,
          userType: formData.user_type,
          is_active: formData.is_active,
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
          first_name: formData.first_name,
          email: formData.email,
          mobile_no: formData.mobile_no,
          userType: formData.user_type,
          is_active: formData.is_active,
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
    setIsCreateMode(false);
    setOpen(true);
  };

  const handleCreate = () => {
    setFormData({ first_name: "", email: "", mobile_no: "", user_type: "waiter", is_active: true, password: "" });
    setIsCreateMode(true);
    setEditingId(null);
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  return (
    <div className="p-4 md:p-6 space-y-6 h-full overflow-hidden flex flex-col">
      <div className="sticky top-0 z-10 pb-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Users Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary text-primary-foreground w-full md:w-auto"
              onClick={handleCreate}
            >
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>
                {isCreateMode ? "Add New User" : "Edit User"}
              </DialogTitle>
              <DialogDescription>
                {isCreateMode
                  ? "Fill in the details to create a new user account."
                  : "Update the user information and save changes."
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Username</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="bg-background text-foreground border-border"
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-background text-foreground border-border"
                  placeholder="Enter email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile_no">Phone</Label>
                <Input
                  id="mobile_no"
                  name="mobile_no"
                  value={formData.mobile_no}
                  onChange={handleChange}
                  className="bg-background text-foreground border-border"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-background text-foreground border-border pr-10"
                    placeholder="Enter new password (optional)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user_type">User Type</Label>
                <select
                  id="user_type"
                  name="user_type"
                  value={formData.user_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md"
                >
                  <option value="waiter">Waiter</option>
                  <option value="cleaner">Cleaner</option>
                  <option value="manager">Manager</option>
                  <option value="cook">Cook</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="is_active">Status</Label>
                <select
                  id="is_active"
                  name="is_active"
                  value={formData.is_active ? "true" : "false"}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === "true" }))}
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={updating || creating}
                className="w-full"
              >
                {(updating || creating) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {creating ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  isCreateMode ? "Create User" : "Update User"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-background text-foreground border-border"
            />
          </div>
          <div className="w-full md:w-48 space-y-2">
            <Label htmlFor="user_type_filter">User Type</Label>
            <select
              id="user_type_filter"
              value={filters.user_type || ""}
              onChange={(e) => handleFilterChange("user_type", e.target.value)}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md"
            >
              <option value="">All Types</option>
              <option value="waiter">Waiter</option>
              <option value="cleaner">Cleaner</option>
              <option value="manager">Manager</option>
              <option value="cook">Cook</option>
              <option value="system">System</option>
            </select>
          </div>
          <div className="w-full md:w-48 space-y-2">
            <Label htmlFor="status_filter">Status</Label>
            <select
              id="status_filter"
              value={filters.is_active === undefined ? "" : filters.is_active ? "true" : "false"}
              onChange={(e) => handleFilterChange("is_active", e.target.value === "" ? undefined : e.target.value === "true")}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="bg-card border-border overflow-hidden">

        <CardContent>
          <div className="overflow-auto max-h-96">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-foreground">Username</TableHead>
                  <TableHead className="text-foreground hidden md:table-cell">
                    Email
                  </TableHead>
                  <TableHead className="text-foreground hidden lg:table-cell">
                    Phone
                  </TableHead>
                  <TableHead className="text-foreground hidden xl:table-cell">
                    User Type
                  </TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Loading users...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-border"
                    >
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {user.mobileNo}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs capitalize">
                          {user.userType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          user.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}