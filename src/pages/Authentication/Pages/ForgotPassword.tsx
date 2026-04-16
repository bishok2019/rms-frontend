import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Loader2, Mail, User } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForgotPasswordMutation } from "../Store/authenticationStore";

const validationSchema = z.object({
  email: z.string().email("Enter a valid email"),
  code: z.string().nonempty("Username is required"),
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const mutation = useForgotPasswordMutation(navigate);

  const forgotPasswordForm = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: { email: "", code: "" },
  });

  const onSubmit: SubmitHandler<z.infer<typeof validationSchema>> = async (
    data
  ) => {
    await mutation.mutateAsync(data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {/* <div className="relative px-4 top-bar bg-[#1c2b78] h-8 w-full flex items-center"> */}
        {/* <div className="container mx-auto flex justify-between items-center"> */}
          {/* <div className="text-white text-xs"></div> */}
          {/* <div className="flex items-center gap-2"> */}
            {/* <img width={10} src="/assets/nepalflag.png" alt="logo" /> */}
            <div className="text-white text-xs">
              {/* | <a href="tel:+977 01-44111234">+977 01-44111234</a> */}
            {/* </div> */}
          {/* </div> */}
        {/* </div> */}
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#1c2b78]/10 via-transparent to-blue-600/5" />
        </div>

        <div className="absolute top-20 left-20 w-32 h-32 #1c2b78/20 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-400/15 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-10 w-24 h-24 #1c2b78/15 rounded-full blur-lg" />

        <div className="relative z-10 w-full max-w-md px-4">
          <Card className="border-border shadow-2xl backdrop-blur-sm bg-card/95 relative overflow-hidden">
            <CardHeader className="space-y-3 text-center relative z-10">
              <CardTitle className="text-3xl font-bold text-foreground font-sans">
                Forgot Password
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                Enter your username and email to receive OTP
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10">
              <Form {...forgotPasswordForm}>
                <form
                  onSubmit={forgotPasswordForm.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <FormField
                    control={forgotPasswordForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4 text-[#1c2b78]" />
                          Username
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter Username"
                            className="pl-4 pr-4 py-3 bg-input/50 border-border"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs m-0" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#1c2b78]" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter Email"
                            className="pl-4 pr-4 py-3 bg-input/50 border-border"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs m-0" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#1c2b78] to-[#2A3B8F] hover:from-[#1c2b78]/90 hover:via-[#2A3B8F]/90 hover:to-blue-300 text-white font-semibold py-3 transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending && (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    )}
                    Send OTP
                  </Button>
                </form>
              </Form>

              <p className="text-sm text-center text-muted-foreground">
                Remembered your password?{" "}
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

export default ForgotPassword;
