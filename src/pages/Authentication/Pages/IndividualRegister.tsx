import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useRegisterMutation } from "../Store/authenticationStore";

const validationSchema = z.object({
  username: z.string().nonempty("Required!"),
  email: z.string().nonempty("Required!").email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters."),
  phoneNo: z
    .string()
    .nonempty("Required!")
    .regex(/^9\d{9}$/, {
      message: "Phone number must start with 9 and have exactly 10 digits.",
    }),
});

const IndividualRegister = () => {
  const navigate = useNavigate();
  const mutation = useRegisterMutation(navigate);
  const [visiblePassword, setVisiblePassword] = useState(false);

  const registerForm = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      phoneNo: "",
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof validationSchema>> = async (
    data
  ) => {
    await mutation.mutateAsync({
      ...data,
    });
  };
  return (
    <div className="mt-4">
      <Form {...registerForm}>
        <form
          onSubmit={registerForm.handleSubmit(onSubmit)}
          className="flex flex-col gap-y-3 w-full"
        >
          <FormField
            control={registerForm.control}
            name="username"
            render={({ field }) => (
              <FormItem className="gap-[5px]">
                <FormLabel className="font-inter text-[14px]/[100%] font-500 gap-0">
                  Username<span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Username"
                    className="mt-0 focus-visible:ring-0 border-zinc-200"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-xs m-0" />
              </FormItem>
            )}
          />
          <FormField
            control={registerForm.control}
            name="email"
            render={({ field }) => (
              <FormItem className="gap-[5px]">
                <FormLabel className="font-inter text-[14px]/[100%] font-500 gap-0">
                  Email<span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Email"
                    className="mt-0 focus-visible:ring-0 border-zinc-200"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-xs m-0" />
              </FormItem>
            )}
          />
          <FormField
            control={registerForm.control}
            name="password"
            render={({ field }) => (
              <FormItem className="relative gap-[5px]">
                <FormLabel className="font-inter text-[14px]/[100%] font-500 gap-0">
                  Password<span className="text-red-500">*</span>
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
            control={registerForm.control}
            name="phoneNo"
            render={({ field }) => (
              <FormItem className="gap-[5px]">
                <FormLabel className="font-inter text-[14px]/[100%] font-500">
                  Phone no.
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Phone no."
                    className="mt-0 focus-visible:ring-0 border-zinc-200"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-xs m-0" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="text-center bg-[var(--main-background)] text-zinc-50 hover:text-zinc-50  active:text-zinc-50 dark:text-primary dark:bg-secondary font-500 text-[14px]/[100%] font-inter"
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="animate-spin" />}
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default IndividualRegister;
