"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit2, User } from "lucide-react";

interface Employee {
  id: number;
  user: string;
  employeeImage: string;
  kitchenAssigned: null;
  position: string;
  department: string;
  salary: string;
}

const employeeData: Employee[] = [
  {
    id: 10,
    user: "admin10",
    employeeImage: "http://localhost:8001/media/default_images/profile.png",
    kitchenAssigned: null,
    position: "Cleaner",
    department: "Cleaning",
    salary: "42969.00",
  },
  {
    id: 9,
    user: "admin9",
    employeeImage: "http://localhost:8001/media/default_images/profile.png",
    kitchenAssigned: null,
    position: "Manager",
    department: "Management",
    salary: "20562.00",
  },
  {
    id: 8,
    user: "admin8",
    employeeImage: "http://localhost:8001/media/default_images/profile.png",
    kitchenAssigned: null,
    position: "Cook",
    department: "Cleaning",
    salary: "49582.00",
  },
  {
    id: 7,
    user: "admin7",
    employeeImage: "http://localhost:8001/media/default_images/profile.png",
    kitchenAssigned: null,
    position: "Cleaner",
    department: "Management",
    salary: "43358.00",
  },
  {
    id: 6,
    user: "admin6",
    employeeImage: "http://localhost:8001/media/default_images/profile.png",
    kitchenAssigned: null,
    position: "Cleaner",
    department: "Cleaning",
    salary: "46442.00",
  },
  {
    id: 5,
    user: "admin5",
    employeeImage: "http://localhost:8001/media/default_images/profile.png",
    kitchenAssigned: null,
    position: "Waiter",
    department: "Cleaning",
    salary: "26248.00",
  },
  {
    id: 4,
    user: "admin4",
    employeeImage: "http://localhost:8001/media/default_images/profile.png",
    kitchenAssigned: null,
    position: "Cook",
    department: "Cleaning",
    salary: "47825.00",
  },
  {
    id: 3,
    user: "admin3",
    employeeImage: "http://localhost:8001/media/default_images/profile.png",
    kitchenAssigned: null,
    position: "Waiter",
    department: "Service",
    salary: "20442.00",
  },
  {
    id: 2,
    user: "bishok",
    employeeImage: "http://localhost:8001/media/user_image/profile_takPHnT.jpg",
    kitchenAssigned: null,
    position: "Manager",
    department: "Management",
    salary: "24475.00",
  },
  {
    id: 1,
    user: "admin",
    employeeImage: "http://localhost:8001/media/user_image/profile.jpg",
    kitchenAssigned: null,
    position: "Cook",
    department: "Service",
    salary: "36117.00",
  },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(employeeData);
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = employee.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = positionFilter === "all" || employee.position === positionFilter;
    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;
    return matchesSearch && matchesPosition && matchesDepartment;
  });

  const handleDelete = (id: number) => {
    setEmployees(employees.filter((e) => e.id !== id));
  };

  const handleEdit = (employee: Employee) => {
    // Implement edit logic
    console.log("Edit employee", employee);
  };

  return (
    <div className="p-8 space-y-8 min-h-screen h-screen flex flex-col bg-background">
      <div className="sticky top-0 z-10 pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Employee Management</h1>
          <Button className="bg-primary text-primary-foreground">
            Add Employee
          </Button>
        </div>
      </div>

      <Card className="border-none flex-1 flex flex-col min-h-0 h-[calc(100vh-64px)] max-w-7xl w-full mx-auto shadow-xl">
        <CardHeader className="pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Cook">Cook</SelectItem>
                <SelectItem value="Waiter">Waiter</SelectItem>
                <SelectItem value="Cleaner">Cleaner</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Management">Management</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
                <SelectItem value="Cleaning">Cleaning</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="p-4">
                <div className="flex flex-col items-center space-y-4">
                  <img
                    src={employee.employeeImage}
                    alt={employee.user}
                    className="w-24 h-32 rounded object-cover"
                  />
                  <div className="text-center">
                    <h3 className="font-semibold text-sm">{employee.user}</h3>
                    <p className="text-xs text-muted-foreground">{employee.position}</p>
                    <p className="text-xs text-muted-foreground">{employee.department}</p>
                    <p className="text-xs text-muted-foreground">Salary: ${employee.salary}</p>
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(employee)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(employee.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}