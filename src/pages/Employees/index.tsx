"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { BriefcaseBusiness, Building2, DollarSign, Edit2, Grid2X2, List, Search, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { privateApiInstance } from "@/Utils/ky";
import { cn } from "@/lib/utils";
import { ListPagination } from "@/components/common/ListPagination";

interface Employee {
  id: number;
  user: string;
  employeeImage: string | null;
  kitchenAssigned: string | number | null;
  position: string;
  department: string;
  salary: string | null;
}

interface EmployeeDetail {
  id: number;
  user: number;
  position: string;
  department?: string;
  salary?: string | null;
  kitchenAssigned?: number | null;
}

interface ProfileUser {
  id: number;
  username: string;
  fullName: string;
  email?: string | null;
}

interface ProfileOption {
  id: number;
  user: ProfileUser;
}

interface EmployeeFormState {
  userId: string;
  position: string;
  department: string;
  salary: string;
}

type ViewMode = "grid" | "list";

const PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [10, 20, 40, 50];

type EmployeeStat = {
  label: string;
  value: string;
  icon: LucideIcon;
  cardClass: string;
  iconClass: string;
  valueClass: string;
};

const defaultFormState: EmployeeFormState = {
  userId: "",
  position: "",
  department: "",
  salary: "",
};

const departmentStyles: Record<string, string> = {
  Cleaning: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-800",
  Management: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800",
  Kitchen: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  Service: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800",
};

const positionStyles: Record<string, string> = {
  Cleaner: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-800",
  Manager: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800",
  Cook: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  Waiter: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800",
};

const extractListData = <T,>(payload: unknown): T[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const response = payload as { data?: unknown; results?: unknown };
  if (Array.isArray(response.data)) return response.data as T[];
  if (Array.isArray(response.results)) return response.results as T[];
  return [];
};

const extractObjectData = <T,>(payload: unknown): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
};

const getInitials = (name: string) =>
  name
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatSalary = (salary: string | null | undefined) => {
  const value = Number(salary);
  return Number.isFinite(value) ? `$${(value / 1000).toFixed(1)}k/yr` : "$0.0k/yr";
};

const uniqueValues = (employees: Employee[], key: "position" | "department") =>
  Array.from(new Set(employees.map((employee) => employee[key]).filter(Boolean))).sort();

const getEmployees = async (search: string) => {
  const params = new URLSearchParams({ limit: "100", ordering: "user" });
  if (search.trim()) params.set("search", search.trim());

  const response = await privateApiInstance
    .get(`core-app/employee/list?${params.toString()}`)
    .json<unknown>();

  return extractListData<Employee>(response);
};

const getProfileOptions = async () => {
  const response = await privateApiInstance
    .get("auth-app/get-all-profile-list?limit=100")
    .json<unknown>();

  return extractListData<ProfileOption>(response);
};

const getEmployee = async (id: number) => {
  const response = await privateApiInstance
    .get(`core-app/employee/retrieve/${id}`)
    .json<unknown>();

  return extractObjectData<EmployeeDetail>(response);
};

const saveEmployee = async ({
  employeeId,
  form,
}: {
  employeeId: number | null;
  form: EmployeeFormState;
}) => {
  const payload = {
    user: Number(form.userId),
    position: form.position.trim(),
    department: form.department.trim(),
    salary: form.salary.trim() || null,
    kitchenAssigned: null,
  };

  const request = employeeId
    ? privateApiInstance.patch(`core-app/employee/update/${employeeId}`, { json: payload })
    : privateApiInstance.post("core-app/employee/create", { json: payload });

  return request.json<unknown>();
};

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [formState, setFormState] = useState<EmployeeFormState>(defaultFormState);

  const { data: employees = [], isLoading, isFetching } = useQuery({
    queryKey: ["employees", searchQuery],
    queryFn: () => getEmployees(searchQuery),
  });

  const { data: profileOptions = [], isLoading: isLoadingProfiles } = useQuery({
    queryKey: ["employee-profile-options"],
    queryFn: getProfileOptions,
    staleTime: 5 * 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: saveEmployee,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsFormOpen(false);
      setEditingEmployeeId(null);
      setFormState(defaultFormState);
      toast.success(editingEmployeeId ? "Employee updated successfully." : "Employee created successfully.");
    },
  });

  const positions = useMemo(() => uniqueValues(employees, "position"), [employees]);
  const departments = useMemo(() => uniqueValues(employees, "department"), [employees]);

  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) => {
        const matchesPosition = positionFilter === "all" || employee.position === positionFilter;
        const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;
        return matchesPosition && matchesDepartment;
      }),
    [departmentFilter, employees, positionFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredEmployees.slice(startIndex, startIndex + pageSize);
  }, [filteredEmployees, pageSize, safeCurrentPage]);

  const stats = useMemo(() => {
    const totalSalary = employees.reduce((sum, employee) => sum + Number(employee.salary || 0), 0);
    return [
      {
        label: "Total Employees",
        value: employees.length.toString(),
        icon: UsersRound,
        cardClass: "border-l-sky-500 bg-sky-50/70 dark:bg-sky-950/20",
        iconClass: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
        valueClass: "text-sky-950 dark:text-sky-100",
      },
      {
        label: "Average Salary",
        value: formatSalary(String(totalSalary / Math.max(employees.length, 1))),
        icon: DollarSign,
        cardClass: "border-l-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20",
        iconClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        valueClass: "text-emerald-950 dark:text-emerald-100",
      },
      {
        label: "Departments",
        value: departments.length.toString(),
        icon: Building2,
        cardClass: "border-l-violet-500 bg-violet-50/70 dark:bg-violet-950/20",
        iconClass: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
        valueClass: "text-violet-950 dark:text-violet-100",
      },
      {
        label: "Positions",
        value: positions.length.toString(),
        icon: BriefcaseBusiness,
        cardClass: "border-l-amber-500 bg-amber-50/70 dark:bg-amber-950/20",
        iconClass: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        valueClass: "text-amber-950 dark:text-amber-100",
      },
    ] satisfies EmployeeStat[];
  }, [departments.length, employees, positions.length]);

  const openCreateForm = () => {
    setEditingEmployeeId(null);
    setFormState(defaultFormState);
    setIsFormOpen(true);
  };

  const openEditForm = async (employee: Employee) => {
    setEditingEmployeeId(employee.id);
    setIsFormOpen(true);
    setFormState({
      userId: "",
      position: employee.position,
      department: employee.department || "",
      salary: employee.salary || "",
    });

    try {
      const detail = await getEmployee(employee.id);
      setFormState({
        userId: String(detail.user),
        position: detail.position,
        department: detail.department || "",
        salary: detail.salary || "",
      });
    } catch (error) {
      console.error("Failed to retrieve employee:", error);
      toast.error("Failed to load employee details.");
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.userId || !formState.position.trim()) {
      toast.error("User and position are required.");
      return;
    }

    saveMutation.mutate({ employeeId: editingEmployeeId, form: formState });
  };

  const handleDelete = () => {
    toast.error("Employee delete API is not available in the current docs.");
  };

  const renderActions = (employee: Employee) => (
    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => openEditForm(employee)}
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        aria-label={`Edit ${employee.user}`}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        aria-label={`Delete ${employee.user}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="flex h-screen min-h-0 flex-col bg-background p-6 text-foreground">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Employee Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage staff records, compensation, and team structure.
            </p>
          </div>
          <Button onClick={openCreateForm}>Add Employee</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
            <Card key={stat.label} className={cn("gap-2 overflow-hidden rounded-md border-l-4 py-4 shadow-none", stat.cardClass)}>
              <CardContent className="max-h-none px-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-xs font-medium uppercase text-muted-foreground">{stat.label}</p>
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", stat.iconClass)}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className={cn("mt-2 text-2xl font-semibold", stat.valueClass)}>{stat.value}</p>
              </CardContent>
            </Card>
            );
          })}
        </div>

        <Card className="min-h-0 flex-1 gap-0 rounded-md shadow-none">
          <CardContent className="flex max-h-none min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search employees by name"
                  className="pl-9 shadow-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
                <Select
                  value={positionFilter}
                  onValueChange={(value) => {
                    setPositionFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full min-w-40 shadow-none">
                    <SelectValue placeholder="All Positions" />
                  </SelectTrigger>
                  <SelectContent className="shadow-none">
                    <SelectItem value="all">All Positions</SelectItem>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={departmentFilter}
                  onValueChange={(value) => {
                    setDepartmentFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full min-w-40 shadow-none">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent className="shadow-none">
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="inline-flex h-9 rounded-md border border-input p-0.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                    className="h-8 w-8"
                    aria-label={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
                  >
                    {viewMode === "grid" ? (
                      <List className="h-4 w-4" />
                    ) : (
                      <Grid2X2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-8 text-sm text-muted-foreground">
                Loading employees...
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {paginatedEmployees.map((employee) => (
                  <Card key={employee.id} className="group rounded-md py-0 shadow-none">
                    <CardContent className="max-h-none p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                              departmentStyles[employee.department] ?? "bg-muted text-foreground"
                            )}
                          >
                            {getInitials(employee.user)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold">{employee.user}</h3>
                            <p className="truncate text-xs text-muted-foreground">{employee.department || "No department"}</p>
                          </div>
                        </div>
                        {renderActions(employee)}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn("rounded-md", positionStyles[employee.position])}>
                          {employee.position}
                        </Badge>
                        {employee.department ? (
                          <Badge variant="outline" className={cn("rounded-md", departmentStyles[employee.department])}>
                            {employee.department}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-5 border-t pt-3">
                        <p className="text-xs text-muted-foreground">Salary</p>
                        <p className="text-lg font-semibold">{formatSalary(employee.salary)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto rounded-md border">
                <div className="sticky top-0 z-10 grid min-w-[720px] grid-cols-[2fr_1.2fr_1.2fr_1fr_88px] border-b bg-muted px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                  <span>Name</span>
                  <span>Position</span>
                  <span>Department</span>
                  <span>Salary</span>
                  <span className="text-right">Actions</span>
                </div>
                {paginatedEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="group grid min-w-[720px] grid-cols-[2fr_1.2fr_1.2fr_1fr_88px] items-center border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                          departmentStyles[employee.department] ?? "bg-muted text-foreground"
                        )}
                      >
                        {getInitials(employee.user)}
                      </div>
                      <span className="truncate text-sm font-medium">{employee.user}</span>
                    </div>
                    <Badge variant="outline" className={cn("rounded-md", positionStyles[employee.position])}>
                      {employee.position}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{employee.department || "No department"}</span>
                    <span className="text-sm font-medium">{formatSalary(employee.salary)}</span>
                    <div className="flex justify-end">{renderActions(employee)}</div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && filteredEmployees.length === 0 && (
              <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-8 text-sm text-muted-foreground">
                No employees match the current filters.
              </div>
            )}

            {!isLoading && filteredEmployees.length > 0 && (
              <ListPagination
                currentCount={paginatedEmployees.length}
                currentPage={safeCurrentPage}
                isLoading={isFetching}
                onNextPage={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                onPageSizeChange={(nextPageSize) => {
                  setCurrentPage(1);
                  setPageSize(nextPageSize);
                }}
                onPreviousPage={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                totalCount={filteredEmployees.length}
                totalPages={totalPages}
              />
            )}

            {isFetching && !isLoading ? (
              <p className="text-xs text-muted-foreground">Refreshing employee list...</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md shadow-none">
          <DialogHeader>
            <DialogTitle>{editingEmployeeId ? "Edit Employee" : "Create Employee"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="employee-user">User</label>
              <Select
                value={formState.userId}
                onValueChange={(value) => setFormState((form) => ({ ...form, userId: value }))}
                disabled={isLoadingProfiles}
              >
                <SelectTrigger id="employee-user" className="shadow-none">
                  <SelectValue placeholder={isLoadingProfiles ? "Loading users..." : "Select user"} />
                </SelectTrigger>
                <SelectContent className="shadow-none">
                  {profileOptions.map((profile) => (
                    <SelectItem key={profile.user.id} value={profile.user.id.toString()}>
                      {profile.user.fullName || profile.user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="employee-position">Position</label>
              <Input
                id="employee-position"
                value={formState.position}
                onChange={(event) => setFormState((form) => ({ ...form, position: event.target.value }))}
                placeholder="Manager"
                className="shadow-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="employee-department">Department</label>
              <Input
                id="employee-department"
                value={formState.department}
                onChange={(event) => setFormState((form) => ({ ...form, department: event.target.value }))}
                placeholder="Management"
                className="shadow-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="employee-salary">Salary</label>
              <Input
                id="employee-salary"
                type="number"
                min="0"
                step="0.01"
                value={formState.salary}
                onChange={(event) => setFormState((form) => ({ ...form, salary: event.target.value }))}
                placeholder="44200.00"
                className="shadow-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingEmployeeId ? "Update Employee" : "Create Employee"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
