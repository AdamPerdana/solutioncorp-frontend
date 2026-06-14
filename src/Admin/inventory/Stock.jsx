import React, { useState, useEffect, useMemo } from "react";

export default function Stok() {
  // ==========================================================
  // [SESI 1: STATE MANAGEMENT & INITIALIZATION (LACI MEMORI)]
  // ==========================================================
  // Papan kendali penyimpanan data logistik selama aplikasi berjalan di browser.

  // Laci utama penampung data inventory barang (nama, SKU, stok_aktual, min_stok) hasil tarikan dari Django
  const [daftarStok, setDaftarStok] = useState([]);

  // Indikator loading halaman saat aplikasi sedang sibuk bertukar data dengan database
  const [loading, setLoading] = useState(true);

  // Menyimpan string ID produk yang sedang dipilih oleh admin untuk dimutasi stoknya
  const [selectedProdukId, setSelectedProdukId] = useState("");

  // Menyimpan jenis mutasi aktif, bawaannya (default) adalah "MASUK", bisa diganti ke "KELUAR"
  const [jenisMutasi, setJenisMutasi] = useState("MASUK");

  // Menampung kuantitas jumlah angka barang yang mau disesuaikan ke dalam gudang
  const [jumlahQty, setJumlahQty] = useState("");

  // Penampung keyword teks untuk memfilter pencarian barang di tabel secara real-time
  const [searchTerm, setSearchTerm] = useState("");

  // ==========================================================
  // [SESI 2: DATA FETCHING FROM DJANGO BACKEND (KONEKSI API)]
  // ==========================================================

  // Trigger Otomatis: Sinkronisasikan data logistik sesaat setelah halaman berhasil dimuat
  useEffect(() => {
    fetchStokDariBackend();
  }, []);

  // Fungsi pengambil data produk logistik dari backend Django
  const fetchStokDariBackend = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/inventory/products/",
      );
      if (!response.ok)
        throw new Error("Gagal mengambil data inventori dari server");
      const data = await response.json();

      // Masukkan hasil data dari database pusat langsung ke laci master daftarStok
      setDaftarStok(data);
    } catch (error) {
      console.error("Error Fetching Inventory Data:", error);
      alert("Koneksi logistik stok ke server Django terputus!");
    } finally {
      // Matikan animasi loading jika proses request data telah selesai
      setLoading(false);
    }
  };

  // ==========================================================
  // [SESI 3: FORM CONTROL & UI INTERCEPTOR (PENGALIH DATA)]
  // ==========================================================

  // Fungsi pemindah data: Mengunci produk terpilih di tabel kanan untuk langsung dimasukkan ke form mutasi kiri
  const handleEditClick = (item) => {
    // Paksa konversi nilai ID ke bentuk string agar sesuai dengan format value bawaan tag <select> HTML
    setSelectedProdukId(item.id.toString());
    // Kosongkan kolom kuantitas agar admin bisa mengetik jumlah mutasi yang baru dengan bersih
    setJumlahQty("");
  };

  // ==========================================================
  // [SESI 4: DATABASE MUTATION (LOGISTIK API & EKSEKUSI PUT)]
  // ==========================================================

  // Prosedur hitung and kirim data penyesuaian stok baru ke database
  const handleEksekusiMutasi = async (e) => {
    e.preventDefault(); // Menahan reload halaman bawaan form HTML saat tombol submit diklik
    if (selectedProdukId === "" || !jumlahQty) return;

    const qtyData = parseInt(jumlahQty) || 0;
    if (qtyData <= 0) {
      alert("Kuantitas mutasi stok harus lebih besar dari 0!");
      return;
    }

    // Cari objek produk di dalam laci memori berdasarkan ID yang disasar di form input
    const produkTerpilih = daftarStok.find(
      (item) => item.id === parseInt(selectedProdukId),
    );
    if (!produkTerpilih) return;

    // Amankan nilai angka stok berjalan dari database (antisipasi camelCase atau snake_case)
    const currentStok =
      produkTerpilih.stok_aktual ?? produkTerpilih.stokAktual ?? 0;

    // PROTEKSI LOGIKA (ANTI-MINUS): Cegah paksa transaksi jika stok di gudang nilainya ngga cukup saat barang keluar
    if (jenisMutasi === "KELUAR" && currentStok - qtyData < 0) {
      alert(
        `Gagal! Stok aktual ${produkTerpilih.nama} tidak mencukupi untuk mutasi keluar sebesar itu.`,
      );
      return; // Batalkan eksekusi, kunci pipa request agar tidak menembak ke server
    }

    // KALKULATOR HITUNG STOK: Tambah nilai jika statusnya MASUK, kurangi nilai jika statusnya KELUAR
    const kalkulasiStokBaru =
      jenisMutasi === "MASUK"
        ? currentStok + qtyData
        : Math.max(0, currentStok - qtyData); // Math.max mengunci angka terbawah di level nol agar mutasi ngga minus

    // Bungkus payload bersih berformat snake_case untuk dikirim ke API ModelViewSet Django
    const payload = {
      sku: produkTerpilih.sku,
      nama: produkTerpilih.nama,
      min_stok: produkTerpilih.min_stok ?? produkTerpilih.minStok,
      satuan: produkTerpilih.satuan,
      stok_aktual: kalkulasiStokBaru, // Mengirimkan angka final kalkulasi stok terbaru
    };

    try {
      // Tembak REST API Django menggunakan metode PUT untuk memperbarui data baris produk tertentu
      const response = await fetch(
        `http://127.0.0.1:8000/api/inventory/products/${selectedProdukId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok)
        throw new Error("Gagal memperbarui posisi stok di server");

      const dataTerupdate = await response.json();

      // JALUR REAL-TIME STATE OVERRIDE: Cari produk yang dimutasi tadi di layar tabel, lalu timpa dengan data barunya secara instan
      setDaftarStok((prevData) =>
        prevData.map((item) =>
          item.id === dataTerupdate.id ? dataTerupdate : item,
        ),
      );

      // RESET FORM: Kembalikan kondisi form input ke setelan pabrik setelah sukses eksekusi
      setSelectedProdukId("");
      setJenisMutasi("MASUK");
      setJumlahQty("");
    } catch (error) {
      console.error("Error Updating Inventory Stock:", error);
      alert(error.message);
    }
  };

  // ==========================================================
  // [SESI 5: LIVE SEARCH FILTER LOGIC (PENCARIAN REAL-TIME)]
  // ==========================================================
  // useMemo mengunci data pencarian agar React ngga lemot karena mengulang filter data setiap admin mengetik huruf
  const filteredStok = useMemo(() => {
    return daftarStok.filter(
      (item) =>
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [daftarStok, searchTerm]); // Filter pencarian hanya jalan ulang kalau isi laci daftarStok atau kata kunci teks berubah

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      {/* HEADER MODUL */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Manajemen Stok Logistik
        </h2>
      </div>

      {/* GRID RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* PANEL KIRI: FORM MUTASI */}
        <form
          onSubmit={handleEksekusiMutasi}
          className="xl:col-span-3 bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3.5"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
            ➕ Input Stok Gudang
          </h3>

          <div className="space-y-2.5 text-xs">
            {/* 1. SELECTION PRODUK */}
            <div>
              <label className="block text-gray-400 mb-1">
                Pilih Produk SKU <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProdukId}
                onChange={(e) => setSelectedProdukId(e.target.value)}
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-medium focus:border-emerald-500 focus:outline-none cursor-pointer text-[11px]"
                required
              >
                <option value="">-- Pilih Produk Gudang --</option>
                {daftarStok.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    [{prod.sku}] - {prod.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. PILIHAN AKSI MUTASI */}
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
            💾 Eksekusi Perubahan Stok
          </button>
        </form>

        {/* PANEL KANAN: STATUS MONITORING TABLE */}
        <div className="xl:col-span-9 bg-[#1a1c23] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider self-start sm:self-center">
              📋 Real-time Status Inventori
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
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-8 text-center text-emerald-400 font-semibold bg-[#1a1c23]"
                    >
                      🔄 Menghubungkan logistik ke database Django...
                    </td>
                  </tr>
                ) : filteredStok.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-8 text-center text-gray-500 font-semibold bg-[#1a1c23]"
                    >
                      ❌ Data produk gudang tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredStok.map((item) => {
                    const currentMinStok = item.min_stok ?? item.minStok ?? 0;
                    const currentStokAktual =
                      item.stok_aktual ?? item.stokAktual ?? 0;

                    // ENGINE ALARM OTOMATIS: Stok dinyatakan kritis jika jumlahnya di bawah atau sama dengan batas reorder minimum
                    const isKritis = currentStokAktual <= currentMinStok;

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
                          {currentStokAktual.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right text-gray-500 font-bold">
                          {currentMinStok.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center select-none">
                          {/* SAKLAR BADGE VISUAL STATUS BARANG */}
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase border ${isKritis ? "bg-red-950/60 text-red-400 border-red-900/50" : "bg-emerald-950/60 text-emerald-400 border-emerald-900/50"}`}
                          >
                            {isKritis ? "⚠️ KRITIS" : "✅ AMAN"}
                          </span>
                        </td>
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
