import { privateApiInstance } from "@/Utils/ky";
import type { ApiResponse, KitchenCategory, Kitchen, PaginatedApiResponse } from "@/types/api";

export const createKitchenCategory = (body: unknown) =>
  privateApiInstance
    .post("core-app/kitchen/category/create", { json: body })
    .json<ApiResponse<KitchenCategory>>();

export const getKitchenCategories = async () => {
  const response = await privateApiInstance
    .get("core-app/kitchen/category/list")
    .json<PaginatedApiResponse<KitchenCategory>>();
  return response;
};

export const updateKitchenCategory = (id: number, body: unknown) =>
  privateApiInstance
    .patch(`core-app/kitchen/category/update/${id}`, { json: body })
    .json<ApiResponse<KitchenCategory>>();

export const createKitchen = (body: unknown) =>
  privateApiInstance
    .post("core-app/kitchen/create", { json: body })
    .json<ApiResponse<Kitchen>>();

export const getKitchens = async (params?: {
  category?: number | string;
  search?: string;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.append("category", params.category.toString());
  if (params?.search) searchParams.append("search", params.search);
  const queryString = searchParams.toString();

  const response = await privateApiInstance
    .get(`core-app/kitchen/list${queryString ? `?${queryString}` : ""}`)
    .json<PaginatedApiResponse<Kitchen>>();
  return response;
};

export const getKitchen = (id: number) =>
  privateApiInstance
    .get(`core-app/kitchen/retrieve/${id}`)
    .json<ApiResponse<Kitchen>>();

export const updateKitchen = (id: number, body: unknown) =>
  privateApiInstance
    .patch(`core-app/kitchen/update/${id}`, { json: body })
    .json<ApiResponse<Kitchen>>();
