"use client";

import type React from "react";

import { useState } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Edit2 } from "lucide-react";

const mockMembers = [
  {
    id: 1,
    name: "Deepak Saud",
    email: "deepak@chiyabagaan.com",
    role: "Admin",
    phone: "+1 234 567 8900",
  },
  {
    id: 2,
    name: "John Doe",
    email: "john@chiyabagaan.com",
    role: "Manager",
    phone: "+1 234 567 8901",
  },
  {
    id: 3,
    name: "Jane Smith",
    email: "jane@chiyabagaan.com",
    role: "Staff",
    phone: "+1 234 567 8902",
  },
];

export default function MembersSetup() {
  const [members, setMembers] = useState(mockMembers);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Staff",
    phone: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    if (editingId) {
      setMembers(
        members.map((m) => (m.id === editingId ? { ...m, ...formData } : m))
      );
      setEditingId(null);
    } else {
      setMembers([
        ...members,
        { id: Math.max(...members.map((m) => m.id), 0) + 1, ...formData },
      ]);
    }
    setFormData({ name: "", email: "", role: "Staff", phone: "" });
    setOpen(false);
  };

  const handleEdit = (member: (typeof mockMembers)[0]) => {
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      phone: member.phone,
    });
    setEditingId(member.id);
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="sticky top-0 z-10 pb-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Members Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary text-primary-foreground w-full md:w-auto"
              onClick={() => {
                setEditingId(null);
                setFormData({ name: "", email: "", role: "Staff", phone: "" });
              }}
            >
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Member" : "Add New Member"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-background text-foreground border-border"
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-background text-foreground border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md"
                >
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>Staff</option>
                </select>
              </div>
              <Button
                onClick={handleAdd}
               className="w-full"
              >
                {editingId ? "Update" : "Add"} Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-foreground">Name</TableHead>
                  <TableHead className="text-foreground hidden md:table-cell">
                    Email
                  </TableHead>
                  <TableHead className="text-foreground hidden lg:table-cell">
                    Phone
                  </TableHead>
                  <TableHead className="text-foreground">Role</TableHead>
                  <TableHead className="text-foreground text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow
                    key={member.id}
                    className="border-border hover:bg-secondary/50"
                  >
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {member.email}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {member.phone}
                    </TableCell>
                    <TableCell>
                      <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                        {member.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(member)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
