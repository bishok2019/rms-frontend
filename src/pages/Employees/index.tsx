"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Edit } from "lucide-react";
import { privateApiInstance } from "@/Utils/ky";
import { useKitchens } from "@/pages/Setup/Pages/Kitchen/Store/KitchenStores";

interface Employee {
  id: number;
  user: string;
  kitchenAssigned: string | null;
  position: string;
  department: string;
  salary: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    user: "",
    kitchenAssigned: "",
    position: "",
    department: "",
    salary: "",
  });
  const [isKitchenOpen, setIsKitchenOpen] = useState(false);
  const { data: kitchensData } = useKitchens(isKitchenOpen);
  const kitchens = useMemo(() => kitchensData?.data ?? [], [kitchensData]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await privateApiInstance.get("core-app/employee/list");
      const data = await response.json();
      setEmployees(data.data || data.results || data || []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await privateApiInstance.patch(`core-app/employee/update/${editingEmployee.id}`, {
          json: formData,
        });
      } else {
        await privateApiInstance.post("core-app/employee/create", {
          json: formData,
        });
      }
      fetchEmployees();
      setIsDialogOpen(false);
      setEditingEmployee(null);
      resetForm();
    } catch (error) {
      console.error("Failed to save employee:", error);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      user: employee.user,
      kitchenAssigned: employee.kitchenAssigned,
      position: employee.position,
      department: employee.department,
      salary: employee.salary,
    });
    setIsDialogOpen(true);
  };

  // const handleDelete = async (id: number) => {
  //   try {
  //     await privateApiInstance.delete(`core-app/employee/delete/${id}`);
  //     fetchEmployees();
  //   } catch (error) {
  //     console.error("Failed to delete employee:", error);
  //   }
  // };

  const resetForm = () => {
    setFormData({
      user: "",
      kitchenAssigned: "",
      position: "",
      department: "",
      salary: "",
    });
  };

  const openCreateDialog = () => {
    setEditingEmployee(null);
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground">Manage restaurant employees</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEmployee ? "Edit Employee" : "Add Employee"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="user">Username</Label>
                <Input
                  id="user"
                  value={formData.user}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="kitchenAssigned">Kitchen Assigned</Label>
                <Select value={formData.kitchenAssigned} onValueChange={(value) => setFormData({ ...formData, kitchenAssigned: value })} onOpenChange={setIsKitchenOpen}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select kitchen" />
                  </SelectTrigger>
                  <SelectContent>
                    {kitchens.map((kitchen) => (
                      <SelectItem key={kitchen.id} value={kitchen.id.toString()}>
                        {kitchen.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">{editingEmployee ? "Update" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {employees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{employee.user}</div>
                    <div className="text-sm text-muted-foreground">{employee.position}</div>
                    <div className="text-sm text-muted-foreground">{employee.department}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(employee)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {/* <Button variant="outline" size="sm" onClick={() => handleDelete(employee.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button> */}
                  </div>
                </div>
              ))}
              {employees.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No employees found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}