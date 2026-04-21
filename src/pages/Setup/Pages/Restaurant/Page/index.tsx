import type React from "react";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function RestaurantSetup() {
  const [restaurant, setRestaurant] = useState({
    name: "Chiya Bagaan",
    email: "info@chiyabagaan.com",
    phone: "+1 234 567 8900",
    address: "123 Main Street, City",
    city: "City",
    country: "Country",
    description: "Premium restaurant serving authentic cuisine",
    logo: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setRestaurant((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Saving restaurant:", restaurant);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="sticky top-0 z-10 pb-4 mb-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Restaurant Details</h1>
        <Button
          onClick={handleSave}
          className="bg-accent text-accent-foreground"
        >
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={restaurant.name}
                  onChange={handleChange}
                  placeholder="Restaurant name"
                  className="bg-background text-foreground border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={restaurant.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  className="bg-background text-foreground border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={restaurant.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                  className="bg-background text-foreground border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={restaurant.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="bg-background text-foreground border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={restaurant.country}
                  onChange={handleChange}
                  placeholder="Country"
                  className="bg-background text-foreground border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={restaurant.address}
                  onChange={handleChange}
                  placeholder="Street address"
                  className="bg-background text-foreground border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={restaurant.description}
                onChange={handleChange}
                placeholder="Restaurant description"
                className="bg-background text-foreground border-border min-h-24"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
