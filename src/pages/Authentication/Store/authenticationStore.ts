import { useMutation } from "@tanstack/react-query";
import {
  changePassword,
  forgotPassword,
  login,
  register,
  resetPassword,
  type LoginType,
  type LoginStore,
  type RegisterType,
} from "./api";
import Cookies from "js-cookie";
import { persist } from "zustand/middleware";
import { create } from "zustand";
import {
  errorFunction,
  successFunction,
} from "../../../components/common/Alert";
import type { LoginResponse } from "@/types/api";

// login mutation
export const useLoginMutation = (navigate: any) => {
  return useMutation({
    mutationFn: (data: LoginType) => {
      return login(data);
    },
    onSuccess: (data: LoginResponse) => {
      useAuthenticationStore.getState().setLoggedInUserId(String(data.id));
      useAuthenticationStore.getState().setUsername(data.username);
      useAuthenticationStore.getState().setAuthenticated(true);
      useAuthenticationStore.getState().setProfileVerified(true);
      useAuthenticationStore
        .getState()
        .setEmail(data.email || "");
      useAuthenticationStore
        .getState()
        .setPhoneNo("");
      useAuthenticationStore.getState().setAdmin(data.isSuperuser);
      useAuthenticationStore
        .getState()
        .setPermissions(data.permissions || []);
      useAuthenticationStore
        .getState()
        .setRoles(data.roles || []);
      useAuthenticationStore.getState().setUser({
        id: data.id,
        name: data.fullName || data.username,
        username: data.username,
        email: data.email,
      });

      Cookies.set("accessToken", data.access, {
        sameSite: "strict",
      });
      Cookies.set("refreshToken", data.refresh, {
        sameSite: "strict",
      });
      navigate("/");

      successFunction(data.message || "Logged in successfully.");
    },
    onError: (error: any) => {
      errorFunction(error?.message);
    },
  });
};

// register mutation
export const useRegisterMutation = (navigate: any) => {
  return useMutation({
    mutationFn: (data: RegisterType) => {
      return register(data);
    },
    onSuccess: () => {
      successFunction("Account created successfully. You can sign in now.");
      navigate("/");
    },
    onError: (error: any) => {
      errorFunction(error?.message);
    },
  });
};

// forgot password mutation
export const useForgotPasswordMutation = (navigate: any) => {
  return useMutation({
    mutationFn: (data: {
      email: string;
      code: string;
    }) => {
      const body = { ...data };
      return forgotPassword(body);
    },
    onSuccess: (_data, variables) => {
      localStorage.setItem("forgotEmail", variables.email);
      localStorage.setItem("forgotCode", variables.code);
      navigate("/reset-password");
      successFunction("OTP has been sent to your email address.");
    },
    onError: (error: any) => {
      errorFunction(error?.message);
    },
  });
};

// reset password mutation
export const useResetPasswordMutation = (navigate: any) => {
  return useMutation({
    mutationFn: (data: { otp: string; newPassword: string }) => {
      const body = { ...data };
      return resetPassword(body);
    },
    onSuccess: () => {
      navigate("/");
      successFunction(
        "Password has been successfully reset. Proceed to login."
      );
    },
    onError: (error: any) => {
      errorFunction(error?.message);
    },
  });
};

export const useResendOTPMutation = () => {
  return useMutation({
    mutationFn: (data: { email: string; code: string }) => {
      return forgotPassword(data);
    },
    onSuccess: () => {
      successFunction("OTP resent successfully.");
    },
    onError: (error: any) => {
      errorFunction(error?.message);
    },
  });
};

// change password mutation
export const useChangePasswordMutation = (navigate: any) => {
  return useMutation({
    mutationFn: (data: {
      password: string;
    }) => {
      const body = { ...data };

      return changePassword(body);
    },
    onSuccess: () => {
      successFunction(
        "Password has been successfully changed. Login with new password."
      );
      useAuthenticationStore.getState().logout(navigate);
      navigate("/");
    },
    onError: (error: any) => {
      errorFunction(error?.message);
    },
  });
};

const useAuthenticationStore = create<LoginStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isProfileVerified: false,
      user: null,
      email: "",
      phoneNo: "",
      username: "",
      loggedInUserId: "",
      isAdmin: false,
      permissions: [],
      roles: [],

      setAuthenticated: (value: boolean) => set({ isAuthenticated: value }),
      setProfileVerified: (value: boolean) => set({ isProfileVerified: value }),
      setUser: (user) => set({ user }),
      setEmail: (value: string) => set({ email: value }),
      setPhoneNo: (value: string | number) => set({ phoneNo: value }),
      setUsername: (value: string) => set({ username: value }),
      setLoggedInUserId: (id: string) => set({ loggedInUserId: id }),
      setAdmin: (value: boolean) => set({ isAdmin: value }),
      setPermissions: (permissions: string[]) => set({ permissions }),
      setRoles: (roles: string[]) => set({ roles }),
      logout: (navigate?: any) => {
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        set({
          isAuthenticated: false,
          isProfileVerified: false,
          user: null,
          email: "",
          phoneNo: "",
          username: "",
          isAdmin: false,
          permissions: [],
          roles: [],
          loggedInUserId: "",
        });
        localStorage.removeItem("bishok-pos");

        if (navigate) {
          successFunction("Logged out successfully.");
          navigate("/");
        }
      },
    }),
    { name: "bishok-pos" }
  )
);
export default useAuthenticationStore;
