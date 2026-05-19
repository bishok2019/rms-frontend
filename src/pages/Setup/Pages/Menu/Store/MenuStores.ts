import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { successFunction } from "@/components/common/Alert";
import { createCategory, getCategories, updateCategory, createMenuItem, getMenuItems, updateMenuItem, getMenuDashboard } from "./api";

export const menuDashboardQueryKey = ["menu", "dashboard"] as const;

export const categoryQueryKeys = {
  all: ["category"] as const,
  list: () => [...categoryQueryKeys.all, "list"] as const,
  detail: (id: number) => [...categoryQueryKeys.all, "detail", id] as const,
};

export const itemQueryKeys = {
  all: ["item"] as const,
  list: () => [...itemQueryKeys.all, "list"] as const,
  detail: (id: number) => [...itemQueryKeys.all, "detail", id] as const,
};
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => {
      return createCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: menuDashboardQueryKey });
      successFunction("Category created successfully.");
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => {
      return updateCategory(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: menuDashboardQueryKey });
      successFunction("Category updated successfully.");
    },
  });
};

export const useCategories = (enabled: boolean = true) => {
  return useQuery({
    queryKey: categoryQueryKeys.list(),
    queryFn: () => getCategories(),
    enabled,
  });
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => {
      return createMenuItem(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: menuDashboardQueryKey });
      successFunction("Menu item created successfully.");
    },
  });
};

export const useMenuItems = (enabled: boolean = true) => {
  return useQuery({
    queryKey: itemQueryKeys.list(),
    queryFn: () => getMenuItems(),
    enabled,
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => {
      return updateMenuItem(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: menuDashboardQueryKey });
      successFunction("Menu item updated successfully.");
    },
  });
};

export const useMenuDashboard = () => {
  return useQuery({
    queryKey: menuDashboardQueryKey,
    queryFn: () => getMenuDashboard(),
  });
};
