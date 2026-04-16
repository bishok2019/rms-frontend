import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { errorFunction, successFunction } from "@/components/common/Alert";
import {
  createKitchenCategory,
  getKitchenCategories,
  updateKitchenCategory,
  createKitchen,
  getKitchens,
  updateKitchen,
} from "./api";

export const kitchenCategoryQueryKeys = {
  all: ["kitchen-category"] as const,
  list: () => [...kitchenCategoryQueryKeys.all, "list"] as const,
  detail: (id: number) => [...kitchenCategoryQueryKeys.all, "detail", id] as const,
};

export const kitchenQueryKeys = {
  all: ["kitchen"] as const,
  list: () => [...kitchenQueryKeys.all, "list"] as const,
  detail: (id: number) => [...kitchenQueryKeys.all, "detail", id] as const,
};

export const useCreateKitchenCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => {
      return createKitchenCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenCategoryQueryKeys.all });
      successFunction("Kitchen category created successfully.");
    },
    onError: (error: any) => {
      errorFunction(error?.message);
    },
  });
};

export const useUpdateKitchenCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => {
      return updateKitchenCategory(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenCategoryQueryKeys.all });
      successFunction("Kitchen category updated successfully.");
    },
    onError: (error: any) => {
      errorFunction(error?.message);
    },
  });
};

export const useKitchenCategories = (enabled: boolean = true) => {
  return useQuery({
    queryKey: kitchenCategoryQueryKeys.list(),
    queryFn: getKitchenCategories,
    enabled,
  });
};

export const useCreateKitchen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => {
      return createKitchen(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenQueryKeys.all });
      successFunction("Kitchen created successfully.");
    },
    onError: (error: any) => {
      errorFunction(error?.message);
    },
  });
};

export const useUpdateKitchen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => {
      return updateKitchen(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenQueryKeys.all });
      successFunction("Kitchen updated successfully.");
    },
    onError: (error: any) => {
      errorFunction(error?.message);
    },
  });
};

export const useKitchens = (enabled: boolean = true) => {
  return useQuery({
    queryKey: kitchenQueryKeys.list(),
    queryFn: getKitchens,
    enabled,
  });
};