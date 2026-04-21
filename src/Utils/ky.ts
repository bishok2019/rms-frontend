import ky, { HTTPError } from "ky";
import Cookies from "js-cookie";
import { errorFunction } from "../components/common/Alert";
import useAuthenticationStore from "../pages/Authentication/Store/authenticationStore";

const apiBaseUrl = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8001"
).replace(/\/$/, "");

const apiSocketUrl = import.meta.env.VITE_API_SOCKET_URL;

const getErrorMessage = (errorData: unknown) => {
  if (!errorData || typeof errorData !== "object") {
    return null;
  }

  const payload = errorData as {
    message?: string;
    detail?: string;
    errors?: Record<string, unknown>;
  };

  if (payload.message) {
    return payload.message;
  }

  if (payload.detail) {
    return payload.detail;
  }

  if (!payload.errors) {
    return null;
  }

  const [firstError] = Object.values(payload.errors);

  if (Array.isArray(firstError) && firstError.length > 0) {
    return String(firstError[0]);
  }

  if (typeof firstError === "string") {
    return firstError;
  }

  return null;
};

const handleApiError = async (error: HTTPError) => {
  if (
    error.name === "NetworkError" ||
    error.message.includes("Failed to fetch") ||
    !navigator.onLine
  ) {
    error.message = "Network unreachable";
    errorFunction("No Internet Connection. Please check your network.");
    return error;
  }

  const errorData = await error.response.clone().json().catch(() => null);
  const message =
    getErrorMessage(errorData) ||
    (error.response.status === 404
      ? "Page not found."
      : error.response.status === 500
        ? "Internal server error."
        : "Something went wrong.");

  if (error.response.status === 401 || error.response.status === 403) {
    useAuthenticationStore.getState().logout();
    if (window.location.pathname !== "/") {
      window.location.href = "/";
    }
  }

  error.message = message;
  errorFunction(message);
  return error;
};

const createKyInstance = ({
  includeAuth = false,
  prefixUrl,
}: {
  includeAuth?: boolean;
  prefixUrl: string;
}) =>
  ky.create({
    prefixUrl,
    retry: 0,
    hooks: {
      beforeRequest: [
        (request: Request) => {
          if (!includeAuth) {
            return;
          }

          const token = Cookies.get("accessToken");
          if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
          }
        },
      ],
      beforeError: [
        async (error) => {
          return handleApiError(error);
        },
      ],
    },
  });

export const publicApiInstance = createKyInstance({
  prefixUrl: `${apiBaseUrl}/api/v1`,
});

export const privateSocketInstance = apiSocketUrl
  ? createKyInstance({
      includeAuth: true,
      prefixUrl: apiSocketUrl,
    })
  : null;

export const privateApiInstance = createKyInstance({
  includeAuth: true,
  prefixUrl: `${apiBaseUrl}/api/v1`,
});
