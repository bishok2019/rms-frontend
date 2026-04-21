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

  // Update an order item
  updateOrderItem: async (itemId: number, itemData: Partial<OrderItem>): Promise<ApiResponse<OrderItem>> => {
    return privateApiInstance
      .patch(`core-app/order_items/update/${itemId}`, { json: itemData })
      .json<ApiResponse<OrderItem>>();
  },

  // Get list of order items (for kitchen and table views)
  getOrderItemsList: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    order?: string;
    order_item__kitchen?: string;
    order__dining_table?: string;
    dietary_type?: string;
    spice_level?: string;
    order_type?: string;
    serving_size?: string;
  }): Promise<PaginatedApiResponse<OrderItem>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.page_size) searchParams.append("page_size", params.page_size.toString());
    if (params?.status) searchParams.append("status", params.status);
    if (params?.order) searchParams.append("order", params.order);
    if (params?.order_item__kitchen) searchParams.append("order_item__kitchen", params.order_item__kitchen);
    if (params?.order__dining_table) searchParams.append("order__dining_table", params.order__dining_table);
    if (params?.dietary_type) searchParams.append("dietary_type", params.dietary_type);
    if (params?.spice_level) searchParams.append("spice_level", params.spice_level);
    if (params?.order_type) searchParams.append("order_type", params.order_type);
    if (params?.serving_size) searchParams.append("serving_size", params.serving_size);

    const queryString = searchParams.toString();
    const url = `core-app/order_items/list${queryString ? `?${queryString}` : ""}`;

    return privateApiInstance.get(url).json<PaginatedApiResponse<OrderItem>>();
  },
};