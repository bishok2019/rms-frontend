import Cookies from "js-cookie";
import { publicApiInstance, privateApiInstance } from "../../../Utils/ky";
import type { ApiResponse, LoginResponse } from "@/types/api";

export interface LoginType {
  username: string;
  password: string;
}

export interface RegisterType {
  username: string;
  email: string;
  password?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  mobileNo?: string | number;
  phoneNo?: string | number;
  subType?: string | undefined | unknown | number;
  district?: number | null;
  wardNo?: number;
  palika?: string;
  tole?: string;
}

export interface LoginStore {
  isAuthenticated: boolean;
  isProfileVerified: boolean;
  user: {
    id: number;
    name: string;
    username: string;
    email: string | null;
  } | null;
  email: string;
  username: string; // Added username field
  phoneNo: string | number;
  isAdmin: boolean;
  permissions: string[];
  roles: string[];
  loggedInUserId: string;
  setLoggedInUserId: (id: string) => void;
  setAuthenticated: (value: boolean) => void;
  setProfileVerified: (value: boolean) => void;
  setUser: (user: LoginStore["user"]) => void;
  setUsername: (username: string) => void;
  setEmail: (value: string) => void;
  setPhoneNo: (value: string | number) => void;
  logout: (navigate?: any) => void;
  setAdmin: (value: boolean) => void;
  setPermissions: (permissions: string[]) => void;
  setRoles: (roles: string[]) => void;
}

export const login = (body: LoginType) =>
  publicApiInstance
    .post("auth-app/login", {
      json: body,
    })
    .json<LoginResponse>();

export const register = (body: RegisterType) =>
  publicApiInstance
    .post("auth-app/user-sign-up", {
      json: body,
    })
    .json<ApiResponse<RegisterType>>();

export const forgotPassword = (body: {
  email: string;
  code: string;
}) => publicApiInstance.post(`auth-app/forget-password`, { json: body }).json<ApiResponse<unknown>>();

export const resetPassword = (body: {
  otp: string;
  newPassword: string;
}) =>
  publicApiInstance
    .post(`auth-app/change-password-otp`, {
      json: {
        otp: body.otp,
        new_password: body.newPassword,
      },
    })
    .json<ApiResponse<unknown>>();

export interface UserProfileResponse {
  id?: number;
  user?: {
    id?: number;
    username?: string;
    email?: string | null;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    fullName?: string;
    photo?: string;
  };
  username?: string;
  email?: string | null;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
}

export const getUserProfile = () =>
  privateApiInstance
    .get("auth-app/get-user-profile")
    .json<ApiResponse<UserProfileResponse>>();

export interface UpdateProfilePayload {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  profile: {
    bio?: string;
  };
}

export const updateProfile = (body: UpdateProfilePayload | FormData) => {
  const options =
    body instanceof FormData
      ? { body }
      : {
          json: body,
        };

  return privateApiInstance
    .patch("auth-app/update-profile", options)
    .json<ApiResponse<unknown>>();
};

export const changePassword = (body: {
  password: string;
}) =>
  publicApiInstance
    .post(`auth-app/change-password-otp`, { json: body })
    .json<ApiResponse<unknown>>();

export interface User {
  id: number;
  email: string | null;
  username: string;
  photo?: string;
  isActive: boolean;
  isSuperuser: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  userType: string;
  mobileNo?: string;
  roles: Array<{
    id: number;
    name: string;
  }>;
  profile?: {
    id: number;
    bio?: string;
  } | null;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  district?: number;
  palika?: string;
  wardNo?: number;
  tole?: string;
  mobileNo?: string;
  isActive?: boolean;
  userType?: string;
  password?: string;
}

export interface CreateUserData {
  id?: number;
  email?: string;
  username: string;
  password: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  district?: number;
  palika?: string;
  wardNo?: number;
  tole?: string;
  mobileNo?: string;
  photo?: string;
  isActive?: boolean;
  userType: string;
}

export interface UserFilters {
  username?: string;
  email?: string;
  user_type?: string;
  is_active?: boolean;
  gender?: string;
  district?: number;
}

export const fetchUsers = (filters?: UserFilters) => {
  const searchParams = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
  }
  const queryString = searchParams.toString();
  return privateApiInstance
    .get(`auth-app/users/list${queryString ? `?${queryString}` : ''}`)
    .json<ApiResponse<User[]>>();
};

export const updateUser = (id: number, body: UpdateUserData) =>
  privateApiInstance
    .patch(`auth-app/users/update/${id}`, { json: body })
    .json<ApiResponse<User>>();

export const createUser = (body: CreateUserData) =>
  privateApiInstance
    .post("auth-app/users/create", { json: body })
    .json<ApiResponse<User>>();

export const logout = () => {
  const refreshToken = Cookies.get("refreshToken");
  return privateApiInstance
    .post("auth-app/logout", { json: { refreshToken } })
    .json<ApiResponse<null>>();
};
