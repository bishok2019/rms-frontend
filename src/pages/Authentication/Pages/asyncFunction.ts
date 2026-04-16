import { errorFunction } from "@/components/common/Alert";
import { publicApiInstance } from "@/Utils/ky";
import type { LocationOption, PaginatedApiResponse } from "@/types/api";

export interface SubTypes {
  id: string;
  name: string;
  isActive?: boolean;
}

export const fetchSubTypes = async (_search: string | undefined) => {
  return {
    results: [] as SubTypes[],
  };
};

export const fetchCountries = async (_search: string | undefined) => {
  return {
    results: [] as SubTypes[],
  };
};

const getLocationResults = async (path: string) => {
  try {
    const response = await publicApiInstance
      .get(path)
      .json<PaginatedApiResponse<LocationOption>>();

    return {
      results: response.data,
    };
  } catch (error: any) {
    errorFunction(error?.message);
    return {
      results: [] as LocationOption[],
    };
  }
};

export const fetchProvinces = async (search: string | undefined) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return getLocationResults(`location-app/provinces/list${query}`);
};

export const fetchDistricts = async (search: string | undefined) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return getLocationResults(`location-app/districts/list${query}`);
};

export const fetchPalikas = async (search: string | undefined) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return getLocationResults(`location-app/palika/list${query}`);
};

export const fetchWards = async (search: string | undefined) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return getLocationResults(`location-app/wards/list${query}`);
};

export const fetchDocumentTypes = async (_search: string | undefined) => {
  return {
    results: [] as SubTypes[],
  };
};
