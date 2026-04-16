/**
 * API functions for managing restaurant sections and dining tables.
 * This module provides CRUD operations for sections and dining tables used in the restaurant layout setup.
 */

import { privateApiInstance } from "@/Utils/ky";
import type { ApiResponse, DiningTable, PaginatedApiResponse, Section } from "@/types/api";

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
export const getSections = async () => {
  const response = await privateApiInstance
    .get("core-app/section/list")
    .json<PaginatedApiResponse<Section>>();

  return response;
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
export const getDiningTables = async () => {
  const response = await privateApiInstance
    .get("core-app/dining_table/list")
    .json<PaginatedApiResponse<DiningTable>>();
  return response;
};
