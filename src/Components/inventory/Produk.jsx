import React, { useState, useEffect } from "react";

export default function Produk() {
  const [daftarProduk, setDaftarProduk] = useState(() => {
    const dataLokal = localStorage.getItem("PT_Solution_Master_Produk");
    if (dataLokal) return JSON.parse(dataLokal);
    return [
      {
        id: 1,
        sku: "STR-001",
        nama: "Sterno Kaleng Original Pxton",
        minStok: 500,
        stokAktual: 1500,
        satuan: "Pcs",
      },
      {
        id: 2,
        sku: "STR-002",
        nama: "Sterno Gel Refill 1kg Pxton",
        minStok: 100,
        stokAktual: 98,
        satuan: "Pail",
      },
    ];
  });

  const [daftarSatuan, setDaftarSatuan] = useState(() => {
    const satuanLokal = localStorage.getItem("PT_Solution_Master_Satuan");
    if (satuanLokal) return JSON.parse(satuanLokal);
    return ["Pcs", "Kaleng", "Pail", "Kg"];
  });

  const [formProduk, setFormProduk] = useState({
    sku: "",
    nama: "",
    minStok: "",
    satuan: "Pcs",
  });

  const [satuanBaru, setSatuanBaru] = useState("");
  const [tampilkanInputSatuan, setTampilkanInputSatuan] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [dataAkanDisimpan, setDataAkanDisimpan] = useState(null);
  const [dataAkanDihapus, setDataAkanDihapus] = useState(null);

  // Auto-save Perubahan Data ke LocalStorage
  useEffect(() => {
    localStorage.setItem(
      "PT_Solution_Master_Produk",
      JSON.stringify(daftarProduk),
    );
  }, [daftarProduk]);

  useEffect(() => {
    localStorage.setItem(
      "PT_Solution_Master_Satuan",
      JSON.stringify(daftarSatuan),
    );
  }, [daftarSatuan]);

  //  PICU EDIT
  const handleEditClick = (item) => {
    setFormProduk({
      sku: item.sku,
      nama: item.nama,
      minStok: item.minStok,
      satuan: item.satuan,
    });
  };

  // TAMBAH SATUAN BARU
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

  // BUANG/HAPUS SATUAN
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

  // Pemicu Modal Sebelum Simpan
  const handlePicuKonfirmasi = (e) => {
    e.preventDefault();
    if (formProduk.nama.trim() === "" || formProduk.sku.trim() === "") return;

    const targetSku = formProduk.sku.trim().toUpperCase();
    const isUpdate = daftarProduk.some((item) => item.sku === targetSku);

    const produkLama = daftarProduk.find((item) => item.sku === targetSku);
    const stokBerjalan = produkLama ? produkLama.stokAktual : 0;

    setDataAkanDisimpan({
      isUpdate,
      sku: targetSku,
      nama: formProduk.nama.trim(),
      minStok: parseInt(formProduk.minStok) || 0,
      satuan: formProduk.satuan,
      stokAktual: stokBerjalan,
    });
  };

  // Eksekusi Simpan Final
  const handleEksekusiSimpan = () => {
    if (!dataAkanDisimpan) return;

    const indexDataLama = daftarProduk.findIndex(
      (item) => item.sku === dataAkanDisimpan.sku,
    );

    if (indexDataLama !== -1) {
      setDaftarProduk((prev) =>
        prev.map((item, idx) =>
          idx === indexDataLama
            ? {
                ...item,
                nama: dataAkanDisimpan.nama,
                minStok: dataAkanDisimpan.minStok,
                satuan: dataAkanDisimpan.satuan,
              }
            : item,
        ),
      );
    } else {
      setDaftarProduk((prev) => [
        ...prev,
        { id: Date.now(), ...dataAkanDisimpan },
      ]);
    }

    setFormProduk({
      sku: "",
      nama: "",
      minStok: "",
      satuan: daftarSatuan[0] || "Pcs",
    });
    setDataAkanDisimpan(null);
  };

  // EKSEKUSI HAPUS BARANG PERMANEN
  const handleEksekusiHapus = () => {
    if (!dataAkanDihapus) return;
    setDaftarProduk((prev) =>
      prev.filter((item) => item.id !== dataAkanDihapus.id),
    );
    setDataAkanDihapus(null);
  };

  const filteredData = daftarProduk.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      {/* HEADER MODUL */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Master Produk
        </h2>
      </div>

      {/* GRID RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* PANEL KIRI: FORM INPUT REGISTRASI BARANG BARU */}
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

              {/* DROPDOWN SATUAN UNIT CUSTOM */}
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

            {/* LIST MANAGEMENT UNTUK MEMBUANG SATUAN YANG SUDAH ADA */}
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
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-[11px] transition-all uppercase tracking-wider shadow-lg shadow-emerald-950/20 active:scale-95"
          >
            💾 Simpan Produk
          </button>
        </form>

        {/* PANEL KANAN: TABEL MONITORING STOK CLEAN */}
        <div className="xl:col-span-9 bg-[#1a1c23] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider self-start sm:self-center">
              📋 Produk
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
                  <th className="p-3.5 pl-5 w-[15%]">SKU</th>
                  <th className="p-3.5 w-[40%]">Nama Varian Produk</th>
                  <th className="p-3.5 text-right w-[15%]">Batas Min.</th>
                  <th className="p-3.5 text-right text-emerald-400 w-[15%]">
                    Stok Aktual
                  </th>
                  <th className="p-3.5 text-center w-[10%]">Satuan</th>
                  <th className="p-3.5 text-center pr-5 w-[10%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 font-medium text-xs">
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-8 text-center text-gray-500 font-semibold bg-[#1a1c23]"
                    >
                      ❌ Data produk gudang kosong atau tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => {
                    const isStokKritis = item.stokAktual <= item.minStok;

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
                        <td className="p-3.5 text-right text-gray-500 font-bold">
                          {item.minStok.toLocaleString()}
                        </td>
                        <td
                          className={`p-3.5 text-right font-black text-sm ${isStokKritis ? "text-red-500" : "text-emerald-400"}`}
                        >
                          {item.stokAktual.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                              isStokKritis
                                ? "bg-red-950/60 text-red-400 border-red-900/50"
                                : "bg-emerald-950/60 text-emerald-400 border-emerald-900/50"
                            }`}
                          >
                            {item.satuan.toUpperCase()}
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

      {/* MODAL POP-UP 1: PERINGATAN SEBELUM SAVE DATA STOK GUDANG */}
      {dataAkanDisimpan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className={`bg-[#1a1c23] border rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl ${
              dataAkanDisimpan.isUpdate
                ? "border-amber-500/30"
                : "border-blue-500/30"
            }`}
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
                  sudah terdaftar. Melanjutkan tindakan ini akan{" "}
                  <span className="text-amber-400 font-bold">
                    memperbarui nama produk dan ambang batas minimum
                  </span>{" "}
                  data master tersebut.
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

            <div className="bg-[#15171c] p-3.5 rounded-lg space-y-2 text-xs border border-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama Item:</span>
                <span className="text-white font-bold">
                  {dataAkanDisimpan.nama}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Batas Reorder Minimum:</span>
                <span className="text-gray-300 font-bold">
                  {dataAkanDisimpan.minStok.toLocaleString()}{" "}
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
                className={`flex-1 text-white py-2.5 rounded-lg font-bold transition-all shadow-lg ${
                  dataAkanDisimpan.isUpdate
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                Ya, Simpan Master
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POP-UP 2: PERINGATAN SEBELUM HAPUS DATA PRODUK MASTER */}
      {dataAkanDihapus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-red-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
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
              </span>
              ? Seluruh data reorder minimum pada item ini akan dibuang permanen
              dari memori.
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
