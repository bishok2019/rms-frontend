import { create } from "zustand";
import type { Order } from "../types/api";

interface OrdersState {
  orders: Order[];
  selectedOrder: Order | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setOrders: (orders: Order[]) => void;
  setSelectedOrder: (order: Order | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  selectedOrder: null,
  isLoading: false,
  error: null,

  setOrders: (orders) => {
    console.log("Setting orders:", orders);
    set({ orders });
  },
  setSelectedOrder: (order) => {
    console.log("Setting selected order:", order);
    set({ selectedOrder: order });
  },
  setLoading: (loading) => {
    console.log("Setting loading:", loading);
    set({ isLoading: loading });
  },
  setError: (error) => {
    console.log("Setting error:", error);
    set({ error });
  },
  clearError: () => {
    console.log("Clearing error");
    set({ error: null });
  },
}));