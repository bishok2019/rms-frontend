import { privateApiInstance } from "../Utils/ky";
import type { ApiResponse, PaginatedApiResponse, Order, OrderItem } from "../types/api";

export const ordersApi = {
  // Get list of orders with pagination
  getOrders: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedApiResponse<Order>> => {
    console.log("API: getOrders called with params:", params);
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.page_size) searchParams.append("page_size", params.page_size.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.status) searchParams.append("status", params.status);

    const queryString = searchParams.toString();
    const url = `core-app/orders/list${queryString ? `?${queryString}` : ""}`;
    console.log("API: Making request to:", url);

    const response = await privateApiInstance.get(url).json<PaginatedApiResponse<Order>>();
    console.log("API: getOrders response:", response);
    return response;
  },

  // Get single order details with order items
  getOrderDetails: async (orderId: number): Promise<ApiResponse<Order>> => {
    return privateApiInstance
      .get(`core-app/orders/retrieve/${orderId}`)
      .json<ApiResponse<Order>>();
  },

  // Get order items for a specific order
  getOrderItems: async (orderId: number): Promise<ApiResponse<OrderItem[]>> => {
    return privateApiInstance
      .get(`core-app/order_items/list?order=${orderId}`)
      .json<ApiResponse<OrderItem[]>>();
  },

  // Create a new order
  createOrder: async (orderData: Partial<Order>): Promise<ApiResponse<Order>> => {
    return privateApiInstance
      .post("core-app/orders/create", { json: orderData })
      .json<ApiResponse<Order>>();
  },

  // Update an existing order
  updateOrder: async (orderId: number, orderData: Partial<Order>): Promise<ApiResponse<Order>> => {
    return privateApiInstance
      .patch(`core-app/orders/update/${orderId}`, { json: orderData })
      .json<ApiResponse<Order>>();
  },
};