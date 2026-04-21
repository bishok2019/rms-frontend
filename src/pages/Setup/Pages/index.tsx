import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  CreditCard,
  User,
  BookOpen,
  BarChart3,
  Package,
  ChefHat,
} from "lucide-react";
import { Link } from "react-router";

const setupOptions = [
  {
    id: "restaurant",
    title: "Restaurant",
    description: "Setup and customization of your restaurant.",
    icon: Building2,
    href: "/setup/restaurant",
  },
  {
    id: "inventory",
    title: "Inventory",
    description: "Manage stock and inventory items",
    icon: Package,
    href: "/setup/inventory",
  },
  {
    id: "kitchen",
    title: "Kitchen",
    description: "Manage kitchen categories and kitchens",
    icon: ChefHat,
    href: "/setup/kitchen",
  },
  {
    id: "report",
    title: "Reports",
    description: "View analytics and sales reports",
    icon: BarChart3,
    href: "/setup/report",
  },
];

const otherOptions = [
  {
    id: "payment",
    title: "Payment Provider",
    description: "View and setup payment providers to your restaurant.",
    icon: CreditCard,
    href: "/setup/payment",
  },
  {
    id: "customer",
    title: "Customer",
    description: "View and setup customer in your restaurant.",
    icon: User,
    href: "/setup/customer",
  },
  {
    id: "static-menu",
    title: "Static Menu",
    description: "Customer view when restaurant is offline.",
    icon: BookOpen,
    href: "/setup/static-menu",
  },
];

export default function SetupPage() {
  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="sticky top-0 z-10 pb-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Setup</h1>
        <p className="text-muted-foreground mt-1">
          Configure and manage your restaurant
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {setupOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Link key={option.id} to={option.href}>
              <Card className="bg-accent hover:opacity-90 cursor-pointer transition-opacity h-full border-0">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <Icon className="w-12 h-12 text-accent-foreground" />
                  <div>
                    <h3 className="font-semibold text-accent-foreground text-lg">
                      {option.title}
                    </h3>
                    <p className="text-sm text-accent-foreground/80 mt-1">
                      {option.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Other Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Link key={option.id} to={option.href}>
                <Card className="bg-secondary hover:opacity-90 cursor-pointer transition-opacity h-full border-border">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <Icon className="w-12 h-12 text-secondary-foreground" />
                    <div>
                      <h3 className="font-semibold text-secondary-foreground text-lg">
                        {option.title}
                      </h3>
                      <p className="text-sm text-secondary-foreground/80 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
