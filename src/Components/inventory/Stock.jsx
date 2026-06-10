import React, { useState, useEffect } from "react";

export default function Stok() {
  const [daftarStok, setDaftarStok] = useState(() => {
    const dataLokal = localStorage.getItem(
      "PT_Solution_Inventory_Stok_Realtime",
    );
    if (dataLokal) return JSON.parse(dataLokal);
    return [
      {
        id: 1,
        sku: "STR-001",
        nama: "Sterno Kaleng Original Pxton",
        stokAktual: 1500,
        minStok: 500,
      },
      {
        id: 2,
        sku: "STR-002",
        nama: "Sterno Gel Refill 1kg Pxton",
        stokAktual: 98,
        minStok: 100,
      },
      {
        id: 3,
        sku: "STR-003",
        nama: "Sterno Cair Eco Liquid 1L",
        stokAktual: 600,
        minStok: 200,
      },
    ];
  });

  const [selectedIndexProduk, setSelectedIndexProduk] = useState("");
  const [jenisMutasi, setJenisMutasi] = useState("MASUK");
  const [jumlahQty, setJumlahQty] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    localStorage.setItem(
      "PT_Solution_Inventory_Stok_Realtime",
      JSON.stringify(daftarStok),
    );
  }, [daftarStok]);

  const handleEditClick = (item) => {
    const idxStok = daftarStok.findIndex((prod) => prod.sku === item.sku);
    if (idxStok !== -1) {
      setSelectedIndexProduk(idxStok.toString());
      setJumlahQty("");
    }
  };

  const handleEksekusiMutasi = (e) => {
    e.preventDefault();
    if (selectedIndexProduk === "" || !jumlahQty) return;

    const qtyData = parseInt(jumlahQty) || 0;
    if (qtyData <= 0) return;

    setDaftarStok((prevData) =>
      prevData.map((item, index) => {
        if (index === parseInt(selectedIndexProduk)) {
          const stokBaru =
            jenisMutasi === "MASUK"
              ? item.stokAktual + qtyData
              : Math.max(0, item.stokAktual - qtyData);

          return { ...item, stokAktual: stokBaru };
        }
        return item;
      }),
    );

    setSelectedIndexProduk("");
    setJenisMutasi("MASUK");
    setJumlahQty("");
  };

  const filteredStok = daftarStok.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      {/* HEADER MODUL */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Manajemen Stok
        </h2>
      </div>

      {/* GRID RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* PANEL KIRI: FORM EKSEKUSI MUTASI */}
        <form
          onSubmit={handleEksekusiMutasi}
          className="xl:col-span-3 bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3.5"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
            ➕ Input Stok
          </h3>

          <div className="space-y-2.5 text-xs">
            {/* 1. SELECTION PRODUK */}
            <div>
              <label className="block text-gray-400 mb-1">
                Pilih Produk SKU <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedIndexProduk}
                onChange={(e) => setSelectedIndexProduk(e.target.value)}
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-medium focus:border-emerald-500 focus:outline-none cursor-pointer text-[11px]"
                required
              >
                <option value="">-- Pilih Produk Gudang --</option>
                {daftarStok.map((prod, index) => (
                  <option key={index} value={index}>
                    [{prod.sku}] - {prod.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. PILIHAN AKSI */}
            <div>
              <label className="block text-gray-400 mb-1">
                Aksi Perubahan Stok <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setJenisMutasi("MASUK")}
                  className={`py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wide border transition-all ${
                    jenisMutasi === "MASUK"
                      ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                      : "bg-[#15171c] text-gray-500 border-gray-800 hover:text-gray-400"
                  }`}
                >
                  📥 MASUK
                </button>
                <button
                  type="button"
                  onClick={() => setJenisMutasi("KELUAR")}
                  className={`py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wide border transition-all ${
                    jenisMutasi === "KELUAR"
                      ? "bg-red-950 text-red-400 border-red-500/40"
                      : "bg-[#15171c] text-gray-500 border-gray-800 hover:text-gray-400"
                  }`}
                >
                  📤 KELUAR
                </button>
              </div>
            </div>

            {/* 3. QUANTITY INPUT */}
            <div>
              <label className="block text-gray-400 mb-1">
                Jumlah Kuantitas (Qty) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="0"
                value={jumlahQty}
                onChange={(e) => setJumlahQty(e.target.value)}
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold focus:border-emerald-500 focus:outline-none text-xs"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-[11px] transition-all uppercase tracking-wider shadow-lg shadow-blue-950/20 active:scale-95"
          >
            💾 Eksekusi Stok
          </button>
        </form>

        {/* PANEL KANAN: MONITORING POSISI REAL-TIME STOK */}
        <div className="xl:col-span-9 bg-[#1a1c23] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider self-start sm:self-center">
              📋 Status Stok
            </h3>
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Cari nama atau SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-800/60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#15171c] text-gray-400 border-b border-gray-800 font-semibold select-none text-[11px]">
                  <th className="p-3.5 pl-5 w-[35%]">Nama Varian Produk</th>
                  <th className="p-3.5 w-[15%]">SKU</th>
                  <th className="p-3.5 text-right w-[15%]">Stok</th>
                  <th className="p-3.5 text-right w-[15%]">Stock Minimal</th>
                  <th className="p-3.5 text-center w-[12%]">Status</th>
                  <th className="p-3.5 text-center pr-5 w-[8%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 font-medium text-xs">
                {filteredStok.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-8 text-center text-gray-500 font-semibold bg-[#1a1c23]"
                    >
                      ❌ Data produk tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredStok.map((item) => {
                    const isKritis = item.stokAktual <= item.minStok;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#1d2029]/60 transition-colors"
                      >
                        <td className="p-3.5 pl-5 text-white font-bold">
                          {item.nama}
                        </td>
                        <td className="p-3.5 font-mono text-blue-400 font-bold">
                          {item.sku}
                        </td>
                        <td
                          className={`p-3.5 text-right font-black text-sm ${isKritis ? "text-red-500" : "text-emerald-400"}`}
                        >
                          {item.stokAktual.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right text-gray-500 font-bold">
                          {item.minStok.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center select-none">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase border ${
                              isKritis
                                ? "bg-red-950/60 text-red-400 border-red-900/50"
                                : "bg-emerald-950/60 text-emerald-400 border-emerald-900/50"
                            }`}
                          >
                            {isKritis ? "⚠️ KRITIS" : "✅ AMAN"}
                          </span>
                        </td>
                        {/* KOLOM AKSI EDIT */}
                        <td className="p-3.5 text-center pr-5 select-none">
                          <button
                            type="button"
                            onClick={() => handleEditClick(item)}
                            className="text-gray-500 hover:text-emerald-400 transition-colors text-xs"
                            title="Pilih untuk Mutasi"
                          >
                            📝
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
