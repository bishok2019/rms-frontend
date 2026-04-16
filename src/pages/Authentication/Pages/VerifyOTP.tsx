import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Card, CardContent } from "@/components/ui/card";
import { errorFunction, successFunction } from "@/components/common/Alert";
import { useResendOTPMutation } from "../Store/authenticationStore";

const validationSchema = z.object({
  otp: z
    .string()
    .nonempty("Required!")
    .min(6, { message: "Your one-time password must be 6 characters." }),
});

const VerifyOTP = () => {
  const navigate = useNavigate();
  const resendMutation = useResendOTPMutation();

  const [timer, setTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);

  const verifyOTPForm = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: { otp: "" },
  });

  const onSubmit: SubmitHandler<z.infer<typeof validationSchema>> = async (
    data
  ) => {
    if (data.otp.length !== 6) {
      errorFunction("Please enter a valid 6-digit OTP.");
      return;
    }

    successFunction("OTP verified.");
    navigate("/login");
  };

  const handleResendOTP = () => {
    const email = localStorage.getItem("forgotEmail") || "";
    const code = localStorage.getItem("forgotCode") || "";

    if (!email || !code) {
      errorFunction("Please restart the forgot password flow.");
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
    }
    setCanResend(true);
  }, [timer]);

  return (
    <div className="flex flex-col justify-center items-center gap-[60px] w-full h-full md:py-24 py-10">
      <div className="flex flex-col gap-[10px]">
        <h1 className="font-poppins font-[600] lg:text-[36px]/[100%] text-[24px]/[100%] text-center text-[var(--main-text)]">
          One Time Password
        </h1>
        <p className="font-poppins font-[400] lg:text-[18px]/[150%] text-[14px]/[150%] text-center text-[var(--main-text)]">
          Enter the OTP sent to your email
        </p>
      </div>

      <Card className="md:w-1/3 xl:w-1/5 w-[90%] h-68 px-[20px] py-[30px] rounded-[10px] bg-white border-0 shadow-[0_4px_6px_0px_#000E1F2E]">
        <CardContent className="p-0 flex justify-center items-center w-full h-[100vh]">
          <Form {...verifyOTPForm}>
            <form
              onSubmit={verifyOTPForm.handleSubmit(onSubmit)}
              className="flex flex-col gap-4 w-full"
            >
              <FormField
                control={verifyOTPForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormControl className="w-full">
                      <InputOTP
                        autoFocus
                        maxLength={6}
                        containerClassName="w-full"
                        pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                        {...field}
                      >
                        <InputOTPGroup className="w-full">
                          {[...Array(6)].map((_, i) => (
                            <InputOTPSlot
                              key={i}
                              index={i}
                              className="w-full h-[45px] text-2xl font-inter border-[#E4E4E7] data-[active=true]:ring-1 data-[active=true]:ring-[var(--main-off-text)]"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs m-0" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="text-center bg-[var(--main-background)] text-zinc-50 cursor-pointer"
              >
                Verify
              </Button>

              <div className="text-center mt-2">
                {canResend ? (
                  <p className="text-[14px]/[20px] font-poppins font-[400]">
                    Didn&apos;t receive OTP?
                    <Button
                      onClick={handleResendOTP}
                      variant="ghost"
                      className="text-[var(--main-background)] font-[500] text-[14px]/[20px] p-1 cursor-pointer hover:underline hover:decoration-1"
                      disabled={resendMutation.isPending}
                    >
                      {resendMutation.isPending && (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      )}
                      Resend Again
                    </Button>
                  </p>
                ) : (
                  <p className="text-[14px]/[20px] font-poppins font-[400]">
                    Resend OTP in {formatTime(timer)}
                  </p>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyOTP;
