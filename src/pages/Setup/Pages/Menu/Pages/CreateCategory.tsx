import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateCategory, useUpdateCategory } from "../Store/MenuStores";

// Validation schema
const validationSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.string().optional(),
  photo: z.string().optional(),
});

type FormValues = z.infer<typeof validationSchema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _validationSchema = validationSchema;

type CreateCategoryProps = {
  closeRef: React.RefObject<HTMLButtonElement | null>;
  edit?: boolean;
  data?: FormValues;
  categoryId?: number;
};

export default function CreateCategory({
  closeRef,
  edit = false,
  data,
  categoryId,
}: CreateCategoryProps) {
  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      name: data?.name || "",
      description: data?.description || "",
      isActive: data?.isActive ?? true,
      displayOrder: data?.displayOrder || "",
      photo: data?.photo || "",
    },
  });

  const onSubmit = async (formData: FormValues) => {
    let submitData: FormValues | FormData = formData;

    if (photoFile) {
      // Use FormData for file upload
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);
      if (formData.description) {
        formDataObj.append("description", formData.description);
      }
      formDataObj.append("isActive", formData.isActive.toString());
      if (formData.displayOrder) {
        formDataObj.append("displayOrder", formData.displayOrder);
      }
      formDataObj.append("photo", photoFile);
      submitData = formDataObj;
    }

    try {
      if (edit && categoryId) {
        await updateCategory({ id: categoryId, data: submitData });
      } else {
        await createCategory(submitData);
      }
      // Close the dialog after successful submission
      setTimeout(() => closeRef.current?.click(), 100);
    } catch (error) {
      // Handle error if needed
      console.error("Failed to save category:", error);
    }
  };

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
                        placeholder="Enter name"
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
                 name="displayOrder"
                 render={({ field }) => (
                   <FormItem className="gap-[5px] mt-4">
                     <FormLabel className="font-inter text-[14px]/[100%] font-500">
                       Display Order
                     </FormLabel>
                     <FormControl>
                       <Input
                         {...field}
                         placeholder="Enter display order"
                         className="mt-0 focus-visible:ring-0 border-zinc-200"
                         type="text"
                       />
                     </FormControl>
                     <FormMessage className="text-red-500" />
                   </FormItem>
                 )}
               />

               <div className="space-y-2 mt-4">
                 <Label htmlFor="photo">Photo</Label>
                 <Input
                   id="photo"
                   name="photo"
                   type="file"
                   accept="image/*"
                   onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                   className="mt-0 focus-visible:ring-0 border-zinc-200"
                 />
                 <p className="text-xs text-muted-foreground">
                   Upload an image file for the menu category.
                 </p>
               </div>

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
                  onClick={() => closeRef.current?.click()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) ? "Saving..." : edit ? "Update" : "Create"}
                  Category
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
