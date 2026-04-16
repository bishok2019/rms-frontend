import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateSection, useUpdateSection } from "../Store/TablesStore";
import { Textarea } from "@/components/ui/textarea";
import type { Section } from "@/types/api";

// Validation schema
const validationSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof validationSchema>;

type CreateAreaProps = {
  onSuccess?: () => void;
  edit?: boolean;
  data?: Section | null;
};

export default function CreateArea({
  onSuccess,
  edit = false,
  data,
}: CreateAreaProps) {
  const { mutateAsync: createSection, isPending: isCreating } = useCreateSection();
  const { mutateAsync: updateSection, isPending: isUpdating } = useUpdateSection();

  const form = useForm<FormValues>({
    defaultValues: {
      name: data?.name || "",
      description: data?.description || "",
      isActive: data?.isActive ?? true,
    },
  });

  useEffect(() => {
    form.reset({
      name: data?.name || "",
      description: data?.description || "",
      isActive: data?.isActive ?? true,
    });
  }, [data, form]);

  const onSubmit = async (formData: FormValues) => {
    if (edit && data?.id) {
      await updateSection({ id: data.id, data: formData });
    } else {
      await createSection(formData);
    }
    onSuccess?.();
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <div className="flex justify-center gap-5">
      <div className="flex w-full flex-col items-center">
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="grid w-full grid-cols-1 gap-x-6 gap-y-4 px-10 sm:grid-cols-2"
          >
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="gap-[5px]">
                    <FormLabel className="font-inter text-[14px]/[100%] font-500">
                      Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter country name"
                        className="mt-0 focus-visible:ring-0 border-zinc-200"
                        type="text"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="gap-[5px] mt-4">
                    <FormLabel className="font-inter text-[14px]/[100%] font-500">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter description" />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-inter text-[14px]/[100%] font-500">
                        Active
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSuccess}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : edit ? "Update" : "Create"}
                  Section
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
