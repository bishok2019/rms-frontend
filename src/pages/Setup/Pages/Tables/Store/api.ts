/**
 * API functions for managing restaurant sections and dining tables.
 * This module provides CRUD operations for sections and dining tables used in the restaurant layout setup.
 */

import { privateApiInstance } from "@/Utils/ky";
import type { ApiResponse, DiningTable, PaginatedApiResponse, Section } from "@/types/api";

export interface DiningTableDashboard {
  totalTables: number;
  occupiedTables: number;
  availableTables: number;
  totalAreas: number;
  totalSeats: number;
}

export interface TableListParams {
  page?: number;
  page_size?: number;
}

/**
 * Creates a new section in the restaurant layout.
 * @param body - The section data to create
 * @returns Promise resolving to API response containing the created section
 */
export const createSection = (body: unknown) =>
  privateApiInstance
    .post("core-app/section/create", { json: body })
    .json<ApiResponse<Section>>();

/**
 * Updates an existing section by its ID.
 * @param id - The ID of the section to update
 * @param body - The updated section data
 * @returns Promise resolving to API response containing the updated section
 */
export const updateSection = (id: number, body: unknown) =>
  privateApiInstance
    .patch(`core-app/section/update/${id}`, { json: body })
    .json<ApiResponse<Section>>();

/**
 * Retrieves a paginated list of all sections in the restaurant.
 * @returns Promise resolving to paginated API response containing sections
 */
const appendPaginationParams = (searchParams: URLSearchParams, params?: TableListParams) => {
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.page_size) {
    searchParams.append("page_size", params.page_size.toString());
    searchParams.append("limit", params.page_size.toString());
  }
};

type ListApiResponse<T> = Partial<PaginatedApiResponse<T>> & {
  count?: number;
  results?: T[];
};

const normalizePaginatedResponse = <T,>(
  response: ListApiResponse<T>,
  params?: TableListParams
): PaginatedApiResponse<T> => {
  const data = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.results)
      ? response.results
      : [];
  const pageSize = params?.page_size ?? (data.length || 1);
  const totalCount = response.totalCount ?? response.count ?? data.length;

  return {
    success: response.success ?? true,
    message: response.message ?? "",
    data,
    totalCount,
    currentCount: response.currentCount ?? data.length,
    totalPages: response.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize)),
    currentPage: response.currentPage ?? params?.page ?? 1,
    next: response.next ?? null,
    previous: response.previous ?? null,
  };
};

export const getSections = async (params?: TableListParams) => {
  const searchParams = new URLSearchParams();
  appendPaginationParams(searchParams, params);
  const queryString = searchParams.toString();

  const response = await privateApiInstance
    .get(`core-app/section/list${queryString ? `?${queryString}` : ""}`)
    .json<ListApiResponse<Section>>();

  return normalizePaginatedResponse(response, params);
};

/**
 * Creates a new dining table in the restaurant.
 * @param body - The dining table data to create
 * @returns Promise resolving to API response containing the created dining table
 */
export const createDiningTable = (body: unknown) =>
  privateApiInstance
    .post("core-app/dining_table/create", { json: body })
    .json<ApiResponse<DiningTable>>();

/**
 * Updates an existing dining table by its ID.
 * @param id - The ID of the dining table to update
 * @param body - The updated dining table data
 * @returns Promise resolving to API response containing the updated dining table
 */
export const updateDiningTable = (id: number, body: unknown) =>
  privateApiInstance
    .patch(`core-app/dining_table/update/${id}`, { json: body })
    .json<ApiResponse<DiningTable>>();

/**
 * Retrieves a paginated list of all dining tables in the restaurant.
 * @returns Promise resolving to paginated API response containing dining tables
 */
export const getDiningTables = async (params?: {
  section__name?: string;
  search?: string;
  is_occupied?: boolean;
} & TableListParams) => {
  const searchParams = new URLSearchParams();
  if (params?.section__name) searchParams.append("section__name", params.section__name);
  if (params?.search) searchParams.append("search", params.search);
  if (params?.is_occupied !== undefined) searchParams.append("is_occupied", params.is_occupied.toString());
  appendPaginationParams(searchParams, params);

  const queryString = searchParams.toString();
  const url = `core-app/dining_table/list${queryString ? `?${queryString}` : ""}`;

  const response = await privateApiInstance
    .get(url)
    .json<ListApiResponse<DiningTable>>();
  return normalizePaginatedResponse(response, params);
};

export const getDiningTableDashboard = () =>
  privateApiInstance
    .get("core-app/dining_table/dashboard")
    .json<ApiResponse<DiningTableDashboard> | DiningTableDashboard>()
    .then((response) => ("data" in response ? response.data : response));
