import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
import {
  useResendOTPMutation,
  useResetPasswordMutation,
} from "../Store/authenticationStore";
import { errorFunction } from "@/components/common/Alert";

const validationSchema = z
  .object({
    otp: z
      .string()
      .regex(/^\d{6}$/, "Enter a valid 6-digit OTP."),
    password: z.string().nonempty("Required!"),
    confirmPassword: z.string().nonempty("Required!"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

const ResetPassword = () => {
  const navigate = useNavigate();
  const mutation = useResetPasswordMutation(navigate);
  const resendMutation = useResendOTPMutation();

  const [timer, setTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [visibleConfirmPassword, setVisibleConfirmPassword] = useState(false);

  const resetPasswordForm = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: { otp: "", password: "", confirmPassword: "" },
  });

  const onSubmit: SubmitHandler<z.infer<typeof validationSchema>> = async (
    data
  ) => {
    const createData = { otp: data.otp, newPassword: data.confirmPassword };
    await mutation.mutateAsync(createData);
  };

  const handleResendOTP = () => {
    const email = localStorage.getItem("forgotEmail") || "";
    const code = localStorage.getItem("forgotCode") || "";
    if (!email || !code) {
      errorFunction("Please submit forgot password again.");
      return;
    }
    setTimer(300);
    setCanResend(false);
    resendMutation.mutate({ email, code });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes < 10 ? "0" : ""}${minutes}:${
      secs < 10 ? "0" : ""
    }${secs}`;
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

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
        </div> */}
      {/* </div> */}

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
                Reset Password
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                Enter OTP and set your new password
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10">
              <Form {...resetPasswordForm}>
                <form
                  onSubmit={resetPasswordForm.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <FormField
                    control={resetPasswordForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">
                          OTP Code
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            className="pl-4 pr-4 py-3 bg-input/50 border-border tracking-[0.3em] text-center"
                            value={field.value}
                            onChange={(e) => {
                              const otpValue = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6);
                              field.onChange(otpValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs m-0" />
                      </FormItem>
                    )}
                  />

                  <div className="text-center">
                    {canResend ? (
                      <p className="text-sm text-muted-foreground">
                        Didn&apos;t receive OTP?
                        <Button
                          type="button"
                          onClick={handleResendOTP}
                          variant="ghost"
                          className="text-[#1c2b78] font-semibold text-sm p-1 cursor-pointer hover:underline"
                          disabled={resendMutation.isPending}
                        >
                          {resendMutation.isPending && (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          )}
                          Resend Again
                        </Button>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Resend OTP in {formatTime(timer)}
                      </p>
                    )}
                  </div>

                  <FormField
                    control={resetPasswordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="relative gap-[5px]">
                        <FormLabel className="text-sm font-semibold text-foreground">
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            type={visiblePassword ? "text" : "password"}
                            placeholder="Password"
                            className="mt-0 focus-visible:ring-0 border-zinc-200"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="link"
                          className="absolute top-[20px] right-1 stroke-neutral-500 p-0 !m-0"
                          onClick={() => setVisiblePassword((prev) => !prev)}
                        >
                          {visiblePassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </Button>
                        <FormMessage className="text-red-500 text-xs m-0" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetPasswordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="relative gap-[5px]">
                        <FormLabel className="text-sm font-semibold text-foreground">
                          Confirm Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            type={visibleConfirmPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            className="mt-0 focus-visible:ring-0 border-zinc-200"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="link"
                          className="absolute top-[20px] right-1 stroke-neutral-500 p-0 !m-0"
                          onClick={() =>
                            setVisibleConfirmPassword((prev) => !prev)
                          }
                        >
                          {visibleConfirmPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </Button>
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
                    Confirm
                  </Button>
                </form>
              </Form>

              <p className="text-sm text-center text-muted-foreground">
                Back to{" "}
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

export default ResetPassword;
