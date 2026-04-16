import { privateApiInstance } from "@/Utils/ky";
import type { ApiResponse, MenuCategory, MenuItem, PaginatedApiResponse } from "@/types/api";

export const createCategory = (body: unknown) =>
  privateApiInstance
    .post("core-app/menu/create", { json: body })
    .json<ApiResponse<MenuCategory>>();

export const getCategories = async () => {
  const response = await privateApiInstance
    .get("core-app/menu/list")
    .json<PaginatedApiResponse<MenuCategory>>();
  return response;
};

export const updateCategory = (id: number, body: unknown) =>
  privateApiInstance
    .patch(`core-app/menu/update/${id}`, { json: body })
    .json<ApiResponse<MenuCategory>>();

export const createMenuItem = (body: unknown) => {
  const options =
    body instanceof FormData
      ? { body }
      : {
          json: body,
        };

  return privateApiInstance
    .post("core-app/menu/items/create", options)
    .json<ApiResponse<MenuItem>>();
};

export const getMenuItems = async () => {
  const response = await privateApiInstance
    .get("core-app/menu/items/list")
    .json<PaginatedApiResponse<MenuItem>>();
  return response;
};

export const getMenuItem = (id: number) =>
  privateApiInstance
    .get(`core-app/menu/items/retrieve/${id}`)
    .json<ApiResponse<MenuItem>>();

export const updateMenuItem = (id: number, body: unknown) => {
  const options =
    body instanceof FormData
      ? { body }
      : {
          json: body,
        };

  return privateApiInstance
    .patch(`core-app/menu/items/update/${id}`, options)
    .json<ApiResponse<MenuItem>>();
};
