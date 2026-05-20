import { privateApiInstance } from "@/Utils/ky";
import type { ApiResponse, KitchenCategory, Kitchen, PaginatedApiResponse } from "@/types/api";

export interface KitchenListParams {
  page?: number;
  page_size?: number;
}

export interface KitchenDashboard {
  totalKitchens: number;
  totalKitchenCategories: number;
  totalActiveKitchens: number;
  totalInactiveKitchens: number;
  totalActiveKitchenCategories: number;
  totalInactiveKitchenCategories: number;
  totalKitchenCapacity: number;
}

export const createKitchenCategory = (body: unknown) =>
  privateApiInstance
    .post("core-app/kitchen/category/create", { json: body })
    .json<ApiResponse<KitchenCategory>>();

const appendKitchenPaginationParams = (searchParams: URLSearchParams, params?: KitchenListParams) => {
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.page_size) searchParams.append("page_size", params.page_size.toString());
};

export const getKitchenCategories = async (params?: KitchenListParams) => {
  const searchParams = new URLSearchParams();
  appendKitchenPaginationParams(searchParams, params);
  const queryString = searchParams.toString();

  const response = await privateApiInstance
    .get(`core-app/kitchen/category/list${queryString ? `?${queryString}` : ""}`)
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
} & KitchenListParams) => {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.append("category", params.category.toString());
  if (params?.search) searchParams.append("search", params.search);
  appendKitchenPaginationParams(searchParams, params);
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

export const getKitchenDashboard = () =>
  privateApiInstance
    .get("core-app/kitchen/dashboard")
    .json<ApiResponse<KitchenDashboard> | KitchenDashboard>()
    .then((response) => ("data" in response ? response.data : response));

export const updateKitchen = (id: number, body: unknown) =>
  privateApiInstance
    .patch(`core-app/kitchen/update/${id}`, { json: body })
    .json<ApiResponse<Kitchen>>();
