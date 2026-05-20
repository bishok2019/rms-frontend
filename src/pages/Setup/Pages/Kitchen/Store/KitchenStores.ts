import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { errorFunction, successFunction } from "@/components/common/Alert";
import {
  createKitchenCategory,
  getKitchenCategories,
  updateKitchenCategory,
  createKitchen,
  getKitchenDashboard,
  getKitchens,
  updateKitchen,
} from "./api";
import type { KitchenListParams } from "./api";

const KITCHEN_LIST_STALE_TIME = 5 * 60 * 1000;

export const kitchenDashboardQueryKey = ["kitchen", "dashboard"] as const;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

export const kitchenCategoryQueryKeys = {
  all: ["kitchen-category"] as const,
  list: () => [...kitchenCategoryQueryKeys.all, "list"] as const,
  detail: (id: number) => [...kitchenCategoryQueryKeys.all, "detail", id] as const,
};

export const kitchenQueryKeys = {
  all: ["kitchen"] as const,
  list: (params?: { category?: number | string; search?: string } & KitchenListParams) =>
    [...kitchenQueryKeys.all, "list", params] as const,
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
      queryClient.invalidateQueries({ queryKey: kitchenDashboardQueryKey });
      successFunction("Kitchen category created successfully.");
    },
    onError: (error: unknown) => {
      errorFunction(getErrorMessage(error));
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
      queryClient.invalidateQueries({ queryKey: kitchenDashboardQueryKey });
      successFunction("Kitchen category updated successfully.");
    },
    onError: (error: unknown) => {
      errorFunction(getErrorMessage(error));
    },
  });
};

export const useKitchenCategories = (enabled: boolean = true, params?: KitchenListParams) => {
  return useQuery({
    queryKey: [...kitchenCategoryQueryKeys.list(), params] as const,
    queryFn: () => getKitchenCategories(params),
    enabled,
    staleTime: KITCHEN_LIST_STALE_TIME,
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
      queryClient.invalidateQueries({ queryKey: kitchenDashboardQueryKey });
      successFunction("Kitchen created successfully.");
    },
    onError: (error: unknown) => {
      errorFunction(getErrorMessage(error));
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
      queryClient.invalidateQueries({ queryKey: kitchenDashboardQueryKey });
      successFunction("Kitchen updated successfully.");
    },
    onError: (error: unknown) => {
      errorFunction(getErrorMessage(error));
    },
  });
};

export const useKitchens = (
  enabled: boolean = true,
  params?: { category?: number | string; search?: string } & KitchenListParams
) => {
  return useQuery({
    queryKey: kitchenQueryKeys.list(params),
    queryFn: () => getKitchens(params),
    enabled,
    staleTime: KITCHEN_LIST_STALE_TIME,
  });
};

export const useAllKitchens = (enabled: boolean = true) => {
  return useQuery({
    queryKey: kitchenQueryKeys.list(),
    queryFn: () => getKitchens(),
    enabled,
    staleTime: KITCHEN_LIST_STALE_TIME,
  });
};

export const useKitchenDashboard = () => {
  return useQuery({
    queryKey: kitchenDashboardQueryKey,
    queryFn: () => getKitchenDashboard(),
  });
};
