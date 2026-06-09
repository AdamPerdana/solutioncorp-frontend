import React, { useState, useEffect } from "react";

export default function Supplier() {
  // 1. Ambil data pemasok dari localStorage saat load awal, jika kosong pakai data contoh
  const [daftarSupplier, setDaftarSupplier] = useState(() => {
    const dataLokal = localStorage.getItem("PT_Solution_Database_Supplier");
    if (dataLokal) return JSON.parse(dataLokal);
    return [
      {
        id: 1,
        nama: "PT Kimia Industri Utama",
        kontak: "Irwan Wijaya",
        telepon: "081122334455",
        alamat: "Kawasan Industri Jababeka",
        rekening: "BCA 8720xxxxxx a/n PT Kimia Industri",
      },
      {
        id: 2,
        nama: "Pabrik Kaleng Logam Jaya",
        kontak: "Hendra Gunawan",
        telepon: "08199887766",
        alamat: "Tangerang",
        rekening: "Mandiri 11800xxxxxxx a/n Hendra G",
      },
      {
        id: 3,
        nama: "PT Kemasan Karton Raya",
        kontak: "Rian Hidayat",
        telepon: "085711223344",
        alamat: "Pulo Gadung, Jakarta Timur",
        rekening: "-",
      },
    ];
  });

  // 2. State Form Input Data Pemasok Baru (Termasuk Rekening)
  const [formSupplier, setFormSupplier] = useState({
    nama: "",
    kontak: "",
    telepon: "",
    alamat: "",
    rekening: "",
  });

  // State Kontrol Pencarian & Modal Pop-up
  const [searchTerm, setSearchTerm] = useState("");
  const [dataAkanDisimpan, setDataAkanDisimpan] = useState(null);
  const [dataAkanDihapus, setDataAkanDihapus] = useState(null);

  // 3. Auto-save Perubahan ke LocalStorage khusus Supplier
  useEffect(() => {
    localStorage.setItem(
      "PT_Solution_Database_Supplier",
      JSON.stringify(daftarSupplier),
    );
  }, [daftarSupplier]);

  // FUNGSI UTAMA: PICU EDIT (Lempar data ke form kiri)
  const handleEditClick = (item) => {
    setFormSupplier({
      nama: item.nama,
      kontak: item.kontak === "-" ? "" : item.kontak,
      telepon: item.telepon === "-" ? "" : item.telepon,
      alamat: item.alamat === "-" ? "" : item.alamat,
      rekening: item.rekening === "-" ? "" : item.rekening,
    });
  };

  // TAHAP 1 SIMPAN: VALIDASI & PICU MODAL KONFIRMASI
  const handlePicuKonfirmasi = (e) => {
    e.preventDefault();
    if (formSupplier.nama.trim() === "") return;

    const targetNama = formSupplier.nama.trim();
    const isUpdate = daftarSupplier.some(
      (item) => item.nama.toLowerCase() === targetNama.toLowerCase(),
    );

    setDataAkanDisimpan({
      isUpdate,
      nama: targetNama,
      kontak: formSupplier.kontak.trim() || "-",
      telepon: formSupplier.telepon.trim() || "-",
      alamat: formSupplier.alamat.trim() || "-",
      rekening: formSupplier.rekening.trim() || "-",
    });
  };

  // TAHAP 2 SIMPAN: EKSEKUSI SIMPAN / OVERWRITE DATA SUPPLIER
  const handleEksekusiSimpan = () => {
    if (!dataAkanDisimpan) return;

    const indexDataLama = daftarSupplier.findIndex(
      (item) => item.nama.toLowerCase() === dataAkanDisimpan.nama.toLowerCase(),
    );

    if (indexDataLama !== -1) {
      setDaftarSupplier((prev) =>
        prev.map((item, idx) =>
          idx === indexDataLama ? { ...item, ...dataAkanDisimpan } : item,
        ),
      );
    } else {
      setDaftarSupplier((prev) => [
        ...prev,
        { id: Date.now(), ...dataAkanDisimpan },
      ]);
    }

    setFormSupplier({
      nama: "",
      kontak: "",
      telepon: "",
      alamat: "",
      rekening: "",
    });
    setDataAkanDisimpan(null);
  };

  // FUNGSI EKSEKUSI HAPUS SUPPLIER PERMANEN
  const handleEksekusiHapus = () => {
    if (!dataAkanDihapus) return;
    setDaftarSupplier((prev) =>
      prev.filter((item) => item.id !== dataAkanDihapus.id),
    );
    dataLokalSinc(
      daftarSupplier.filter((item) => item.id !== dataAkanDihapus.id),
    );
    setDataAkanDihapus(null);
  };

  const dataLokalSinc = (dataBaru) => {
    localStorage.setItem(
      "PT_Solution_Database_Supplier",
      JSON.stringify(dataBaru),
    );
  };

  // PROSES PENYARINGAN DATA (SEARCH BAR UTAMA)
  const filteredData = daftarSupplier.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kontak.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.alamat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rekening.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      {/* HEADER MODUL */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Database Supplier (Pemasok)
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Kelola data profil produsen vendor, PIC agen bahan baku logam/kimia,
          rekaman bank transfer, serta lokasi pusat suplai.
        </p>
      </div>

      {/* GRID LAYOUT PROPORSIONAL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* PANEL KIRI: FORM REGISTRASI SUPPLIER (col-span-3) */}
        <form
          onSubmit={handlePicuKonfirmasi}
          className="xl:col-span-3 bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3.5"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
            ➕ Registrasi Supplier
          </h3>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">
                Nama Vendor / Pabrik <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Pabrik Logam Kaleng"
                value={formSupplier.nama}
                onChange={(e) =>
                  setFormSupplier({ ...formSupplier, nama: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none text-[11px] font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                Nama PIC Pemasok
              </label>
              <input
                type="text"
                placeholder="Contoh: Heri Wijaya"
                value={formSupplier.kontak}
                onChange={(e) =>
                  setFormSupplier({ ...formSupplier, kontak: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none text-[11px]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                No. Telepon / Kantor
              </label>
              <input
                type="text"
                placeholder="Contoh: 021-xxxxxxx"
                value={formSupplier.telepon}
                onChange={(e) =>
                  setFormSupplier({ ...formSupplier, telepon: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none text-[11px]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                Nomor Rekening Bank{" "}
                <span className="text-gray-600 text-[10px]">(Opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: BCA 12345678 a/n PT Logam"
                value={formSupplier.rekening}
                onChange={(e) =>
                  setFormSupplier({ ...formSupplier, rekening: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-emerald-400 focus:border-emerald-500 focus:outline-none text-[11px] font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                Alamat Kantor Gudang
              </label>
              <input
                type="text"
                placeholder="Contoh: Kawasan Industri Bekasi"
                value={formSupplier.alamat}
                onChange={(e) =>
                  setFormSupplier({ ...formSupplier, alamat: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none text-[11px]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-[11px] transition-all uppercase tracking-wider shadow-lg shadow-emerald-950/20 active:scale-95"
          >
            💾 Simpan Data Supplier
          </button>
        </form>

        {/* PANEL KANAN: MONITORING DATABASE REAL-TIME (col-span-9) */}
        <div className="xl:col-span-9 bg-[#1a1c23] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider self-start sm:self-center">
              📋 Daftar Vendor Mitra Terdaftar
            </h3>

            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Cari nama, rekening, atau lokasi..."
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
                  <th className="p-3.5 pl-5 w-[25%]">Nama Vendor / Pabrik</th>
                  <th className="p-3.5 w-[15%]">PIC Kontak</th>
                  <th className="p-3.5 w-[15%]">No. Telepon</th>
                  <th className="p-3.5 w-[20%]">Rekening Vendor</th>
                  <th className="p-3.5 text-center w-[12%]">Alamat</th>
                  <th className="p-3.5 text-center pr-5 w-[13%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 font-medium text-xs">
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-8 text-center text-gray-500 font-semibold bg-[#1a1c23]"
                    >
                      ❌ Data vendor supplier tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#1d2029]/60 transition-colors"
                    >
                      <td className="p-3.5 pl-5 text-white font-bold">
                        {item.nama}
                      </td>
                      <td className="p-3.5 text-gray-400">{item.kontak}</td>
                      <td className="p-3.5 text-gray-400 font-mono">
                        {item.telepon}
                      </td>
                      <td className="p-3.5 text-emerald-400 font-mono font-semibold text-[11px]">
                        {item.rekening}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="text-gray-300 font-semibold">
                          {item.alamat}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL POP-UP 1: PERINGATAN SEBELUM SAVE DATA SUPPLIER */}
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
                  ? "Konfirmasi Perubahan Profil"
                  : "Konfirmasi Supplier Baru"}
              </h3>
            </div>

            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              {dataAkanDisimpan.isUpdate ? (
                <span>
                  Nama Vendor Supplier{" "}
                  <span className="text-amber-400 font-bold">
                    "{dataAkanDisimpan.nama}"
                  </span>{" "}
                  sudah terdaftar. Melanjutkan tindakan ini akan{" "}
                  <span className="text-amber-400 font-bold">
                    memperbarui informasi kontak, rekening, dan alamat
                  </span>{" "}
                  rekanan tersebut.
                </span>
              ) : (
                <span>
                  Anda akan mendaftarkan rekanan supplier baru bernama{" "}
                  <span className="text-blue-400 font-bold">
                    "{dataAkanDisimpan.nama}"
                  </span>{" "}
                  ke dalam database utama.
                </span>
              )}
            </div>

            <div className="bg-[#15171c] p-3.5 rounded-lg space-y-2 text-xs border border-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-500">PIC Kontak:</span>
                <span className="text-white font-bold">
                  {dataAkanDisimpan.kontak}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rekening Bank:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {dataAkanDisimpan.rekening}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lokasi / Alamat:</span>
                <span className="text-gray-300 font-bold">
                  {dataAkanDisimpan.alamat}
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
                Ya, Simpan Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POP-UP 2: PERINGATAN SEBELUM HAPUS DATA SUPPLIER */}
      {dataAkanDihapus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-red-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🚨</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Hapus Data Supplier?
              </h3>
            </div>

            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Apakah Anda benar-benar yakin ingin menghapus profil supplier{" "}
              <span className="text-red-400 font-bold">
                "{dataAkanDihapus.nama}"
              </span>{" "}
              ? Tindakan ini akan menghapusnya secara permanen dari laci sistem
              lokal.
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
