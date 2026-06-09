import React, { useState } from "react";

export default function Hpp() {
  // 1. DATA MASTER PRODUK
  const [produkGudang] = useState([
    { sku: "STR-001", nama: "Sterno Kaleng Original Pxton" },
    { sku: "STR-002", nama: "Sterno Gel Refill 1kg Pxton" },
    { sku: "STR-003", nama: "Sterno Cair Eco Liquid 1L" },
  ]);

  // 2. State utama SKU HPP
  const [daftarHpp, setDaftarHpp] = useState([
    {
      id: 1,
      sku: "STR-001",
      nama: "Sterno Kaleng Original Pxton",
      hargaBeli: 4000,
      hargaJual: 6000,
    },
    {
      id: 2,
      sku: "STR-002",
      nama: "Sterno Gel Refill 1kg Pxton",
      hargaBeli: 18000,
      hargaJual: 25000,
    },
  ]);

  // 3. State Form Input (SKU & Nama diambil via pilihan dropdown)
  const [selectedIndexProduk, setSelectedIndexProduk] = useState("");
  const [hargaBeliInput, setHargaBeliInput] = useState("");
  const [hargaJualInput, setHargaJualInput] = useState("");

  // State Pencarian Tabel
  const [searchTerm, setSearchTerm] = useState("");

  // FUNGSI UTAMA: EDIT (Kembalikan nilai ke form input kiri)
  const handleEditClick = (item) => {
    const idxGudang = produkGudang.findIndex((prod) => prod.sku === item.sku);
    if (idxGudang !== -1) {
      setSelectedIndexProduk(idxGudang.toString());
      setHargaBeliInput(item.hargaBeli.toString());
      setHargaJualInput(item.hargaJual.toString());
    }
  };

  // FUNGSI EKSEKUSI: UPDATE HARGA
  const handleSimpanHpp = (e) => {
    e.preventDefault();
    if (selectedIndexProduk === "" || !hargaBeliInput || !hargaJualInput)
      return;

    const produkTerpilih = produkGudang[selectedIndexProduk];
    const hBeli = parseInt(hargaBeliInput) || 0;
    const hJual = parseInt(hargaJualInput) || 0;

    const indexDataLama = daftarHpp.findIndex(
      (item) => item.sku === produkTerpilih.sku,
    );

    if (indexDataLama !== -1) {
      // KONDISI A: JIKA SKU SUDAH ADA -> UPDATE DATA LAMA
      setDaftarHpp((prev) =>
        prev.map((item, idx) =>
          idx === indexDataLama
            ? { ...item, hargaBeli: hBeli, hargaJual: hJual }
            : item,
        ),
      );
    } else {
      // KONDISI B: JIKA SKU BELUM PERNAH ADA -> BUAT BARIS BARU
      const dataBaru = {
        id: Date.now(),
        sku: produkTerpilih.sku,
        nama: produkTerpilih.nama,
        hargaBeli: hBeli,
        hargaJual: hJual,
      };
      setDaftarHpp((prev) => [...prev, dataBaru]);
    }

    // Reset Input Form
    setSelectedIndexProduk("");
    setHargaBeliInput("");
    setHargaJualInput("");
  };

  // Filter Data Berdasarkan Pencarian di Tabel
  const filteredData = daftarHpp.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      {/* HEADER MODUL */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Master HPP & Produk
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Manajemen penetapan nilai modal dan harga jual target. Tersinkronisasi
          otomatis dengan data varian modul gudang.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* PANEL KIRI: FORM INPUT AMBIL DARI GUDANG */}
        <form
          onSubmit={handleSimpanHpp}
          className="xl:col-span-3 bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3.5"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
            ➕ Input Nilai Harga
          </h3>

          <div className="space-y-2.5 text-xs">
            {/* DROPDOWN AMBIL DATA DARI PRODUK GUDANG */}
            <div>
              <label className="block text-gray-400 mb-1">
                Pilih Produk (Data Modul Gudang){" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedIndexProduk}
                onChange={(e) => setSelectedIndexProduk(e.target.value)}
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-medium focus:border-emerald-500 focus:outline-none cursor-pointer text-[11px]"
                required
              >
                <option value="">-- Pilih SKU / Nama Produk --</option>
                {produkGudang.map((prod, index) => (
                  <option key={index} value={index}>
                    [{prod.sku}] - {prod.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* INPUT HARGA BELI */}
            <div>
              <label className="block text-gray-400 mb-1">
                Harga Beli / HPP Pokok (Rp){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="Rp 0"
                value={hargaBeliInput}
                onChange={(e) => setHargaBeliInput(e.target.value)}
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-rose-400 font-bold focus:border-emerald-500 focus:outline-none text-xs placeholder-gray-700"
                required
              />
            </div>

            {/* INPUT HARGA JUAL */}
            <div>
              <label className="block text-emerald-400 font-bold mb-1">
                Harga Jual Target (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="Rp 0"
                value={hargaJualInput}
                onChange={(e) => setHargaJualInput(e.target.value)}
                className="w-full bg-[#15171c] border border-emerald-500/40 rounded-lg p-2 data-input text-emerald-400 font-black focus:border-emerald-500 focus:outline-none text-xs placeholder-gray-700"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-[11px] transition-all uppercase tracking-wider shadow-lg shadow-emerald-950/20 active:scale-95"
          >
            💾 Amankan Nilai Master HPP
          </button>
        </form>

        {/* PANEL KANAN: TABEL REKAPAN MARGIN PROFIT OTOMATIS */}
        <div className="xl:col-span-9 bg-[#1a1c23] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider self-start sm:self-center">
              📋 Jurnal Ringkasan SKU
            </h3>
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Cari SKU atau nama produk..."
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
                  <th className="p-3.5 pl-5 w-[12%]">SKU</th>
                  <th className="p-3.5 w-[33%]">Nama Produk</th>
                  <th className="p-3.5 text-right w-[15%]">Harga Beli (HPP)</th>
                  <th className="p-3.5 text-right text-emerald-400 w-[15%]">
                    Harga Jual Target
                  </th>
                  <th className="p-3.5 text-right text-sky-400 w-[13%]">
                    Laba Kotor
                  </th>
                  <th className="p-3.5 text-center w-[12%]">Margin (%)</th>
                  <th className="p-3.5 text-center pr-5 w-[10%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 font-medium text-xs">
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-8 text-center text-gray-500 font-semibold bg-[#1a1c23]"
                    >
                      ❌ Data SKU kosong atau tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => {
                    const selisihLaba = item.hargaJual - item.hargaBeli;
                    const marginPersen =
                      item.hargaJual > 0
                        ? (selisihLaba / item.hargaJual) * 100
                        : 0;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#1d2029]/60 transition-colors"
                      >
                        <td className="p-3.5 pl-5 font-mono text-blue-400 font-bold">
                          {item.sku}
                        </td>
                        <td className="p-3.5 text-white font-bold">
                          {item.nama}
                        </td>
                        <td className="p-3.5 text-right text-gray-400">
                          Rp {item.hargaBeli.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3.5 text-right font-black text-emerald-400">
                          Rp {item.hargaJual.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3.5 text-right font-black text-sky-400">
                          Rp {selisihLaba.toLocaleString("id-ID")}
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              marginPersen > 20
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-900/60"
                                : "bg-amber-950 text-amber-400 border border-amber-900/60"
                            }`}
                          >
                            {marginPersen.toFixed(1)}%
                          </span>
                        </td>
                        {/* KOLOM EDIT */}
                        <td className="p-3.5 text-center pr-5 select-none">
                          <button
                            type="button"
                            onClick={() => handleEditClick(item)}
                            className="text-gray-500 hover:text-emerald-400 transition-colors text-xs"
                            title="Edit Harga"
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
