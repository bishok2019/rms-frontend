import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDiningTable,
  createSection,
  getDiningTables,
  getSections,
  updateSection,
  updateDiningTable,
} from "./api";
import { errorFunction, successFunction } from "@/components/common/Alert";
export const sectionQueryKeys = {
  all: ["sections"] as const,
  list: () => [...sectionQueryKeys.all, "list"] as const,
  detail: (id: number) => [...sectionQueryKeys.all, "detail", id] as const,
};

export const diningTableQueryKeys = {
  all: ["dining-table"] as const,
  list: (params?: { section__name?: string; search?: string; is_occupied?: boolean }) =>
    [...diningTableQueryKeys.all, "list", params] as const,
  detail: (id: number) => [...diningTableQueryKeys.all, "detail", id] as const,
};
export const useCreateSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => {
      return createSection(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionQueryKeys.all });
      successFunction("Section created successfully.");
    },
    onError: (error: any) => {
      errorFunction(error?.message);
    },
  });
};
export const useSections = (enabled: boolean = true) => {
  return useQuery({
    queryKey: sectionQueryKeys.list(),
    queryFn: () => getSections(),
    enabled,
   });
};

export const useUpdateSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) =>
      updateSection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionQueryKeys.all });
      successFunction("Section updated successfully.");
    },
    onError: (error: any) => {
      errorFunction(error?.message);
    },
  });
};

export const diningTableQueryKeys = {
  all: ["dining-tables"] as const,
  list: () => [...diningTableQueryKeys.all, "list"] as const,
};

export const useCreateDiningTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => createDiningTable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diningTableQueryKeys.all });
      successFunction("Table created successfully.");
    },
    onError: (error: any) => {
      errorFunction(error?.message);
    },
  });
};

export const useUpdateDiningTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) =>
      updateDiningTable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diningTableQueryKeys.all });
      successFunction("Table updated successfully.");
    },
    onError: (error: any) => {
      errorFunction(error?.message);
    },
  });
};

export const useDiningTables = (
  enabled: boolean = true,
  params?: { section__name?: string; search?: string; is_occupied?: boolean }
) => {
  return useQuery({
    queryKey: diningTableQueryKeys.list(params),
    queryFn: () => getDiningTables(params),
    enabled,
  });
};
