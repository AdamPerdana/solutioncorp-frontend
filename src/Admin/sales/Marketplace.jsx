import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import { apiRequest } from "../../api";
import "react-toastify/dist/ReactToastify.css";

export default function Marketplace() {
  const [produkGudang, setProdukGudang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tanggalLog, setTanggalLog] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [inputQtyMasingMasing, setInputQtyMasingMasing] = useState({});
  const [showModalClear, setShowModalClear] = useState(false);
  const [showModalSettle, setShowModalSettle] = useState(false);

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("pos_mp_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("pos_mp_cart", JSON.stringify(cart));
  }, [cart]);

  // ==========================================================
  // [DATA FETCHING WITH JWT AUTHORIZATION]
  // ==========================================================

  useEffect(() => {
    fetchKatalogProdukGudang();
  }, []);

  const fetchKatalogProdukGudang = async () => {
    try {
      const data = await apiRequest("/api/inventory/products/");
      if (data) {
        const dataDipetakan = data.map((item) => ({
          id: item.id,
          sku: item.sku,
          nama: item.nama,
          harga: item.harga || item.harga_jual || 0,
          stokAktual: item.stok_aktual ?? item.stokAktual ?? 0,
        }));
        setProdukGudang(dataDipetakan);
      }
    } catch (error) {
      console.error("Gagal sinkronisasi produk:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUbahQtyInputKatalog = (sku, value) => {
    setInputQtyMasingMasing((prev) => ({
      ...prev,
      [sku]: value,
    }));
  };

  // ==========================================================
  // [ TAMBAH EKSEKUSI MANUAl / COUNTER ]
  // ==========================================================

  const handleTambahKeKeranjangMassal = (produk) => {
    const rawQty = inputQtyMasingMasing[produk.sku];
    const kuantitasTambahan = rawQty && rawQty !== "" ? parseInt(rawQty) : 1;

    if (kuantitasTambahan <= 0) {
      return toast.warning("Kuantitas input harus lebih besar dari 0!");
    }

    const itemEksisIdx = cart.findIndex((item) => item.sku === produk.sku);

    if (itemEksisIdx !== -1) {
      setCart((prev) =>
        prev.map((item, idx) =>
          idx === itemEksisIdx
            ? {
                ...item,
                qty: item.qty + kuantitasTambahan,
                total: (item.qty + kuantitasTambahan) * item.harga,
              }
            : item,
        ),
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          sku: produk.sku,
          nama: produk.nama,
          qty: kuantitasTambahan,
          harga: produk.harga,
          total: produk.harga * kuantitasTambahan,
        },
      ]);
    }

    setInputQtyMasingMasing((prev) => ({
      ...prev,
      [produk.sku]: "",
    }));

    toast.success(`${kuantitasTambahan} Pcs ${produk.nama} masuk draf.`, {
      autoClose: 1000,
    });
  };

  const handleTambahQtySatu = (sku) => {
    setCart((prev) =>
      prev.map((item) =>
        item.sku === sku
          ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * item.harga }
          : item,
      ),
    );
  };

  const handleKurangiQty = (sku) => {
    const item = cart.find((item) => item.sku === sku);
    if (!item) return;

    if (item.qty === 1) {
      setCart((prev) => prev.filter((i) => i.sku !== sku));
    } else {
      setCart((prev) =>
        prev.map((i) =>
          i.sku === sku
            ? { ...i, qty: i.qty - 1, total: (i.qty - 1) * i.harga }
            : i,
        ),
      );
    }
  };

  const handleUbahHargaDirect = (sku, hargaBaru) => {
    const nominal = parseInt(hargaBaru) || 0;
    setCart((prev) =>
      prev.map((item) =>
        item.sku === sku
          ? { ...item, harga: nominal, total: item.qty * nominal }
          : item,
      ),
    );
  };

  const handleHapusItemCart = (sku) => {
    setCart((prev) => prev.filter((item) => item.sku !== sku));
  };

  const handleKonfirmasiClearManual = () => {
    setCart([]);
    localStorage.removeItem("pos_mp_cart");
    setShowModalClear(false);
    toast.info("Draf rekap jualan dibersihkan.");
  };

  const filteredProduk = useMemo(() => {
    return produkGudang.filter(
      (p) =>
        p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [produkGudang, searchTerm]);

  const totalCatatanJualan = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  // ==========================================================
  // [ SETTLE DENGAN CONFIRMATION ]
  // ==========================================================

  const handleEksekusiSettleServer = async () => {
    setShowModalSettle(false);
    const idToastSettle = toast.loading(
      "Memproses settle log harian & sinkronisasi laporan sales...",
    );

    try {
      const resData = await apiRequest(
        "/api/sales/pos-transactions/settle-harian/",
        {
          method: "POST",
          body: JSON.stringify({
            tanggal: tanggalLog,
            total_penjualan: totalCatatanJualan,
            items: cart,
          }),
        },
      );

      if (resData) {
        toast.update(idToastSettle, {
          render:
            "Sukses Settle! Stok gudang terpotong dan data masuk ke laporan penjualan sales",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        setCart([]);
        localStorage.removeItem("pos_mp_cart");
        fetchKatalogProdukGudang();
      }
    } catch (error) {
      toast.update(idToastSettle, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 font-sans flex flex-col">
      <ToastContainer theme="dark" />

      {/* HEADER DASHBOARD */}
      <div className="pb-4 border-b border-gray-800 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide">
            🏪 Marketplace POS
          </h2>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-xl select-none">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Tanggal Settle:
          </span>
          <input
            type="date"
            value={tanggalLog}
            onChange={(e) => setTanggalLog(e.target.value)}
            className="bg-[#15171c] text-xs font-mono font-black text-emerald-400 border border-gray-800 rounded-lg p-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer [color-scheme:dark]"
          />
        </div>
      </div>

      {/*CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start flex-1">
        {/* PANEL KIRI: KATALOG STOK READY GUDANG */}
        <div className="xl:col-span-5 bg-[#1a1c23] border border-gray-800 rounded-2xl p-4 shadow-2xl flex flex-col h-[calc(100vh-175px)]">
          <div className="pb-3 border-b border-gray-800/80 mb-3">
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 select-none">
              <span>📦</span> Katalog SKU Gudang
            </div>
            <input
              type="text"
              placeholder="Cari nama produk sterno / kode SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#15171c] border border-gray-800 rounded-xl p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-medium tracking-wide shadow-inner"
            />
          </div>

          <div className="overflow-y-auto flex-1 space-y-2.5 pr-1 max-h-[calc(100vh-280px)] custom-scrollbar">
            {loading ? (
              <p className="text-xs text-center text-gray-500 italic py-8 animate-pulse">
                Menghubungkan data gudang server...
              </p>
            ) : filteredProduk.length === 0 ? (
              <p className="text-xs text-center text-gray-500 italic py-8">
                Artikel produk tidak ditemukan.
              </p>
            ) : (
              filteredProduk.map((prod) => (
                <div
                  key={prod.sku}
                  className="bg-[#15171c] border border-gray-800/40 rounded-xl p-3 flex items-center justify-between hover:border-gray-700 hover:bg-[#181a22] transition-all shadow-sm"
                >
                  <div className="space-y-0.5 max-w-[55%]">
                    <span className="text-[9px] font-mono text-blue-400 font-bold tracking-wider block uppercase">
                      {prod.sku}
                    </span>
                    <h4
                      className="text-xs font-bold text-white truncate"
                      title={prod.nama}
                    >
                      {prod.nama}
                    </h4>
                    <div className="flex items-center gap-3 pt-0.5 text-[11px] select-none">
                      <span className="text-gray-400 font-bold">
                        Rp {prod.harga.toLocaleString("id-ID")}
                      </span>
                      <span className="text-gray-600">|</span>
                      <span className="text-gray-500 font-medium">
                        Stok:{" "}
                        <b className="text-amber-500/90 font-mono font-bold">
                          {prod.stokAktual}
                        </b>{" "}
                        pcs
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 w-[40%]">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={inputQtyMasingMasing[prod.sku] ?? ""}
                      onChange={(e) =>
                        handleUbahQtyInputKatalog(prod.sku, e.target.value)
                      }
                      className="w-full bg-[#1c1e27] border border-gray-800/80 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs text-white placeholder-gray-700 focus:outline-none focus:border-emerald-500 shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => handleTambahKeKeranjangMassal(prod)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-1 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-95"
                    >
                      ➕ Tambah
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL KANAN: PREVIEW DRAF KASIR */}
        <div className="xl:col-span-7 bg-[#1a1c23] border border-gray-800 rounded-2xl p-4 shadow-2xl flex flex-col h-[calc(100vh-175px)]">
          <div className="border-b border-gray-800 pb-2.5 mb-3 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="text-base">🛒</span>
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest">
                POS MARKETPLACE
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-bold">
                Total Omzet Sementara
              </span>
              <span className="text-lg font-black text-sky-400 font-mono">
                Rp {totalCatatanJualan.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 border border-gray-800/50 rounded-xl max-h-[calc(100vh-300px)] bg-[#15171c]/40 shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#15171c] text-gray-400 text-[9px] font-black uppercase tracking-widest sticky top-0 border-b border-gray-800 z-10 select-none">
                <tr>
                  <th className="p-3 pl-4">Nama Produk</th>
                  <th className="p-3 text-center w-28">Kuantitas</th>
                  <th className="p-3 text-right w-36">Harga(Rp)</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 text-center pr-4 w-12">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-[11px] font-medium">
                {cart.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-16 text-center text-gray-600 bg-[#1a1c23]/30 italic select-none"
                    >
                      Isi formulir muat artikel
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr
                      key={item.sku}
                      className="hover:bg-[#1d2029]/50 transition-colors"
                    >
                      <td className="p-3 pl-4">
                        <div className="font-bold text-white truncate max-w-[170px] md:max-w-[220px]">
                          {item.nama}
                        </div>
                        <div className="text-[9px] font-mono text-gray-500 tracking-wider mt-0.5 uppercase">
                          {item.sku}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 select-none">
                          <button
                            type="button"
                            onClick={() => handleKurangiQty(item.sku)}
                            className="w-5 h-5 rounded-md bg-[#242731] hover:bg-gray-700 text-white font-black flex items-center justify-center text-xs transition-colors active:scale-90"
                          >
                            -
                          </button>
                          <span className="font-mono font-black text-white text-xs w-7 text-center">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTambahQtySatu(item.sku)}
                            className="w-5 h-5 rounded-md bg-[#242731] hover:bg-gray-700 text-white font-black flex items-center justify-center text-xs transition-colors active:scale-90"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="relative flex items-center">
                          <span className="absolute left-2 text-[10px] font-bold text-gray-600 select-none">
                            Rp
                          </span>
                          <input
                            type="number"
                            value={item.harga}
                            onChange={(e) =>
                              handleUbahHargaDirect(item.sku, e.target.value)
                            }
                            className="w-full bg-[#15171c] border border-gray-800/80 rounded-lg pl-7 pr-2 py-1 text-right text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 shadow-inner"
                          />
                        </div>
                      </td>
                      <td className="p-3 text-right font-black text-sky-400 font-mono">
                        Rp {item.total.toLocaleString("id-ID")}
                      </td>
                      <td className="p-3 text-center pr-4">
                        <button
                          type="button"
                          onClick={() => handleHapusItemCart(item.sku)}
                          className="text-gray-500 hover:text-red-400 font-bold transition-colors text-xs px-1"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {cart.length > 0 && (
            <div className="flex gap-3 pt-4 border-t border-gray-800/60 mt-auto select-none">
              <button
                type="button"
                onClick={() => setShowModalClear(true)}
                className="bg-[#242731] hover:bg-gray-700 border border-gray-800 text-gray-300 text-xs font-bold px-4 py-3 rounded-xl uppercase tracking-wider transition-all active:scale-95"
              >
                🗑️ Hapus
              </button>
              <button
                type="button"
                onClick={() => setShowModalSettle(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-xl transition-all active:scale-[0.99]"
              >
                🏁 Settle & Sinkronisasi Stok
              </button>
            </div>
          )}
        </div>
      </div>

      {showModalClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-500">
              <span className="text-xl">⚠️</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Kosongkan Draf Log
              </h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus seluruh daftar antrean draf
              belanjaan berjalan harian ini? Tindakan ini tidak dapat
              dibatalkan.
            </p>
            <div className="flex gap-3 pt-1 text-xs font-bold select-none">
              <button
                type="button"
                onClick={() => setShowModalClear(false)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleKonfirmasiClearManual}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl shadow-lg transition-all"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL CONFIRMATION SETTLE */}
      {showModalSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1a1c23] border border-blue-500/30 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-blue-500">
              <span className="text-xl">🏁</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Konfirmasi Settle Jurnal
              </h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Anda akan mengunci seluruh akumulasi jualan marketplace untuk
              tanggal{" "}
              <span className="font-mono font-bold text-blue-400">
                "{tanggalLog}"
              </span>{" "}
              dengan total omzet senilai{" "}
              <span className="text-emerald-400 font-mono font-bold">
                Rp {totalCatatanJualan.toLocaleString("id-ID")}
              </span>
              . Data Berasil di Submit.
            </p>
            <div className="flex gap-3 pt-2 text-xs font-bold select-none">
              <button
                type="button"
                onClick={() => setShowModalSettle(false)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl transition-all"
              >
                Cek Ulang
              </button>
              <button
                type="button"
                onClick={handleEksekusiSettleServer}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl shadow-lg transition-all"
              >
                Ya, Settle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
