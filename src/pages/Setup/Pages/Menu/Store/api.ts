import { privateApiInstance } from "@/Utils/ky";
import type { ApiResponse, MenuCategory, MenuItem, PaginatedApiResponse } from "@/types/api";

export interface MenuDashboard {
  totalKitchens: number;
  totalMenus: number;
  totalMenuItems: number;
  activeMenuItems: number;
}

export interface MenuListParams {
  page?: number;
  page_size?: number;
}

export const createCategory = (body: unknown) => {
  const options =
    body instanceof FormData
      ? { body }
      : {
          json: body,
        };

  return privateApiInstance
    .post("core-app/menu/create", options)
    .json<ApiResponse<MenuCategory>>();
};

const buildMenuListQuery = (params?: MenuListParams) => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.page_size) searchParams.append("page_size", params.page_size.toString());
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export const getCategories = async (params?: MenuListParams) => {
  const response = await privateApiInstance
    .get(`core-app/menu/list${buildMenuListQuery(params)}`)
    .json<PaginatedApiResponse<MenuCategory>>();
  return response;
};

export const updateCategory = (id: number, body: unknown) => {
  const options =
    body instanceof FormData
      ? { body }
      : {
          json: body,
        };

  return privateApiInstance
    .patch(`core-app/menu/update/${id}`, options)
    .json<ApiResponse<MenuCategory>>();
};

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

export const getMenuItems = async (params?: MenuListParams) => {
  const response = await privateApiInstance
    .get(`core-app/menu/items/list${buildMenuListQuery(params)}`)
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

export const getMenuDashboard = () =>
  privateApiInstance
    .get("core-app/menu/dashboard")
    .json<ApiResponse<MenuDashboard> | MenuDashboard>()
    .then((response) => ("data" in response ? response.data : response));
