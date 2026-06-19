import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import { apiRequest } from "../../api";
import "react-toastify/dist/ReactToastify.css";

export default function Produk() {
  // ==========================================================
  // [ STATE MANAGEMENT & INITIALIZATION ]
  // ==========================================================

  const [daftarProduk, setDaftarProduk] = useState([]);
  const [daftarSatuan, setDaftarSatuan] = useState([
    "Pcs",
    "Kaleng",
    "Pail",
    "Kg",
  ]);

  const [loading, setLoading] = useState(true);

  const [formProduk, setFormProduk] = useState({
    sku: "",
    nama: "",
    minStok: "",
    satuan: "Pcs",
    hpp: "",
    hargaJual: "",
  });

  const [satuanBaru, setSatuanBaru] = useState("");
  const [tampilkanInputSatuan, setTampilkanInputSatuan] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dataAkanDisimpan, setDataAkanDisimpan] = useState(null);
  const [dataAkanDihapus, setDataAkanDihapus] = useState(null);

  // ==========================================================
  // [ DATA FETCHING WITH JWT AUTHORIZATION ]
  // ==========================================================

  useEffect(() => {
    fetchProdukDariBackend();
  }, []);

  const fetchProdukDariBackend = async () => {
    try {
      const data = await apiRequest("/api/inventory/products/");
      if (data) {
        setDaftarProduk(data);
      }
    } catch (error) {
      console.error("Error Fetching Products:", error);
      alert("Koneksi database produk ke server Django terputus!");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // [ CONTROL & VALIDATION ]
  // ==========================================================

  const handleEditClick = (item) => {
    setFormProduk({
      sku: item.sku,
      nama: item.nama,
      minStok: item.min_stok ?? item.minStok ?? "",
      satuan: item.satuan,
      hpp: item.hpp ?? "",
      hargaJual: item.harga_jual ?? item.hargaJual ?? "",
    });
  };

  const handleTambahSatuan = (e) => {
    e.preventDefault();
    const namaClean = satuanBaru.trim();
    if (namaClean === "") return;

    const namaFormat =
      namaClean.charAt(0).toUpperCase() + namaClean.slice(1).toLowerCase();

    if (!daftarSatuan.includes(namaFormat)) {
      setDaftarSatuan([...daftarSatuan, namaFormat]);
      setFormProduk({ ...formProduk, satuan: namaFormat });
    }
    setSatuanBaru("");
    setTampilkanInputSatuan(false);
  };

  const handleHapusSatuan = (satuanYangDihapus, e) => {
    e.stopPropagation();
    if (daftarSatuan.length <= 1) {
      alert("Harus ada minimal satu satuan unit di sistem.");
      return;
    }

    const sisaSatuan = daftarSatuan.filter((s) => s !== satuanYangDihapus);
    setDaftarSatuan(sisaSatuan);

    if (formProduk.satuan === satuanYangDihapus) {
      setFormProduk({ ...formProduk, satuan: sisaSatuan[0] });
    }
  };

  const handlePicuKonfirmasi = (e) => {
    e.preventDefault();
    if (formProduk.nama.trim() === "" || formProduk.sku.trim() === "") return;

    const targetSku = formProduk.sku.trim().toUpperCase();
    const produkLama = daftarProduk.find(
      (item) => item.sku.toUpperCase() === targetSku,
    );

    const stokBerjalan = produkLama
      ? (produkLama.stok_aktual ?? produkLama.stokAktual)
      : 0;
    const currentId = produkLama ? produkLama.id : null;

    setDataAkanDisimpan({
      isUpdate: !!produkLama,
      id: currentId,
      sku: targetSku,
      nama: formProduk.nama.trim(),
      min_stok: parseInt(formProduk.minStok) || 0,
      satuan: formProduk.satuan,
      stok_aktual: stokBerjalan,
      hpp: parseInt(formProduk.hpp) || 0,
      harga_jual: parseInt(formProduk.hargaJual) || 0,
    });
  };

  // ==========================================================
  // [ DATABASE MUTATION WITH JWT AUTHORIZATION ]
  // ==========================================================

  const handleEksekusiSimpan = async () => {
    if (!dataAkanDisimpan) return;

    const payload = {
      sku: dataAkanDisimpan.sku,
      nama: dataAkanDisimpan.nama,
      min_stok: dataAkanDisimpan.min_stok,
      satuan: dataAkanDisimpan.satuan,
      hpp: dataAkanDisimpan.hpp,
      harga_jual: dataAkanDisimpan.harga_jual,
    };

    try {
      if (dataAkanDisimpan.isUpdate) {
        const updatedData = await apiRequest(
          `/api/inventory/products/${dataAkanDisimpan.id}/`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );

        if (updatedData) {
          setDaftarProduk((prev) =>
            prev.map((item) =>
              item.id === dataAkanDisimpan.id ? updatedData : item,
            ),
          );
        }
      } else {
        const produkBaru = await apiRequest("/api/inventory/products/", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (produkBaru) {
          setDaftarProduk((prev) => [produkBaru, ...prev]);
        }
      }

      setFormProduk({
        sku: "",
        nama: "",
        minStok: "",
        satuan: daftarSatuan[0] || "Pcs",
        hpp: "",
        hargaJual: "",
      });

      setDataAkanDisimpan(null);
    } catch (error) {
      console.error("Error Saving Product:", error);
      alert("Gagal menyimpan data master produk ke server.");
    }
  };

  const handleEksekusiHapus = async () => {
    if (!dataAkanDihapus) return;

    try {
      await apiRequest(`/api/inventory/products/${dataAkanDihapus.id}/`, {
        method: "DELETE",
      });

      setDaftarProduk((prev) =>
        prev.filter((item) => item.id !== dataAkanDihapus.id),
      );

      setDataAkanDihapus(null);
    } catch (error) {
      console.error("Error Deleting Product:", error);
      alert("Gagal menghapus entitas produk dari server");
    }
  };

  // ==========================================================
  // [ SEARCH FILTER & RENDERING ]
  // ==========================================================
  const filteredData = useMemo(() => {
    return daftarProduk.filter(
      (item) =>
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [daftarProduk, searchTerm]);

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      <ToastContainer theme="dark" />

      {/* HEADER MODUL */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Master Produk Gudang
        </h2>
      </div>

      {/* GRID RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* PANEL KIRI: FORM REGISTRASI */}
        <form
          onSubmit={handlePicuKonfirmasi}
          className="xl:col-span-3 bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3.5"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
            ➕ Registrasi Item Baru
          </h3>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">
                Kode SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: STR-001"
                value={formProduk.sku}
                onChange={(e) =>
                  setFormProduk({ ...formProduk, sku: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:border-emerald-500 focus:outline-none text-[11px]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                Nama Produk Varian <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Sterno Kaleng Original Pxton"
                value={formProduk.nama}
                onChange={(e) =>
                  setFormProduk({ ...formProduk, nama: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none text-[11px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2 items-end">
              <div>
                <label className="block text-gray-400 mb-1">
                  Batas Min. <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formProduk.minStok}
                  onChange={(e) =>
                    setFormProduk({ ...formProduk, minStok: e.target.value })
                  }
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none text-[11px]"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-400">Satuan</label>
                  <button
                    type="button"
                    onClick={() =>
                      setTampilkanInputSatuan(!tampilkanInputSatuan)
                    }
                    className="text-[9px] text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-900/40"
                  >
                    {tampilkanInputSatuan ? "Batal" : "➕"}
                  </button>
                </div>

                {!tampilkanInputSatuan ? (
                  <div className="relative">
                    <select
                      value={formProduk.satuan}
                      onChange={(e) =>
                        setFormProduk({ ...formProduk, satuan: e.target.value })
                      }
                      className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none cursor-pointer appearance-none pr-6 text-[11px]"
                    >
                      {daftarSatuan.map((sat, index) => (
                        <option key={index} value={sat}>
                          {sat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-500 text-[9px]">
                      ▼
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-1 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="Satuan..."
                      value={satuanBaru}
                      onChange={(e) => setSatuanBaru(e.target.value)}
                      className="w-full bg-[#15171c] border border-emerald-500/40 rounded-lg p-1.5 text-white focus:outline-none text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleTambahSatuan}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 rounded-lg font-bold text-[11px]"
                    >
                      Ok
                    </button>
                  </div>
                )}
              </div>
            </div>

            {tampilkanInputSatuan && (
              <div className="bg-[#15171c] border border-gray-800 rounded-lg p-2 mt-1 space-y-1 animate-fadeIn max-h-24 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {daftarSatuan.map((sat, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-[#222530] text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-medium border border-gray-800"
                    >
                      {sat}
                      <button
                        type="button"
                        onClick={(e) => handleHapusSatuan(sat, e)}
                        className="text-red-400 hover:text-red-300 font-black text-[9px] ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-800 space-y-2.5">
              <div>
                <label className="block text-gray-400 mb-1">
                  Harga Beli / HPP Pokok (Rp){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formProduk.hpp}
                  onChange={(e) =>
                    setFormProduk({ ...formProduk, hpp: e.target.value })
                  }
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:border-emerald-500 focus:outline-none text-[11px]"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">
                  Harga Jual Target (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formProduk.hargaJual}
                  onChange={(e) =>
                    setFormProduk({ ...formProduk, hargaJual: e.target.value })
                  }
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:border-emerald-500 focus:outline-none text-[11px]"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-[11px] transition-all uppercase tracking-wider shadow-lg shadow-emerald-950/20 active:scale-95"
          >
            💾 Simpan Produk
          </button>
        </form>

        {/* PANEL KANAN: MONITORING MONITOR TABLE */}
        <div className="xl:col-span-9 bg-[#1a1c23] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider self-start sm:self-center">
              📋 Master Inventori & Keuangan
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
                  <th className="p-3.5 pl-5 w-[10%]">SKU</th>
                  <th className="p-3.5 w-[24%]">Nama Varian Produk</th>
                  <th className="p-3.5 text-right w-[11%]">HPP Pokok</th>
                  <th className="p-3.5 text-right text-blue-400 w-[11%]">
                    Harga Jual
                  </th>
                  <th className="p-3.5 text-right text-cyan-400 w-[11%]">
                    Laba Kotor
                  </th>
                  <th className="p-3.5 text-center w-[11%]">Margin (%)</th>
                  <th className="p-3.5 text-right w-[8%]">Batas Min.</th>
                  <th className="p-3.5 text-right text-emerald-400 w-[8%]">
                    Stok Aktual
                  </th>
                  <th className="p-3.5 text-center w-[3%]">Satuan</th>
                  <th className="p-3.5 text-center pr-5 w-[3%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 font-medium text-xs">
                {loading ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="p-8 text-center text-emerald-400 font-semibold bg-[#1a1c23]"
                    >
                      🔄 Sinkronisasi data gudang dengan server Django...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="p-8 text-center text-gray-500 font-semibold bg-[#1a1c23]"
                    >
                      ❌ Data produk gudang kosong atau tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => {
                    const currentMinStok = item.min_stok ?? item.minStok ?? 0;
                    const currentStokAktual =
                      item.stok_aktual ?? item.stokAktual ?? 0;
                    const isStokKritis = currentStokAktual <= currentMinStok;
                    const currentHpp = item.hpp ?? 0;
                    const currentHargaJual =
                      item.harga_jual ?? item.hargaJual ?? 0;

                    const selisihLabaKotor = currentHargaJual - currentHpp;

                    const persentaseMargin =
                      currentHargaJual > 0
                        ? ((selisihLabaKotor / currentHargaJual) * 100).toFixed(
                            1,
                          )
                        : "0.0";

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
                        <td className="p-3.5 text-right text-gray-400 font-mono">
                          Rp {currentHpp.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right text-blue-400 font-mono font-bold">
                          Rp {currentHargaJual.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right text-cyan-400 font-mono font-bold">
                          Rp {selisihLabaKotor.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#142320] text-[#34d399] border border-[#10b981]/20">
                            {persentaseMargin}%
                          </span>
                        </td>
                        <td className="p-3.5 text-right text-gray-500 font-bold">
                          {currentMinStok.toLocaleString()}
                        </td>
                        <td
                          className={`p-3.5 text-right font-black text-sm ${isStokKritis ? "text-red-500" : "text-emerald-400"}`}
                        >
                          {currentStokAktual.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${isStokKritis ? "bg-red-950/60 text-red-400 border-red-900/50" : "bg-emerald-950/60 text-emerald-400 border-emerald-900/50"}`}
                          >
                            {(item.satuan || "").toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5 text-center pr-5 select-none">
                          <div className="flex items-center justify-center space-x-3">
                            <button
                              type="button"
                              onClick={() => handleEditClick(item)}
                              className="text-gray-500 hover:text-emerald-400 transition-colors text-xs"
                            >
                              📝
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDataAkanDihapus({
                                  id: item.id,
                                  nama: item.nama,
                                })
                              }
                              className="text-gray-500 hover:text-red-400 transition-colors text-xs"
                            >
                              🗑️
                            </button>
                          </div>
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

      {/* MODAL CONFIRMATION: SAVE/UPDATE */}
      {dataAkanDisimpan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className={`bg-[#1a1c23] border rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl ${dataAkanDisimpan.isUpdate ? "border-amber-500/30" : "border-blue-500/30"}`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-xl">
                {dataAkanDisimpan.isUpdate ? "⚠️" : "📝"}
              </span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                {dataAkanDisimpan.isUpdate
                  ? "Konfirmasi Perubahan Data"
                  : "Konfirmasi Produk Baru"}
              </h3>
            </div>

            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              {dataAkanDisimpan.isUpdate ? (
                <span>
                  Kode SKU{" "}
                  <span className="font-mono font-bold text-amber-400">
                    {dataAkanDisimpan.sku}
                  </span>{" "}
                  sudah terdaftar. Melanjutkan tindakan ini akan memperbarui
                  nama produk, nilai finansial, and ambang batas minimum data
                  master tersebut.
                </span>
              ) : (
                <span>
                  Anda akan mendaftarkan varian sterno baru dengan kode SKU{" "}
                  <span className="font-mono font-bold text-blue-400">
                    {dataAkanDisimpan.sku}
                  </span>{" "}
                  ke dalam database utama.
                </span>
              )}
            </div>

            <div className="bg-[#15171c] p-3.5 rounded-lg space-y-2 text-xs border border-gray-800 font-medium">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama Item:</span>
                <span className="text-white font-bold">
                  {dataAkanDisimpan.nama}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Harga Pokok (HPP):</span>
                <span className="text-gray-300 font-mono">
                  Rp {dataAkanDisimpan.hpp.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Harga Jual Target:</span>
                <span className="text-blue-400 font-mono font-bold">
                  Rp {dataAkanDisimpan.harga_jual.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Batas Reorder Minimum:</span>
                <span className="text-gray-300 font-bold">
                  {dataAkanDisimpan.min_stok.toLocaleString()}{" "}
                  {dataAkanDisimpan.satuan}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDataAkanDisimpan(null)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-bold transition-all"
              >
                Batal / Cek Ulang
              </button>
              <button
                type="button"
                onClick={handleEksekusiSimpan}
                className={`flex-1 text-white py-2.5 rounded-lg font-bold transition-all shadow-lg ${dataAkanDisimpan.isUpdate ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500"}`}
              >
                Ya, Simpan Master
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION: DELETE */}
      {dataAkanDihapus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-red-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🚨</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Hapus Master Produk?
              </h3>
            </div>

            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Apakah Anda benar-benar yakin ingin menghapus data master varian{" "}
              <span className="text-red-400 font-bold">
                "{dataAkanDihapus.nama}"
              </span>{" "}
              ? Seluruh data finansial dan reorder minimum pada item ini akan
              dibuang permanen dari database utama.
            </div>

            <div className="flex gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDataAkanDihapus(null)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-bold transition-all"
              >
                Batal / Jangan Hapus
              </button>
              <button
                type="button"
                onClick={handleEksekusiHapus}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-bold transition-all shadow-lg"
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
