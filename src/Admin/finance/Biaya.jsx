import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import { apiRequest } from "../../api";
import "react-toastify/dist/ReactToastify.css";

export default function Biaya() {
  // ==========================================================
  // STATE MANAGEMENT & INITIALIZATION
  // ==========================================================

  const [daftarBiaya, setDaftarBiaya] = useState([]);
  const [loading, setLoading] = useState(true);

  const opsiKategori = [
    "Bensin & Transport",
    "Sewa Gudang",
    "Gaji & Konsumsi",
    "Keperluan Gudang / Packing",
    "Utilitas Kantor",
    "Perawatan & Perbaikan",
    "Lain-lain",
  ];

  // tanggal hari ini (YYYY-MM-DD)
  const getHariIniString = () => {
    const d = new Date();
    const bulan = String(d.getMonth() + 1).padStart(2, "0");
    const hari = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${bulan}-${hari}`;
  };

  //  STATE FILTER RANGE TANGGAL (AWAL & AKHIR BULAN BERJALAN)
  const [filterTglMulai, setFilterTglMulai] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });

  const [filterTglSelesai, setFilterTglSelesai] = useState(() => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${lastDay}`;
  });

  // State Form Input Pengeluaran Baru
  const [formInput, setFormInput] = useState({
    tanggal: getHariIniString(),
    keterangan: "",
    kategori: "Bensin & Transport",
    metode: "Tunai / Kas Kecil",
    nominal: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "tanggal",
    direction: "desc",
  });

  const [dataAkanDihapus, setDataAkanDihapus] = useState(null);

  // ==========================================================
  // [DATA FETCHING DARI BACKEND DJANGO WITH JWT]
  // ==========================================================

  useEffect(() => {
    fetchDaftarBiaya();
  }, []);

  const fetchDaftarBiaya = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/finance/biaya/");
      if (data) {
        setDaftarBiaya(data);
      }
    } catch (error) {
      console.error("Error fetching biaya:", error);
      toast.error("Gagal menyinkronkan data biaya operasional.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // [DATA MUTATION (SAVE & DELETE)]
  // ==========================================================

  // 1. SIMPAN DATA BIAYA BARU (POST WITH JWT AUTHORIZATION)
  const handleSimpanBiaya = async (e) => {
    e.preventDefault();
    if (formInput.keterangan.trim() === "" || !formInput.nominal) return;

    const idToastBiaya = toast.loading("Sedang membukukan biaya baru...");
    const payload = {
      ...formInput,
      nominal: parseInt(formInput.nominal) || 0,
    };

    try {
      const data = await apiRequest("/api/finance/biaya/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data) {
        toast.update(idToastBiaya, {
          render: "Sukses! Catatan biaya operasional berhasil disimpan.",
          type: "success",
          isLoading: false,
          autoClose: 2500,
        });

        setFormInput({
          tanggal: getHariIniString(),
          keterangan: "",
          kategori: "Bensin & Transport",
          metode: "Tunai / Kas Kecil",
          nominal: "",
        });

        fetchDaftarBiaya();
      }
    } catch (error) {
      toast.update(idToastBiaya, {
        render: "Gagal menyimpan data pengeluaran ke server.",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  // 2. PENGHAPUSAN BIAYA (DELETE WITH JWT AUTHORIZATION)
  const handleEksekusiHapusBiaya = async () => {
    if (!dataAkanDihapus) return;

    const idToastDelete = toast.loading(
      `Menghapus log pengeluaran kas internal...`,
    );
    try {
      await apiRequest(`/api/finance/biaya/${dataAkanDihapus.id}/`, {
        method: "DELETE",
      });

      toast.update(idToastDelete, {
        render: `Sukses! Catatan biaya senilai Rp ${dataAkanDihapus.nominal.toLocaleString("id-ID")} berhasil dihapus permanen.`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setDataAkanDihapus(null);
      fetchDaftarBiaya();
    } catch (error) {
      toast.update(idToastDelete, {
        render: "Gagal menghapus log pengeluaran dari database cloud.",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  // ==========================================================
  // [FILTERING & SORTING]
  // ==========================================================
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let filteredResults = daftarBiaya.filter((item) => {
      const cocokTanggal =
        item.tanggal >= filterTglMulai && item.tanggal <= filterTglSelesai;
      const cocokSearch =
        item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kategori.toLowerCase().includes(searchTerm.toLowerCase());

      return cocokTanggal && cocokSearch;
    });

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
  }, [daftarBiaya, filterTglMulai, filterTglSelesai, searchTerm, sortConfig]);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return " ↕";
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };

  const totalPengeluaranBulanIni = useMemo(() => {
    return processedData.reduce((sum, item) => sum + item.nominal, 0);
  }, [processedData]);

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      <ToastContainer theme="dark" />

      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Biaya Operasional
        </h2>
        <button
          onClick={fetchDaftarBiaya}
          className="bg-[#242731] hover:bg-gray-700 text-xs text-white px-3 py-1.5 rounded-lg border border-gray-800 transition-all font-semibold active:scale-95"
        >
          🔄 Refresh Jurnal Biaya
        </button>
      </div>

      {/* METRIK SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-md">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Total Pengeluaran Terfilter
          </p>
          <p className="text-xl font-black text-rose-400 mt-1 font-mono">
            Rp {totalPengeluaranBulanIni.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-md">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Jumlah Catatan Kas Keluar
          </p>
          <p className="text-xl font-black text-white mt-1">
            {processedData.length} Pengeluaran
          </p>
        </div>
      </div>

      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-gray-500 mb-1 font-bold">
            Mulai Tanggal Pengeluaran
          </label>
          <input
            type="date"
            value={filterTglMulai}
            onChange={(e) => setFilterTglMulai(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2.5 text-white font-mono focus:border-blue-500 focus:outline-none font-bold [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1 font-bold">
            Sampai Tanggal Pengeluaran
          </label>
          <input
            type="date"
            value={filterTglSelesai}
            onChange={(e) => setFilterTglSelesai(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2.5 text-white font-mono focus:border-blue-500 focus:outline-none font-bold [color-scheme:dark]"
          />
        </div>
      </div>

      {/* CORE GRID LAYOUT */}
      <div className="grid grid-cols-1 grid-flow-row xl:grid-cols-12 gap-6 items-start">
        {/* INPUT FORM SEBELAH KIRI */}
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
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold focus:border-emerald-500 focus:outline-none text-[11px] [color-scheme:dark]"
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
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none cursor-pointer text-[11px] font-bold"
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
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none cursor-pointer text-[11px] font-bold"
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
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-[11px] transition-all uppercase tracking-wider shadow-lg active:scale-95"
          >
            💾 Tambah Catatan Biaya
          </button>
        </form>

        {/* JURNAL ARUS KAS KELUAR SEBELAH KANAN */}
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
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-800/60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#15171c] text-gray-400 border-b border-gray-800 font-semibold select-none text-[11px]">
                  <th
                    onClick={() => handleSort("tanggal")}
                    className="p-3.5 pl-5 cursor-pointer hover:bg-[#1d2029] w-[14%]"
                  >
                    Tanggal{getSortIcon("tanggal")}
                  </th>
                  <th
                    onClick={() => handleSort("kategori")}
                    className="p-3.5 cursor-pointer hover:bg-[#1d2029] w-[18%]"
                  >
                    Kategori{getSortIcon("kategori")}
                  </th>
                  <th className="p-3.5 w-[36%]">
                    Keterangan / Deskripsi Operasional
                  </th>
                  <th className="p-3.5 w-[14%]">Metode</th>
                  <th
                    onClick={() => handleSort("nominal")}
                    className="p-3.5 text-right cursor-pointer hover:bg-[#1d2029] w-[13%]"
                  >
                    Nominal
                  </th>
                  <th className="p-3.5 text-center pr-5 w-[5%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 font-medium text-xs">
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-12 text-center text-gray-500 font-bold bg-[#1a1c23]"
                    >
                      ⏳ Menyinkronkan seluruh lembar jurnal biaya
                      operasional...
                    </td>
                  </tr>
                ) : processedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-8 text-center text-gray-500 font-semibold bg-[#1a1c23]"
                    >
                      ❌ Belum ada rekaman catatan pengeluaran biaya pada bulan
                      ini.
                    </td>
                  </tr>
                ) : (
                  processedData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#1d2029]/40 transition-colors"
                    >
                      <td className="p-3.5 pl-5 text-gray-400 font-mono whitespace-nowrap">
                        {item.tanggal}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="bg-[#15171c] border border-gray-800 px-2.5 py-0.5 rounded text-[10px] font-black text-gray-300">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-200 max-w-xs break-words font-bold">
                        {item.keterangan}
                      </td>
                      <td className="p-3.5 text-gray-400 whitespace-nowrap">
                        {item.metode}
                      </td>
                      <td className="p-3.5 text-right font-black text-rose-400 font-mono text-[13px]">
                        Rp {item.nominal.toLocaleString("id-ID")}
                      </td>
                      <td className="p-3.5 text-center pr-5">
                        <button
                          type="button"
                          onClick={() => setDataAkanDihapus(item)}
                          className="text-gray-600 hover:text-red-400 text-sm transition-colors p-1"
                          title="Hapus rekaman biaya ini"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {dataAkanDihapus && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-red-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center space-x-2 border-b border-gray-800 pb-2">
              <span className="text-xl">🚨</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Hapus Catatan Pengeluaran Kas?
              </h3>
            </div>

            <div className="bg-[#15171c] p-3 rounded-xl border border-gray-800 text-xs font-medium space-y-2">
              <div>
                <span className="text-gray-500 text-[10px] block uppercase">
                  Kategori & Tanggal:
                </span>
                <span className="text-white font-bold">
                  [{dataAkanDihapus.kategori}] - {dataAkanDihapus.tanggal}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block uppercase">
                  Deskripsi Pengeluaran:
                </span>
                <span className="text-gray-300 italic">
                  "{dataAkanDihapus.keterangan}"
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block uppercase">
                  Nominal Dana Keluar:
                </span>
                <span className="text-rose-400 font-mono font-black text-sm">
                  Rp {dataAkanDihapus.nominal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-red-400 leading-relaxed bg-red-950/20 border border-red-900/30 p-2.5 rounded-lg">
              ⚠️ <strong>PERINGATAN AUDIT INTERNAL:</strong> Menghapus baris
              biaya ini akan mengubah akumulasi total pengeluaran kas Solution
              Indonesia secara permanen dari server database!
            </div>

            <div className="flex gap-3 pt-1 text-xs">
              <button
                type="button"
                onClick={() => setDataAkanDihapus(null)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-bold transition-all"
              >
                Batal / Kembali
              </button>
              <button
                type="button"
                onClick={handleEksekusiHapusBiaya}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-red-950/30"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
