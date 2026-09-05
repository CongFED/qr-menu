'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// ============================================
// Cart Types
// ============================================

export interface CartItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  note: string;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'note'> & { quantity?: number; note?: string }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNote: (productId: string, note: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ============================================
// Cart Provider
// ============================================

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('qrmenu-cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {}
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('qrmenu-cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = useCallback(
    (newItem: Omit<CartItem, 'quantity' | 'note'> & { quantity?: number; note?: string }) => {
      setItems((prev) => {
        const existing = prev.find((item) => item.productId === newItem.productId);
        if (existing) {
          return prev.map((item) =>
            item.productId === newItem.productId
              ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
              : item
          );
        }
        return [...prev, { ...newItem, quantity: newItem.quantity || 1, note: newItem.note || '' }];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    );
  }, []);

  const updateNote = useCallback((productId: string, note: string) => {
    setItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, note } : item))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, updateNote, clearCart, totalItems, totalAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
