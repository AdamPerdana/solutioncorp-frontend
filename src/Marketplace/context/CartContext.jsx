import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("solution_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("solution_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, qty) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item,
        );
      }
      return [...prevCart, { ...product, qty }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (id, change) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + change;
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0),
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // ✨ FUNGSI BARU: Untuk membersihkan isi Cart sekaligus menghapus data di localStorage
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("solution_cart");
  };

  const getTotalItems = () => cart.reduce((total, item) => total + item.qty, 0);
  const getSubtotal = () =>
    cart.reduce((total, item) => total + item.price * item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart, // ✨ Masukkan fungsi clearCart ke sini agar bisa dipanggil dari luar
        getTotalItems,
        getSubtotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
