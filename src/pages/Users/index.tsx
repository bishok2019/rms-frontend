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
import { Trash2, Edit2, Loader2, Eye, EyeOff, User as UserIcon } from "lucide-react";
import { fetchUsers, updateUser, createUser, type User, type UpdateUserData, type CreateUserData, type UserFilters } from "../Authentication/Store/api";
import { useStore } from "@/hooks/use-store";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
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

  // Pagination logic
  const totalPages = Math.ceil(users.length / pageSize);
  const paginatedUsers = users.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
    <div className="p-8 space-y-8 min-h-screen h-screen flex flex-col bg-background">
      <div className="sticky top-0 z-10 pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Users Management</h1>
          <Button onClick={handleCreate} className="bg-primary text-primary-foreground">
            Add User
          </Button>
        </div>
      </div>
      {(open || isCreateMode) && (
        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
          <h3 className="text-lg font-semibold mb-4">
            {isCreateMode ? "Add New User" : "Edit User"}
          </h3>
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
                value={formData.email}
                onChange={handleChange}
                className="bg-background text-foreground border-border"
                placeholder="Enter email"
                type="email"
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
              <Label htmlFor="user_type">User Type</Label>
              <select
                id="user_type"
                name="user_type"
                value={formData.user_type}
                onChange={handleChange}
                className="h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="waiter">Waiter</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
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
            {isCreateMode && (
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
                    placeholder="Enter password"
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
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setIsCreateMode(false);
                  setEditingId(null);
                  setFormData({
                    first_name: "",
                    email: "",
                    mobile_no: "",
                    user_type: "waiter",
                    is_active: true,
                    password: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={creating || updating}>
                {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {updating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {isCreateMode ? "Create User" : "Update User"}
              </Button>
            </div>
          </div>
        </div>
      )}
      <Card className="border-none flex-1 flex flex-col min-h-0 h-[calc(100vh-64px)] max-w-7xl w-full mx-auto shadow-xl text-base">
        <CardHeader className="pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <select
              value={filters.user_type || ""}
              onChange={(e) => handleFilterChange("user_type", e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">All Types</option>
              <option value="waiter">Waiter</option>
              <option value="cleaner">Cleaner</option>
              <option value="manager">Manager</option>
              <option value="cook">Cook</option>
              <option value="system">System</option>
            </select>
            <select
              value={filters.is_active === undefined ? "" : filters.is_active ? "true" : "false"}
              onChange={(e) => handleFilterChange("is_active", e.target.value === "" ? undefined : e.target.value === "true")}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            {/* Add more filters if needed, or leave blank for grid alignment */}
            <div></div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 h-[calc(100vh-180px)] overflow-y-auto px-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Loading users...
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-destructive">
                    {error}
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-border"
                  >
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.mobileNo}</TableCell>
                    <TableCell>
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
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              Previous
            </Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}