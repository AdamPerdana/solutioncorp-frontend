import React, { useState, useEffect } from "react";

export default function Supplier() {
  // ==========================================================
  // [SESI 1: STATE MANAGEMENT & INITIALIZATION (LACI MEMORI)]
  // ==========================================================
  // Wadah penyimpanan status and data rekanan selama admin membuka halaman.

  // Laci utama penampung seluruh daftar profil data supplier/vendor dari cloud database Django
  const [daftarSupplier, setDaftarSupplier] = useState([]);

  // Lampu indikator loading data saat browser berkomunikasi dengan server
  const [loading, setLoading] = useState(true);

  // Object pengunci isi text field inputan pendaftaran maupun edit data supplier
  const [formSupplier, setFormSupplier] = useState({
    nama: "",
    kontak: "",
    telepon: "",
    alamat: "",
    rekening: "",
  });

  // Penampung keyword teks untuk fitur live search penyaringan data vendor di tabel
  const [searchTerm, setSearchTerm] = useState("");

  // Slot memori pengunci objek data supplier yang lolos validasi form dan siap dikirim ke API Django
  const [dataAkanDisimpan, setDataAkanDisimpan] = useState(null);

  // Slot memori pengunci data supplier yang ditargetkan untuk dihapus permanen lewat modal konfirmasi merah
  const [dataAkanDihapus, setDataAkanDihapus] = useState(null);

  // ==========================================================
  // [SESI 2: DATA FETCHING & BACKEND SYNC (PIPA INTEGRASI)]
  // ==========================================================

  // Trigger Otomatis: Langsung panggil data master supplier begitu halaman pertama kali dirender
  useEffect(() => {
    fetchSupplierDariBackend();
  }, []);

  // Membuka request jaringan internet ke endpoint suppliers milik Django
  const fetchSupplierDariBackend = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/inventory/suppliers/",
      );
      if (!response.ok)
        throw new Error("Gagal mengambil data supplier dari server");

      const data = await response.json();
      // Masukkan paket data dari database langsung ke state laci utama
      setDaftarSupplier(data);
    } catch (error) {
      console.error("Error Fetching Suppliers:", error);
      alert("Koneksi ke server backend Django terputus!");
    } finally {
      // Matikan status loading karena proses pengunduhan data selesai (sukses/gagal)
      setLoading(false);
    }
  };

  // ==========================================================
  // [SESI 3: FORM CONTROL & VALIDATION (INTERSEPTOR FORM)]
  // ==========================================================

  // FUNGSI A: Memindahkan data dari baris tabel ke kolom form input kiri saat tombol edit diklik
  const handleEditClick = (item) => {
    setFormSupplier({
      nama: item.nama,
      // FORM INTERCEPTOR: Jika data di database bernilai default strip "-", kosongkan field agar nyaman diketik ulang
      kontak: item.kontak === "-" ? "" : item.kontak,
      telepon: item.telepon === "-" ? "" : item.telepon,
      alamat: item.alamat === "-" ? "" : item.alamat,
      rekening: item.rekening === "-" ? "" : item.rekening,
    });
  };

  // FUNGSI B: Validasi and kalkulasi status sebelum memunculkan modal konfirmasi simpan/update data
  const handlePicuKonfirmasi = (e) => {
    e.preventDefault(); // Menahan reload halaman bawaan browser
    if (formSupplier.nama.trim() === "") return;

    const targetNama = formSupplier.nama.trim();

    // CREATE OR UPDATE DETECTOR: Cek apakah nama supplier yang diinput sudah ada di database (Case-Insensitive)
    const supplierLama = daftarSupplier.find(
      (item) => item.nama.toLowerCase() === targetNama.toLowerCase(),
    );

    // Kunci data ke state konfirmasi. Jika data opsional dikosongkan kasir, otomatis isi dengan tanda strip "-"
    setDataAkanDisimpan({
      isUpdate: !!supplierLama, // Jika supplierLama ditemukan bernilai true (PUT), jika tidak ditemukan bernilai false (POST)
      id: supplierLama ? supplierLama.id : null,
      nama: targetNama,
      kontak: formSupplier.kontak.trim() || "-",
      telepon: formSupplier.telepon.trim() || "-",
      alamat: formSupplier.alamat.trim() || "-",
      rekening: formSupplier.rekening.trim() || "-",
    });
  };

  // ==========================================================
  // [SESI 4: DATABASE MUTATION (POST, PUT, DELETE)]
  // ==========================================================

  // FUNGSI A: Prosedur simpan data baru (POST) atau perbarui data master lama (PUT) ke Django
  const handleEksekusiSimpan = async () => {
    if (!dataAkanDisimpan) return;

    // Bungkus payload bersih berformat standardisasi database
    const payload = {
      nama: dataAkanDisimpan.nama,
      kontak: dataAkanDisimpan.kontak,
      telepon: dataAkanDisimpan.telepon,
      alamat: dataAkanDisimpan.alamat,
      rekening: dataAkanDisimpan.rekening,
    };

    try {
      if (dataAkanDisimpan.isUpdate) {
        // --- KONDISI EDIT DATA SUPPLIER (PUT REQUEST) ---
        const response = await fetch(
          `http://127.0.0.1:8000/api/inventory/suppliers/${dataAkanDisimpan.id}/`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok)
          throw new Error("Gagal memperbarui profil vendor di server");

        const updatedData = await response.json();

        // Perbarui baris data tabel di browser admin secara instan tanpa reload halaman
        setDaftarSupplier((prev) =>
          prev.map((item) =>
            item.id === dataAkanDisimpan.id ? updatedData : item,
          ),
        );
      } else {
        // --- KONDISI REGISTER SUPPLIER BARU (POST REQUEST) ---
        const response = await fetch(
          "http://127.0.0.1:8000/api/inventory/suppliers/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok)
          throw new Error("Gagal mendaftarkan supplier baru ke server");

        const supplierBaru = await response.json();
        // Gabungkan supplier baru ke baris urutan paling atas di dalam tabel
        setDaftarSupplier((prev) => [supplierBaru, ...prev]);
      }

      // RESET FORM: Kembalikan isian semua text field input ke string kosong setelah sukses simpan data
      setFormSupplier({
        nama: "",
        kontak: "",
        telepon: "",
        alamat: "",
        rekening: "",
      });
      // Tutup modal pop-up konfirmasi simpan
      setDataAkanDisimpan(null);
    } catch (error) {
      console.error("Error Saving Supplier:", error);
      alert(error.message);
    }
  };

  // FUNGSI B: Prosedur eliminasi data master rekanan supplier dari database (DELETE REQUEST)
  const handleEksekusiHapus = async () => {
    if (!dataAkanDihapus) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/inventory/suppliers/${dataAkanDihapus.id}/`,
        { method: "DELETE" },
      );

      if (!response.ok)
        throw new Error("Gagal menghapus data supplier dari server");

      // Depak objek data supplier yang didelete dari tampilan array tabel di browser
      setDaftarSupplier((prev) =>
        prev.filter((item) => item.id !== dataAkanDihapus.id),
      );
      // Tutup modal konfirmasi hapus si merah
      setDataAkanDihapus(null);
    } catch (error) {
      console.error("Error Deleting Supplier:", error);
      alert(error.message);
    }
  };

  // ==========================================================
  // [SESI 5: MULTI-VARIABLE SEARCH FILTER & RENDERING LOGIC]
  // ==========================================================
  // ENGINE PENYARINGAN MULTIVARIABEL: Memotong isi tabel secara real-time berdasarkan 4 parameter kecocokan sekaligus
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
          Database Supplier
        </h2>
      </div>

      {/* GRID LAYOUT PROPORSIONAL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* PANEL KIRI: FORM REGISTRASI */}
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
            💾 Simpan Supplier
          </button>
        </form>

        {/* PANEL KANAN: MONITORING MONITOR TABLE */}
        <div className="xl:col-span-9 bg-[#1a1c23] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider self-start sm:self-center">
              📋 Daftar Supplier
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
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-8 text-center text-emerald-400 font-semibold bg-[#1a1c23]"
                    >
                      🔄 Menghubungkan ke basis data vendor Django...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
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

      {/* MODAL POP-UP 1: PERINGATAN SEBELUM SAVE (SI AMBER / SI EMERALD) */}
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

            <div className="bg-[#15171c] p-3.5 rounded-lg space-y-2 text-xs border border-gray-800 font-medium">
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

      {/* MODAL POP-UP 2: PERINGATAN SEBELUM HAPUS (SI MERAH) */}
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
              ? Tindakan ini akan menghapusnya secara permanen dari sistem
              database cloud.
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
