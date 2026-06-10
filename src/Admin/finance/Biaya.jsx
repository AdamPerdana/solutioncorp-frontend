import React, { useState, useMemo } from "react";

export default function Biaya() {
  const [daftarBiaya, setDaftarBiaya] = useState([
    {
      id: 1,
      tanggal: "2026-06-08",
      keterangan: "Bensin Pertalite Mobil Operasional Kurir",
      kategori: "Bensin & Transport",
      metode: "Tunai / Kas Kecil",
      nominal: 150000,
    },
    {
      id: 2,
      tanggal: "2026-06-05",
      keterangan: "Biaya Listrik Kantor PLN Pascabayar Mei",
      kategori: "Utilitas Kantor",
      metode: "Transfer Bank",
      nominal: 1250000,
    },
    {
      id: 3,
      tanggal: "2026-06-02",
      keterangan: "Service dan Isi Freon AC Ruang Admin",
      kategori: "Perawatan & Perbaikan",
      metode: "Tunai / Kas Kecil",
      nominal: 350000,
    },
  ]);

  const opsiKategori = [
    "Bensin & Transport",
    "Sewa Gudang",
    "Gaji & Konsumsi",
    "Keperluan Gudang / Packing",
    "Utilitas Kantor",
    "Perawatan & Perbaikan",
    "Lain-lain",
  ];

  // Tambah Biaya Baru
  const [formInput, setFormInput] = useState({
    tanggal: "2026-06-08",
    keterangan: "",
    kategori: "Bensin & Transport",
    metode: "Tunai / Kas Kecil",
    nominal: "",
  });

  // pencarian dan pengurutan (Sorting)
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "tanggal",
    direction: "desc",
  });

  // SIMPAN CATATAN BIAYA BARU
  const handleSimpanBiaya = (e) => {
    e.preventDefault();
    if (formInput.keterangan.trim() === "" || !formInput.nominal) return;

    const dataBaru = {
      id: Date.now(),
      ...formInput,
      nominal: parseInt(formInput.nominal) || 0,
    };

    setDaftarBiaya((prev) => [dataBaru, ...prev]);

    // Reset form kecuali tanggal
    setFormInput({
      ...formInput,
      keterangan: "",
      kategori: "Bensin & Transport",
      metode: "Tunai / Kas Kecil",
      nominal: "",
    });
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // PROSES FILTERING DAN SORTING DATA SEBELUM DI-RENDER
  const processedData = useMemo(() => {
    let filteredResults = daftarBiaya.filter(
      (item) =>
        item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kategori.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (sortConfig.key !== null) {
      filteredResults.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key])
          return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key])
          return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filteredResults;
  }, [daftarBiaya, searchTerm, sortConfig]);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return " ↕";
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };

  const totalPengeluaranBulanIni = daftarBiaya.reduce(
    (sum, item) => sum + item.nominal,
    0,
  );

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Biaya Operasional
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-md">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Total Pengeluaran Bulan Ini
          </p>
          <p className="text-xl font-black text-rose-400 mt-1 font-mono">
            Rp {totalPengeluaranBulanIni.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-md">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Jumlah Transaksi
          </p>
          <p className="text-xl font-black text-white mt-1">
            {daftarBiaya.length} Pengeluaran
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSimpanBiaya}
          className="xl:col-span-3 bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3.5"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
            ➕ Input Pengeluaran Baru
          </h3>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">
                Tanggal Pengeluaran <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formInput.tanggal}
                onChange={(e) =>
                  setFormInput({ ...formInput, tanggal: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-medium focus:border-emerald-500 focus:outline-none text-[11px]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                Kategori Pengeluaran <span className="text-red-500">*</span>
              </label>
              <select
                value={formInput.kategori}
                onChange={(e) =>
                  setFormInput({ ...formInput, kategori: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none cursor-pointer text-[11px] font-medium"
              >
                {opsiKategori.map((kat, index) => (
                  <option key={index} value={kat}>
                    {kat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                Sumber Dana / Metode <span className="text-red-500">*</span>
              </label>
              <select
                value={formInput.metode}
                onChange={(e) =>
                  setFormInput({ ...formInput, metode: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none cursor-pointer text-[11px] font-medium"
              >
                <option value="Tunai / Kas Kecil">Tunai / Kas Kecil</option>
                <option value="Transfer Bank">Transfer Bank</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                Nominal Biaya (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="Rp 0"
                value={formInput.nominal}
                onChange={(e) =>
                  setFormInput({ ...formInput, nominal: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-rose-400 font-bold focus:border-emerald-500 focus:outline-none text-xs placeholder-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                Keterangan / Deskripsi <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                placeholder="Tulis detail pengeluaran..."
                value={formInput.keterangan}
                onChange={(e) =>
                  setFormInput({ ...formInput, keterangan: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none placeholder-gray-700 font-medium text-[11px]"
                required
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-[11px] transition-all uppercase tracking-wider shadow-lg shadow-emerald-950/20 active:scale-95"
          >
            💾 Tambah Catatan Biaya
          </button>
        </form>

        <div className="xl:col-span-9 bg-[#1a1c23] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider self-start sm:self-center">
              📋 Jurnal Arus Kas Keluar
            </h3>

            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Cari keterangan atau kategori..."
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
                  <th
                    onClick={() => handleSort("tanggal")}
                    className="p-3.5 pl-5 cursor-pointer hover:bg-[#1d2029] w-[15%]"
                  >
                    Tanggal{getSortIcon("tanggal")}
                  </th>
                  <th
                    onClick={() => handleSort("kategori")}
                    className="p-3.5 cursor-pointer hover:bg-[#1d2029] w-[20%]"
                  >
                    Kategori{getSortIcon("kategori")}
                  </th>
                  <th className="p-3.5 w-[35%]">
                    Keterangan / Deskripsi Operasional
                  </th>
                  <th className="p-3.5 w-[15%]">Metode</th>
                  <th
                    onClick={() => handleSort("nominal")}
                    className="p-3.5 text-right pr-5 cursor-pointer hover:bg-[#1d2029] w-[15%]"
                  >
                    Nominal Keluar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 font-medium text-xs">
                {processedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-8 text-center text-gray-500 font-semibold bg-[#1a1c23]"
                    >
                      ❌ Belum ada rekaman catatan pengeluaran biaya.
                    </td>
                  </tr>
                ) : (
                  processedData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#1d2029]/60 transition-colors"
                    >
                      <td className="p-3.5 pl-5 text-gray-400 font-mono whitespace-nowrap">
                        {item.tanggal}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="bg-[#15171c] border border-gray-800 px-2.5 py-0.5 rounded text-[10px] font-bold text-gray-300">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-200 max-w-xs break-words">
                        {item.keterangan}
                      </td>
                      <td className="p-3.5 text-gray-400 whitespace-nowrap">
                        {item.metode}
                      </td>
                      <td className="p-3.5 text-right font-black text-rose-400 font-mono text-[13px] pr-5">
                        Rp {item.nominal.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
