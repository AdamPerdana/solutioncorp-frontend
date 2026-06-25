import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const {
    cart,
    getTotalItems,
    getSubtotal,
    updateCartQty,
    removeFromCart,
    isCartOpen,
    setIsCartOpen,
  } = useCart();
  const navigate = useNavigate();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openDeleteConfirmation = (id, onCancelCallback = null) => {
    setDeleteTarget({ id, onCancel: onCancelCallback });
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      removeFromCart(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleCancelDelete = () => {
    if (deleteTarget && deleteTarget.onCancel) {
      deleteTarget.onCancel();
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 2px;
        }
      `}</style>

      <nav className="bg-[#111215] border-b border-gray-900 text-gray-300 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 text-gray-400 hover:text-white focus:outline-none text-xl"
              >
                ☰
              </button>
            </div>

            {/* BRAND LOGO */}
            <div className="flex-shrink-0 flex items-center">
              <Link
                to="/"
                className="text-xs sm:text-sm font-black tracking-widest text-white uppercase"
              >
                PT SOLUTION CORP INDONESIA
              </Link>
            </div>

            {/* DESKTOP MENU: Sembunyi di HP, Muncul di PC (hidden md:flex) */}
            <div className="hidden md:flex space-x-8 text-[11px] font-bold uppercase tracking-widest">
              <Link to="/" className="hover:text-emerald-400 transition-colors">
                Home
              </Link>
              <Link
                to="/about"
                className="hover:text-emerald-400 transition-colors"
              >
                About Us
              </Link>
            </div>

            {/* TOMBOL KERANJANG BELANJA */}
            <div className="flex items-center space-x-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors focus:outline-none"
              >
                <span className="text-lg">🛒</span>

                <AnimatePresence>
                  {getTotalItems() > 0 && (
                    <motion.span
                      key={getTotalItems()}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      className="absolute top-0.5 right-0.5 inline-flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-black leading-none text-gray-900 bg-emerald-400 rounded-full"
                    >
                      {getTotalItems()}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* ==========================================================
          [ MENU NAVIGASI SAMPING UNTUK LAYAR HP ]
          ========================================================== */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden font-sans flex justify-start md:hidden">
            {/* Backdrop Gelap */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Panel Navigasi Samping */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="w-72 bg-[#111215] shadow-2xl flex flex-col justify-between relative z-10 h-full border-r border-gray-900"
            >
              <div className="p-6 space-y-8">
                {/* Header Menu Samping */}
                <div className="flex items-center justify-between border-b border-gray-900 pb-4">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    Navigasi
                  </span>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-500 hover:text-white text-xs focus:outline-none"
                  >
                    Tutup ✕
                  </button>
                </div>

                {/* Link Daftar Menu */}
                <div className="flex flex-col space-y-6 text-xs font-bold uppercase tracking-widest">
                  <Link
                    to="/"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-300 hover:text-emerald-400 transition-colors py-1"
                  >
                    Home
                  </Link>
                  <Link
                    to="/about"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-300 hover:text-emerald-400 transition-colors py-1"
                  >
                    About Us
                  </Link>
                </div>
              </div>

              {/* Catatan Kaki di paling bawah Sidebar Menu */}
              <div className="p-6 border-t border-gray-900/40 text-[9px] text-gray-600 tracking-wider">
                PT SOLUTION CORP INDONESIA
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================================
          [ SIDE CART PANEL ]
          ========================================================== */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden font-sans flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsCartOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="w-screen max-w-md bg-[#111215] shadow-2xl flex flex-col justify-between relative z-10 h-full border-l border-gray-900/40"
            >
              <div className="p-6 flex items-center justify-between">
                <h2 className="text-xs font-bold text-white uppercase tracking-widest">
                  Keranjang Belanja
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-gray-500 hover:text-white text-xs focus:outline-none tracking-widest uppercase"
                >
                  Tutup ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll">
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-xs text-gray-600 space-y-2">
                    <p className="text-2xl">🛒</p>
                    <p>Keranjang belanja anda masih kosong.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      updateCartQty={updateCartQty}
                      openDeleteConfirmation={openDeleteConfirmation}
                    />
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-[#16171b] space-y-5">
                  <div className="flex justify-between items-center text-xs uppercase tracking-wider border-t border-gray-800/40 pt-4">
                    <span className="font-bold text-gray-400">Subtotal:</span>
                    <span className="text-sm font-black text-white">
                      Rp {getSubtotal().toLocaleString("id-ID")}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate("/checkout");
                    }}
                    className="w-full bg-black hover:bg-[#1f2026] text-white text-[11px] font-bold uppercase tracking-widest py-4 rounded-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2 shadow-xl"
                  >
                    <span>Pembayaran</span>
                    <span className="text-xs">➔</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={handleCancelDelete}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#16171b] border border-gray-900 rounded-lg max-w-sm w-full p-6 shadow-2xl relative z-10 space-y-6 text-center"
            >
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                  Hapus Produk
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Apakah anda yakin untuk menghapus produk ini dari keranjang
                  belanja?
                </p>
              </div>

              <div className="flex space-x-3 text-[10px] font-bold uppercase tracking-widest">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="flex-1 bg-transparent hover:bg-gray-800 border border-gray-800 text-gray-400 py-2.5 rounded transition-colors focus:outline-none"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600/90 hover:bg-red-600 text-white py-2.5 rounded transition-colors focus:outline-none"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ==========================================================
// [ DETAIL ROW PRODUK ]
// ==========================================================
function CartItemRow({ item, updateCartQty, openDeleteConfirmation }) {
  const [localQty, setLocalQty] = useState(item.qty);

  useEffect(() => {
    setLocalQty(item.qty);
  }, [item.qty]);

  return (
    <div className="flex items-center justify-between group relative py-1">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => openDeleteConfirmation(item.id)}
          className="absolute -left-2 -top-1 bg-red-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center z-10 shadow transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100"
        >
          ✕
        </button>

        {/* Thumbnail Produk */}
        <div className="w-12 h-12 bg-white flex items-center justify-center rounded shadow-sm overflow-hidden flex-shrink-0 border border-gray-800/40">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl">🔥</span>
          )}
        </div>

        <div className="space-y-0.5">
          <h4 className="text-[11px] font-bold text-gray-200 uppercase tracking-wide truncate max-w-[160px]">
            {item.name}
          </h4>
          <p className="text-[10px] text-gray-500 tracking-wider">
            {item.qty} × {item.priceLabel}
          </p>
        </div>
      </div>

      {/* Kontrol Kuantitas */}
      <div className="flex items-center bg-[#16171b] rounded h-6 px-1 border border-gray-900/40">
        <button
          type="button"
          onClick={() => {
            if (item.qty > 1) {
              updateCartQty(item.id, -1);
            } else {
              openDeleteConfirmation(item.id, () => {
                setLocalQty(1);
                updateCartQty(item.id, 1 - item.qty);
              });
            }
          }}
          className="px-1.5 text-[10px] font-bold text-gray-600 hover:text-white transition-colors focus:outline-none"
        >
          -
        </button>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localQty === 0 ? "" : localQty}
          onChange={(e) => {
            const valText = e.target.value.replace(/[^0-9]/g, "");
            if (valText === "") {
              setLocalQty(0);
            } else {
              const val = parseInt(valText, 10);
              setLocalQty(val);
              if (val > 0) {
                updateCartQty(item.id, val - item.qty);
              }
            }
          }}
          onBlur={() => {
            if (localQty === 0 || localQty === "") {
              openDeleteConfirmation(item.id, () => {
                setLocalQty(1);
                updateCartQty(item.id, 1 - item.qty);
              });
            }
          }}
          className="w-7 bg-transparent text-center text-[10px] font-bold text-white focus:outline-none"
        />

        <button
          type="button"
          onClick={() => updateCartQty(item.id, 1)}
          className="px-1.5 text-[10px] font-bold text-gray-600 hover:text-white transition-colors focus:outline-none"
        >
          +
        </button>
      </div>
    </div>
  );
}
