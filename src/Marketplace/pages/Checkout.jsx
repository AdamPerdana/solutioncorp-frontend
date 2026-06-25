import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const { cart, clearCart } = useCart();

  // State nilai input form secara terkontrol
  const [nama, setNama] = useState("");
  const [telepon, setTelepon] = useState("");
  const [wilayah, setWilayah] = useState("");
  const [kurir, setKurir] = useState("");

  // State Notifikasi & Alur Transaksi Sukses
  const [errorNotif, setErrorNotif] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Daftar Dropdown Wilayah Jadetabek
  const listWilayah = [
    "Jakarta Timur",
    "Jakarta Barat",
    "Jakarta Pusat",
    "Jakarta Selatan",
    "Jakarta Utara",
    "Depok",
    "Tangerang",
    "Bekasi",
  ];

  // Hitung total harga barang
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.qty,
    0,
  );

  // 1. Proteksi & Batasan Nama Lengkap (Hanya Huruf, Spasi, Maksimal 30 Karakter)
  const handleNamaChange = (e) => {
    const value = e.target.value;
    const sanitizedName = value.replace(/[^a-zA-Z\s]/g, "");

    if (sanitizedName.length <= 30) {
      setNama(sanitizedName);
    }
  };

  // 2. Validasi Nomor Telepon (Wajib Angka, Maksimal 14 Digit, Harus Awalan 0 atau 6)
  const handleTeleponChange = (e) => {
    const value = e.target.value;
    const numbersOnly = value.replace(/[^0-9]/g, "");

    if (
      numbersOnly.length === 1 &&
      numbersOnly !== "0" &&
      numbersOnly !== "6"
    ) {
      return;
    }

    if (numbersOnly.length <= 14) {
      setTelepon(numbersOnly);
    }
  };

  // 3. Eksekusi Pengiriman Form Ke Admin WhatsApp
  const handleKirimWhatsApp = (e) => {
    e.preventDefault();
    setErrorNotif("");

    if (cart.length === 0) {
      setErrorNotif(
        "Keranjang belanja Anda masih kosong. Silakan pilih produk terlebih dahulu.",
      );
      return;
    }

    if (!nama.trim()) {
      setErrorNotif("Nama lengkap wajib diisi dengan benar.");
      return;
    }

    // Validasi Awalan Nomor Telepon (Wajib 08 atau 628)
    const formatBenar = /^(08|628)/.test(telepon);
    if (!formatBenar) {
      setErrorNotif("Nomor telepon tidak valid.");
      return;
    }

    if (telepon.length < 9) {
      setErrorNotif(
        "Nomor telepon tidak valid. Minimal harus terdiri dari 9 digit.",
      );
      return;
    }

    if (!wilayah) {
      setErrorNotif("Silakan pilih Wilayah Alamat pengiriman Anda.");
      return;
    }

    if (!kurir) {
      setErrorNotif("Silakan tentukan Layanan Kurir yang Anda inginkan.");
      return;
    }

    // Susun teks pesanan untuk dikirim ke WhatsApp
    let daftarBarang = "";
    cart.forEach((item, index) => {
      daftarBarang += `${index + 1}. ${item.name} (${item.qty} pcs)\n`;
    });

    const teksWA = `*Formulir Pemesanan Sterno - PT Solution Corp Indonesia* 🎯

Halo Admin Solution Corp, saya ingin memesan produk sterno dengan detail berikut:

--- DATA PEMBELI ---
• Nama Lengkap: ${nama}
• No. HP/WhatsApp: ${telepon}
• Wilayah Pengiriman: ${wilayah}

--- RINCIAN ORDER ---
${daftarBarang}
• Total Harga Barang: Rp ${subtotal.toLocaleString("id-ID")}
• Pilihan Kurir: ${kurir === "instant" ? "Instant (Gojek/Grab/Lalamove)" : "Kargo (Partai Besar/Luar Kota)"}

Mohon bantuannya untuk dihitungkan total ongkos kirim terbaik ke lokasi saya ya, Min. Terima kasih! 😊`;

    const nomorWhatsAppAdmin = "62123456789";

    window.open(
      `https://wa.me/${nomorWhatsAppAdmin}?text=${encodeURIComponent(teksWA)}`,
      "_blank",
    );

    setIsSuccess(true);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#111215] text-gray-400 font-sans flex flex-col relative selection:bg-emerald-500/30">
        <Navbar />

        <div className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full">
          {cart.length === 0 && !isSuccess ? (
            <div className="text-center py-20 bg-[#16171b] border border-gray-900 rounded-lg">
              <p className="text-sm text-gray-500 mb-4">
                Keranjang belanja anda kosong.
              </p>
              <Link
                to="/"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-6 py-3 rounded-md font-bold uppercase tracking-widest transition-colors"
              >
                Kembali ke Toko
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleKirimWhatsApp}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* FORM IDENTITAS (KIRI) */}
              <div className="lg:col-span-7 space-y-5">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Informasi Pengiriman
                </h3>

                {/* NOTIFIKASI ERROR INLINE */}
                {errorNotif && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-md flex items-center space-x-2 animate-pulse">
                    <span>⚠️</span>
                    <p>{errorNotif}</p>
                  </div>
                )}

                {/* INPUT NAMA LENGKAP */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-400 block">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={nama}
                    onChange={handleNamaChange}
                    required
                    placeholder="Masukkan nama lengkap (Maksimal 30 huruf)"
                    className="w-full bg-[#16171b]/50 border border-gray-800 text-white text-xs px-4 py-2.5 rounded-md focus:outline-none focus:border-gray-700 transition-colors"
                  />
                </div>

                {/* INPUT NOMOR TELEPON */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-400 block">
                    Nomor Telepon / WhatsApp{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="telepon"
                    value={telepon}
                    onChange={handleTeleponChange}
                    required
                    placeholder="Contoh: 08123456789 (Maksimal 14 digit)"
                    className="w-full bg-[#16171b]/50 border border-gray-800 text-white text-xs px-4 py-2.5 rounded-md focus:outline-none focus:border-gray-700 transition-colors"
                  />
                </div>

                {/* DROPDOWN WILAYAH */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-400 block">
                    Wilayah Alamat <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={wilayah}
                    onChange={(e) => setWilayah(e.target.value)}
                    required
                    className="w-full bg-[#16171b] border border-gray-800 text-white text-xs px-4 py-2.5 rounded-md focus:outline-none cursor-pointer focus:border-gray-700"
                  >
                    <option value="">-- Pilih Kota / Kabupaten --</option>
                    {listWilayah.map((item, idx) => (
                      <option key={idx} value={item}>
                        📍 {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* DROPDOWN LAYANAN KURIR */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-400 block">
                    Layanan Kurir <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={kurir}
                    onChange={(e) => setKurir(e.target.value)}
                    required
                    className="w-full bg-[#16171b] border border-gray-800 text-white text-xs px-4 py-2.5 rounded-md focus:outline-none cursor-pointer focus:border-gray-700"
                  >
                    <option value="">-- Pilih Jenis Pengiriman --</option>
                    <option value="instant">
                      Instant (Gojek/Grab/Lalamove)
                    </option>
                    <option value="kargo">
                      Kargo (Luar Kota / Partai Besar)
                    </option>
                  </select>
                </div>
              </div>

              {/* RINGKASAN BELANJA (KANAN) */}
              <div className="lg:col-span-5 bg-[#16171b] border border-gray-900 rounded-lg p-6 space-y-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-3">
                  Ringkasan Order
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-1"
                    >
                      <div>
                        <p className="font-bold text-gray-200">{item.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {item.qty} × {item.priceLabel}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-300">
                        Rp {(item.price * item.qty).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-800 pt-4 flex justify-between items-center text-white font-bold text-sm">
                  <span>Total Barang</span>
                  <span className="text-emerald-400 text-base">
                    Rp {subtotal.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="text-[10px] bg-[#111215] text-amber-500/90 p-3 rounded border border-gray-800 leading-relaxed">
                  <div className="text-[10px] bg-[#111215] text-amber-500/90 p-3 rounded border border-gray-800 leading-relaxed">
                    *Catatan: Biaya ongkos kirim belum termasuk dan akan
                    dihitung secara manual oleh Admin setelah Anda menekan
                    tombol di bawah.
                    <br />
                    <br />
                    Pembayaran hanya melalui transfer BCA
                    <br />
                    474-9999699 a/n PT SOLUTION CORP INDONESIA.
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-md shadow-xl transition-all active:scale-[0.99] text-center block"
                >
                  Selesaikan Pembelian Sekarang ➔
                </button>
              </div>
            </form>
          )}
        </div>

        {/* POP-UP SUKSES */}
        {isSuccess && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#16171b] border border-gray-800 max-w-sm w-full p-8 rounded-xl text-center space-y-5 shadow-2xl">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-2xl mx-auto border border-emerald-500/20">
                ✓
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white tracking-wide uppercase">
                  Pesanan Anda Sedang Diproses
                </h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Permintaan order telah kami terima. Selesaikan langkah akhir
                  di jendela WhatsApp yang terbuka agar tim kami bisa langsung
                  menyiapkan pengiriman produk Anda.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  clearCart();
                  window.location.href = "/";
                }}
                className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-widest py-2.5 rounded-md transition-colors text-center cursor-pointer"
              >
                Kembali ke Menu Utama
              </button>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </PageTransition>
  );
}
