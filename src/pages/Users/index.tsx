"use client";

import type React from "react";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
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
import { ListPagination } from "@/components/common/ListPagination";
import {
  BadgeCheck,
  BriefcaseBusiness,
  ChefHat,
  ConciergeBell,
  Edit2,
  Eye,
  EyeOff,
  Loader2,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
} from "lucide-react";
import {
  fetchUsers,
  updateUser,
  createUser,
  fetchUserDashboard,
  type User,
  type UserDashboard,
  type UpdateUserData,
  type CreateUserData,
  type UserFilters,
} from "../Authentication/Store/api";

const PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 40, 50];

type SummaryTone = {
  card: string;
  icon: string;
  value: string;
};

type SummaryCard = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: SummaryTone;
};

const cardTones = {
  total: {
    card: "bg-sky-50/70 dark:bg-sky-950/20",
    icon: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    value: "text-sky-950 dark:text-sky-100",
  },
  active: {
    card: "bg-emerald-50/70 dark:bg-emerald-950/20",
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    value: "text-emerald-950 dark:text-emerald-100",
  },
  inactive: {
    card: "bg-rose-50/70 dark:bg-rose-950/20",
    icon: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    value: "text-rose-950 dark:text-rose-100",
  },
  types: {
    card: "bg-violet-50/70 dark:bg-violet-950/20",
    icon: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    value: "text-violet-950 dark:text-violet-100",
  },
  roles: {
    card: "bg-amber-50/70 dark:bg-amber-950/20",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    value: "text-amber-950 dark:text-amber-100",
  },
  cyan: {
    card: "bg-cyan-50/70 dark:bg-cyan-950/20",
    icon: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
    value: "text-cyan-950 dark:text-cyan-100",
  },
  orange: {
    card: "bg-orange-50/70 dark:bg-orange-950/20",
    icon: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    value: "text-orange-950 dark:text-orange-100",
  },
  lime: {
    card: "bg-lime-50/70 dark:bg-lime-950/20",
    icon: "bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300",
    value: "text-lime-950 dark:text-lime-100",
  },
  indigo: {
    card: "bg-indigo-50/70 dark:bg-indigo-950/20",
    icon: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    value: "text-indigo-950 dark:text-indigo-100",
  },
  slate: {
    card: "bg-slate-50/70 dark:bg-slate-900/30",
    icon: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    value: "text-slate-950 dark:text-slate-100",
  },
} satisfies Record<string, SummaryTone>;

const userTypeTones = [cardTones.cyan, cardTones.orange, cardTones.lime, cardTones.indigo, cardTones.slate];

// const userTypeIcons: Record<string, LucideIcon> = {
//   waiter: ConciergeBell,
//   cleaner: Sparkles,
//   manager: BriefcaseBusiness,
//   cook: ChefHat,
//   system: Settings,
// };

const formatUserTypeLabel = (type: string) =>
  type
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");

export default function UsersPage() {
  const uniqueValues = (users: User[], key: "userType") =>
    Array.from(
      new Set(users.map((user) => user[key]).filter((value): value is string => Boolean(value)))
    ).sort();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<UserFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [dashboardData, setDashboardData] = useState<UserDashboard | null>(null);
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

  const loadUserDashboard = async () => {
    try {
      const response = await fetchUserDashboard();
      setDashboardData(response ?? null);
    } catch (err) {
      console.error("Error loading user dashboard:", err);
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await fetchUsers({ ...filters, page: currentPage, limit: pageSize });
        if (response.success && response.data) {
          setUsers(response.data);
          setTotalUsers(response.totalCount ?? response.data.length);
          setTotalPages(response.totalPages ?? Math.max(1, Math.ceil(response.data.length / pageSize)));
          setCurrentPage(response.currentPage ?? currentPage);
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
  }, [currentPage, filters, pageSize]);

  useEffect(() => {
    loadUserDashboard();
  }, []);

  const pageUserTypeCounts = users.reduce<Record<string, number>>((counts, user) => {
    if (user.userType) {
      counts[user.userType] = (counts[user.userType] ?? 0) + 1;
    }
    return counts;
  }, {});
  const dashboardUserTypeCounts = dashboardData?.userTypeCounts ?? pageUserTypeCounts;
  const userTypes = Array.from(
    new Set([...uniqueValues(users, "userType"), ...Object.keys(dashboardUserTypeCounts)])
  ).sort();
  const activeUsers = dashboardData?.activeUsers ?? users.filter(u => u.isActive).length;
  const inactiveUsers = dashboardData?.inactiveUsers ?? users.length - activeUsers;
  const stats: SummaryCard[] = [
    { label: "Total Users", value: String(dashboardData?.totalUsers ?? totalUsers), icon: UsersRound, tone: cardTones.total },
    { label: "Active Users", value: String(activeUsers), icon: UserRoundCheck, tone: cardTones.active },
    { label: "Inactive Users", value: String(inactiveUsers), icon: UserRoundX, tone: cardTones.inactive },
    { label: "User Types", value: String(dashboardData?.totalUserTypes ?? userTypes.length), icon: Tags, tone: cardTones.types },
    { label: "Total Roles", value: String(dashboardData?.totalRoles ?? 0), icon: ShieldCheck, tone: cardTones.roles },
    // ...Object.entries(dashboardUserTypeCounts).map(([type, count], index) => ({
    //   label: `${formatUserTypeLabel(type)} Users`,
    //   value: String(count),
    //   // icon: userTypeIcons[type] ?? BadgeCheck,
    //   tone: userTypeTones[index % userTypeTones.length],
    // })),
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, username: query || undefined }));
  };

  const handleFilterChange = (key: keyof UserFilters, value: string | boolean | number | undefined) => {
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, [key]: value === "" ? undefined : value }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };



  const handleSubmit = async () => {
    try {
      if (!editingId) {
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
          setUsers((current) => [response.data!, ...current].slice(0, pageSize));
          setTotalUsers((current) => current + 1);
          setTotalPages((current) => Math.max(current, Math.ceil((totalUsers + 1) / pageSize)));
          loadUserDashboard();
          setFormData({ first_name: "", email: "", mobile_no: "", user_type: "waiter", is_active: true, password: "" });
          setIsFormOpen(false);
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
          loadUserDashboard();
          setEditingId(null);
          setFormData({ first_name: "", email: "", mobile_no: "", user_type: "waiter", is_active: true, password: "" });
          setIsFormOpen(false);
        } else {
          setError(response.message || "Failed to update user");
        }
      }
    } catch (err) {
      setError(`Failed to ${editingId ? 'update' : 'create'} user`);
      console.error(`Error ${editingId ? 'updating' : 'creating'} user:`, err);
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
    setTotalUsers((current) => Math.max(current - 1, 0));
    loadUserDashboard();
  };

  return (
    <div className="flex h-screen min-h-0 flex-col bg-background p-6 text-foreground">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
              <h1 className="text-2xl font-semibold md:text-xl">User Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage user accounts and permissions.
            </p>
          </div>
          <Button onClick={handleCreate}>Add User</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <Card key={stat.label} className={`gap-2 overflow-hidden rounded-md py-4 shadow-none ${stat.tone.card}`}>
              <CardContent className="max-h-none px-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-xs font-medium uppercase text-muted-foreground">{stat.label}</p>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${stat.tone.icon}`}>
                    <stat.icon className="h-4 w-4" />
                  </span>
                </div>
                <p className={`mt-2 text-2xl font-semibold ${stat.tone.value}`}>{stat.value}</p>
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

            {!loading && users.length > 0 && (
              <ListPagination
                currentCount={users.length}
                currentPage={currentPage}
                isLoading={loading}
                onNextPage={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                onPageSizeChange={(nextPageSize) => {
                  setCurrentPage(1);
                  setPageSize(nextPageSize);
                }}
                onPreviousPage={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                totalCount={totalUsers}
                totalPages={totalPages}
              />
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
