import { Building2, UserRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IndividualRegister from "./IndividualRegister";
import OrganizationRegister from "./OrganizationRegister";
import { Link } from "react-router";

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {/* <div className="relative px-4 top-bar bg-[#1c2b78] h-8 w-full flex items-center">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-white text-xs"></div>
          <div className="flex items-center gap-2">
            <img width={10} src="/assets/nepalflag.png" alt="logo" />
            <div className="text-white text-xs">
              | <a href="tel:+977 01-44111234">+977 01-44111234</a>
            </div>
          </div>
        </div>
      </div> */}

      <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#1c2b78]/10 via-transparent to-blue-600/5" />
        </div>

        <div className="absolute top-20 left-20 w-32 h-32 #1c2b78/20 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-400/15 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-10 w-24 h-24 #1c2b78/15 rounded-full blur-lg" />

        <div className="relative z-10 w-full max-w-xl px-4">
          <Card className="border-border shadow-2xl backdrop-blur-sm bg-card/95 relative overflow-hidden">
            <CardHeader className="space-y-3 text-center relative z-10">
              <CardTitle className="text-3xl font-bold text-foreground font-sans">
                Create Your Account
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                Sign up to start using your restaurant portal
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10">
              <Tabs
                defaultValue="individual"
                className="items-center justify-center m-auto"
              >
                <TabsList className="grid w-fit h-fit grid-cols-2 gap-2 bg-muted/50">
                  <TabsTrigger
                    value="individual"
                    className="group flex flex-col gap-[10px] rounded-0 shadow-none border-0 data-[state=active]:shadow-none cursor-pointer"
                  >
                    <UserRound className="h-6 w-6" />
                    <p className="font-inter font-[500] text-[14px]/[100%] text-[#71717a] group-data-[state=active]:text-[#05173B]">
                      Individual
                    </p>
                  </TabsTrigger>
                  <TabsTrigger
                    value="organization"
                    className="group flex flex-col gap-[10px] rounded-0 shadow-none border-0 data-[state=active]:shadow-none cursor-pointer"
                  >
                    <Building2 className="h-6 w-6" />
                    <p className="font-inter font-[500] text-[14px]/[100%] text-[#71717a] group-data-[state=active]:text-[#05173B]">
                      Organization
                    </p>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="individual" className="w-full">
                  <IndividualRegister />
                </TabsContent>
                <TabsContent value="organization" className="w-full">
                  <OrganizationRegister />
                </TabsContent>
              </Tabs>

              <p className="text-sm text-center text-muted-foreground pt-1">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#1c2b78] hover:text-primary/80 transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="bg-gradient-to-r from-[#1c2b78] to-[#2A3B8F] text-white py-4 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="text-xs text-blue-100">
              © 2026 Bishok Paudel. All rights reserved.
            </div>
            <div className="text-xs text-blue-100">
              Technical Support By Bishok Paudel.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Register;
