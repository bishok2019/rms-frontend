import { useState } from "react";
import { useNavigate } from "react-router";
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
import { Card, CardContent } from "@/components/ui/card";
import { useChangePasswordMutation } from "../Store/authenticationStore";

const validationSchema = z
  .object({
    oldPassword: z.string().nonempty("Required!"),
    password: z.string().nonempty("Required!"),
    newPassword: z.string().nonempty("Required!"),
  })
  .refine((data) => data.password === data.newPassword, {
    message: "Passwords must match.",
    path: ["newPassword"],
  });

const ChangePassword = () => {
  const navigate = useNavigate();
  const mutation = useChangePasswordMutation(navigate);
  const [visiblePasswords, setVisiblePasswords] = useState({
    oldPassword: false,
    password: false,
    newPassword: false,
  });

  const changePasswordForm = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: { oldPassword: "", password: "", newPassword: "" },
  });

  const onSubmit: SubmitHandler<z.infer<typeof validationSchema>> = async (
    data
  ) => {
    await mutation.mutateAsync({ password: data.newPassword });
  };

  return (
    <>
      <div className="flex flex-col justify-center items-center gap-[60px] w-full h-full md:py-24 py-10">
        <div className="flex flex-col gap-[10px]">
          <h1 className="font-poppins font-[600] lg:text-[36px]/[100%] text-[24px]/[100%] text-center text-[var(--main-text)]">
            Change Password
          </h1>
          <p className="font-poppins font-[400] lg:text-[18px]/[150%] text-[14px]/[150%]  text-center text-[var(--main-text)]">
            Please provide new password
          </p>
        </div>
        <Card className="md:w-1/3 xl:w-1/5 w-[90%] h-auto p-[20px] rounded-[10px] bg-white border-0 shadow-[0_4px_6px_0px_#000E1F2E]">
          <CardContent className="p-0 flex justify-center items-center w-full">
            <Form {...changePasswordForm}>
              <form
                onSubmit={changePasswordForm.handleSubmit(onSubmit)}
                className="flex flex-col gap-4 w-full"
              >
                <FormField
                  control={changePasswordForm.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem className="relative gap-[5px]">
                      <FormLabel className="font-inter text-[14px]/[100%] font-500 gap-0">
                        Old Password<span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type={
                            visiblePasswords?.oldPassword ? "text" : "password"
                          }
                          placeholder="Old Password"
                          className="mt-0 focus-visible:ring-0 border-zinc-200"
                          {...field}
                        />
                      </FormControl>
                      {visiblePasswords?.oldPassword ? (
                        <Button
                          type="button"
                          variant="link"
                          className="absolute top-[20px] cursor-pointer right-1 stroke-neutral-500 p-0 !m-0 "
                          onClick={() =>
                            setVisiblePasswords((prev) => ({
                              ...prev,
                              oldPassword: false,
                            }))
                          }
                        >
                          <EyeOff size={20} />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="link"
                          className="absolute top-[20px] cursor-pointer right-1 stroke-neutral-500 p-0 !m-0 "
                          onClick={() =>
                            setVisiblePasswords((prev) => ({
                              ...prev,
                              oldPassword: true,
                            }))
                          }
                        >
                          <Eye size={20} />
                        </Button>
                      )}

                      <FormMessage className="text-red-500 text-xs m-0" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={changePasswordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="relative gap-[5px]">
                      <FormLabel className="font-inter text-[14px]/[100%] font-500 gap-0">
                        New Password<span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type={
                            visiblePasswords?.password ? "text" : "password"
                          }
                          placeholder="New Password"
                          className="mt-0 focus-visible:ring-0 border-zinc-200"
                          {...field}
                        />
                      </FormControl>
                      {visiblePasswords?.password ? (
                        <Button
                          type="button"
                          variant="link"
                          className="absolute top-[20px] cursor-pointer right-1 stroke-neutral-500 p-0 !m-0 "
                          onClick={() =>
                            setVisiblePasswords((prev) => ({
                              ...prev,
                              password: false,
                            }))
                          }
                        >
                          <EyeOff size={20} />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="link"
                          className="absolute top-[20px] cursor-pointer right-1 stroke-neutral-500 p-0 !m-0 "
                          onClick={() =>
                            setVisiblePasswords((prev) => ({
                              ...prev,
                              password: true,
                            }))
                          }
                        >
                          <Eye size={20} />
                        </Button>
                      )}

                      <FormMessage className="text-red-500 text-xs m-0" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={changePasswordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem className="relative gap-[5px]">
                      <FormLabel className="font-inter text-[14px]/[100%] font-500 gap-0">
                        Confirm Password<span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type={
                            visiblePasswords?.newPassword ? "text" : "password"
                          }
                          placeholder="Confirm Password"
                          className="mt-0 focus-visible:ring-0 border-zinc-200"
                          {...field}
                        />
                      </FormControl>
                      {visiblePasswords?.newPassword ? (
                        <Button
                          type="button"
                          variant="link"
                          className="absolute top-[20px] cursor-pointer right-1 stroke-neutral-500 p-0 !m-0 "
                          onClick={() =>
                            setVisiblePasswords((prev) => ({
                              ...prev,
                              newPassword: false,
                            }))
                          }
                        >
                          <EyeOff size={20} />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="link"
                          className="absolute top-[20px] cursor-pointer right-1 stroke-neutral-500 p-0 !m-0 "
                          onClick={() =>
                            setVisiblePasswords((prev) => ({
                              ...prev,
                              newPassword: true,
                            }))
                          }
                        >
                          <Eye size={20} />
                        </Button>
                      )}

                      <FormMessage className="text-red-500 text-xs m-0" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="text-center bg-[var(--main-background)] text-zinc-50 cursor-pointer"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending && <Loader2 className="animate-spin" />}{" "}
                  Change
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ChangePassword;
