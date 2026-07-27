import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  currency: string;
}

interface Visitor {
  id: string;
  email: string;
  name: string | null;
}

interface StorefrontContextType {
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  checkout: () => Promise<void>;
  checkingOut: boolean;
  visitor: Visitor | null;
  visitorLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => void;
  authOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  siteId: string;
}

const StorefrontContext = createContext<StorefrontContextType | null>(null);

export function useStorefront() {
  const ctx = useContext(StorefrontContext);
  if (!ctx) throw new Error('useStorefront must be used within StorefrontProvider');
  return ctx;
}

export function StorefrontProvider({ siteId, children }: { siteId: string; children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [visitorLoading, setVisitorLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem(`sf_session_${siteId}`);
    if (token) {
      supabase.functions.invoke('site-visitor-auth', {
        body: { action: 'verify', site_id: siteId, session_token: token, email: '' },
      }).then(({ data }) => {
        if (data?.visitor) setVisitor(data.visitor);
        setVisitorLoading(false);
      }).catch(() => setVisitorLoading(false));
    } else {
      setVisitorLoading(false);
    }

    // Restore cart
    const saved = localStorage.getItem(`sf_cart_${siteId}`);
    if (saved) {
      try { setCart(JSON.parse(saved)); } catch {}
    }
  }, [siteId]);

  // Persist cart
  useEffect(() => {
    localStorage.setItem(`sf_cart_${siteId}`, JSON.stringify(cart));
  }, [cart, siteId]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(c => c.product_id === item.product_id);
      if (existing) {
        return prev.map(c => c.product_id === item.product_id ? { ...c, quantity: c.quantity + quantity } : c);
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(c => c.product_id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId);
    setCart(prev => prev.map(c => c.product_id === productId ? { ...c, quantity } : c));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const checkout = useCallback(async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      const items = cart.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
      const { data, error } = await supabase.functions.invoke('create-product-checkout', {
        body: { site_id: siteId, items, visitor_email: visitor?.email },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } finally {
      setCheckingOut(false);
    }
  }, [cart, siteId, visitor]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.functions.invoke('site-visitor-auth', {
      body: { action: 'login', site_id: siteId, email, password },
    });
    if (error || data?.error) throw new Error(data?.error || 'Login failed');
    setVisitor(data.visitor);
    localStorage.setItem(`sf_session_${siteId}`, data.session_token);
    setAuthOpen(false);
  }, [siteId]);

  const signup = useCallback(async (email: string, password: string, name: string, phone?: string) => {
    const { data, error } = await supabase.functions.invoke('site-visitor-auth', {
      body: { action: 'signup', site_id: siteId, email, password, name, phone },
    });
    if (error || data?.error) throw new Error(data?.error || 'Signup failed');
    setVisitor(data.visitor);
    localStorage.setItem(`sf_session_${siteId}`, data.session_token);
    setAuthOpen(false);
  }, [siteId]);

  const logout = useCallback(() => {
    setVisitor(null);
    localStorage.removeItem(`sf_session_${siteId}`);
  }, [siteId]);

  return (
    <StorefrontContext.Provider value={{
      cart, cartOpen, setCartOpen, addToCart, removeFromCart, updateQuantity,
      clearCart, cartTotal, cartCount, checkout, checkingOut,
      visitor, visitorLoading, login, signup, logout, authOpen, setAuthOpen, siteId,
    }}>
      {children}
    </StorefrontContext.Provider>
  );
}
