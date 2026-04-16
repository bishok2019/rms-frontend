import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";

import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, Sparkles, User } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { useLoginMutation } from "../Store/authenticationStore";

import { Label } from "../../../components/ui/label";

const validationSchema = z.object({
  username: z.string().nonempty("Required!"),
  password: z.string().nonempty("Required!"),
});

const Login = () => {
  const navigate = useNavigate();
  const mutation = useLoginMutation(navigate);

  const [visiblePassword, setVisiblePassword] = useState(false);

  const loginForm = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof validationSchema>) => {
    await mutation.mutateAsync(data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {" "}
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
        <div className="absolute inset-0 ">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#1c2b78]/10 via-transparent to-blue-600/5" />
        </div>

        <div className="absolute top-20 left-20 w-32 h-32 #1c2b78/20 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-400/15 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-10 w-24 h-24 #1c2b78/15 rounded-full blur-lg" />

        <div className="relative z-10 w-full max-w-md px-4">
          <Card className="border-border shadow-2xl backdrop-blur-sm bg-card/95 relative overflow-hidden">
            {/* <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#1c2b78]/30 via-blue-50 to-transparent rounded-bl-full" /> */}
            {/* <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-300/40 via-[#1c2b78]/50 to-transparent rounded-tr-full" /> */}
            {/* <div className="absolute inset-0 bg-gradient-to-br from-[#1c2b78]/5 via-transparent to-transparent pointer-events-none" /> */}
            <CardHeader className="space-y-3 text-center relative z-10">
              {/* <div className="flex  justify-center mb-2">
                <img
                  height={10}
                  width={200}
                  src={ntaglogo}
                  className="relative z-10 mb-4"
                />
              </div> */}

              <CardTitle className="text-3xl font-bold text-foreground font-sans">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                Sign in to your account to continue your journey
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem className="gap-[5px]">
                          <FormLabel className="text-sm font-semibold  flex items-center gap-2">
                            <User className="h-4 w-4 text-[#1c2b78]" />
                            Username
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Username"
                              className="pl-4 pr-4 py-3 bg-input/50 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 rounded-lg text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs m-0" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="relative gap-[5px]">
                          <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Lock className="h-4 w-4 text-[#1c2b78]" />
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={visiblePassword ? "text" : "password"}
                                placeholder="Password"
                                className="mt-0 focus-visible:ring-0 border-zinc-200"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setVisiblePassword(!visiblePassword)
                                }
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors duration-200 p-1"
                              >
                                {visiblePassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </FormControl>

                          <FormMessage className="text-red-500 text-xs m-0" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-3">
                      <input
                        id="remember"
                        type="checkbox"
                        className="h-4 w-4 text-[#1c2b78] focus:ring-primary border-border rounded transition-colors"
                      />
                      <Label
                        htmlFor="remember"
                        className="text-sm text-muted-foreground font-medium"
                      >
                        Remember me
                      </Label>
                    </div>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-[#1c2b78] hover:text-primary/80 transition-colors font-semibold"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full bg-gradient-to-r from-[#1c2b78] to-[#2A3B8F] hover:from-[#1c2b78]/90 hover:via-[#2A3B8F]/90 hover:to-blue-300 text-white font-semibold py-3 transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Sign In
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-[#1c2b78] text-[#1c2b78] hover:bg-[#1c2b78] hover:text-white"
                    asChild
                  >
                    <Link to="/register">Sign Up</Link>
                  </Button>
                </form>
              </Form>
              {/* <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <a
                    href="#"
                    className="text-[#1c2b78] hover:text-primary/80 transition-colors font-semibold"
                  >
                    Create one now
                  </a>
                </p>
              </div> */}

              <div className="pt-6 border-t border-border/50">
                <div className="flex justify-center space-x-8 text-xs text-muted-foreground">
                  <a
                    href="#"
                    className="hover:text-primary transition-colors font-medium"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors font-medium"
                  >
                    Terms of Service
                  </a>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors font-medium"
                  >
                    Support
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>{" "}
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

export default Login;
