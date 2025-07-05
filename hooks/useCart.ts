import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: number | null;
  extension: string | null;
  sku: string;
  categoria: string;
  marca: string;
  nota?: string;
}

interface UseCartReturn {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'cantidad'> & { cantidad?: number }) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, cantidad: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isInCart: (id: number) => boolean;
  getItemQuantity: (id: number) => number;
  medioPago: string;
  setMedioPago: (medio: string) => void;
}

const CART_STORAGE_KEY = 'lzf_cart';
const MEDIO_PAGO_STORAGE_KEY = 'lzf_medio_pago';

const CartContext = createContext<UseCartReturn | undefined>(undefined);

export const useCart = (): UseCartReturn => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [medioPago, setMedioPagoState] = useState<string>('efectivo');

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      }
      
      const savedMedioPago = localStorage.getItem(MEDIO_PAGO_STORAGE_KEY);
      if (savedMedioPago) {
        setMedioPagoState(savedMedioPago);
      }
    } catch (error) {
      console.error('Error cargando carrito desde localStorage:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error guardando carrito en localStorage:', error);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(MEDIO_PAGO_STORAGE_KEY, medioPago);
    } catch (error) {
      console.error('Error guardando medio de pago en localStorage:', error);
    }
  }, [medioPago]);

  const addToCart = useCallback((item: Omit<CartItem, 'cantidad'> & { cantidad?: number }) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, cantidad: cartItem.cantidad + (item.cantidad || 1) }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, cantidad: item.cantidad || 1 }];
      }
    });
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: number, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id ? { ...item, cantidad } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const isInCart = useCallback((id: number) => {
    return cart.some(item => item.id === id);
  }, [cart]);

  const getItemQuantity = useCallback((id: number) => {
    const item = cart.find(item => item.id === id);
    return item ? item.cantidad : 0;
  }, [cart]);

  const setMedioPago = useCallback((medio: string) => {
    setMedioPagoState(medio);
  }, []);

  const totalItems = cart.reduce((total, item) => total + item.cantidad, 0);
  const totalPrice = cart.reduce((total, item) => total + (item.precio * item.cantidad), 0);

  const value: UseCartReturn = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isInCart,
    getItemQuantity,
    medioPago,
    setMedioPago
  };

  return React.createElement(CartContext.Provider, { value }, children);
};
