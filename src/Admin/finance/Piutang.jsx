import React, { useState, useEffect } from "react";

export default function Piutang() {
  // ==========================================================
  // [SESI 1: STATE MANAGEMENT & INITIALIZATION (LACI MEMORI)]
  // ==========================================================
  // Semua fungsi useState di bawah ini ibarat laci penyimpanan di meja kerja kasir.

  // Laci utama untuk menampung seluruh daftar kertas nota piutang yang diambil dari database Django
  const [daftarPiutang, setDaftarPiutang] = useState([]);

  // Saklar lampu indikator. Jika 'true', layar menampilkan animasi memuat data dari server
  const [loading, setLoading] = useState(true);

  // Penampung teks ketikan kasir di kolom pencarian (mencari nama toko atau nomor invoice)
  const [searchTerm, setSearchTerm] = useState("");

  // Menyimpan status filter aktif di atas tabel (default "Semua", bisa pindah ke "Lunas"/"Belum Lunas")
  const [filterStatus, setFilterStatus] = useState("Semua");

  // Tempat menaruh SATU objek data piutang yang dipilih kasir saat mau melakukan pelunasan uang
  const [piutangAkanDilunasi, setPiutangAkanDilunasi] = useState(null);

  // Tempat menaruh data manifest rincian item barang (SKU, Nama, Qty) setelah sukses ditembak dari database
  const [invoiceDitinjau, setInvoiceDitinjau] = useState(null);

  // Indikator loading mini khusus saat backend sedang sibuk mencari rincian item barang dari invoice tertentu
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Slot memori untuk mengunci data invoice yang ditargetkan kasir untuk dihapus permanen lewat modal merah
  const [dataAkanHapus, setDataAkanHapus] = useState(null);

  // ==========================================================
  // [SESI 2: DATA FETCHING LOGIC (PIPA INTEGRASI DJANGO API)]
  // ==========================================================

  // Pemicu otomatis: Begitu browser selesai merender halaman ini pertama kali, langsung ambil data dari server
  useEffect(() => {
    fetchPiutangDariBackend();
  }, []); // Array kosong [] menjamin fungsi di dalam hanya berjalan 1x di awal pembukaan halaman

  // FUNGSI A: Mengambil data master piutang dagang dari database pusat
  const fetchPiutangDariBackend = async () => {
    try {
      // Kirim kurir fetch untuk meminta data ke endpoint keuangan milik Django
      const response = await fetch(
        "http://127.0.0.1:8000/api/finance/piutang/",
      );

      // Jika gerbang API backend error atau down, lempar instruksi ke blok catch
      if (!response.ok)
        throw new Error("Gagal mengambil data piutang dari server");

      // Konversi paket data mentah json dari server menjadi object JavaScript
      const data = await response.json();

      // Jembatan Bahasa: Petakan database Django (snake_case) ke format React (camelCase)
      const dataDipetakan = data.map((item) => ({
        id: item.id,
        nomorInvoice: item.nomor_invoice,
        pelanggan: item.pelanggan,
        tanggalTransaksi: item.tanggal_transaksi,
        jatuhTempo: item.jatuh_tempo,
        totalTagihan: item.total_tagihan,
        sisaPiutang: item.sisa_piutang,
        statusPiutang: item.status_piutang,
      }));

      // Masukkan data yang sudah rapi ke laci utama agar tabel otomatis terisi
      setDaftarPiutang(dataDipetakan);
    } catch (error) {
      console.error("Error Fetching Piutang:", error);
      alert("Koneksi data piutang ke server Django terputus!");
    } finally {
      // Matikan lampu indikator memuat data, karena proses fetching sudah selesai (sukses/gagal)
      setLoading(false);
    }
  };

  // FUNGSI B: Mengambil detail sub-item barang di dalam invoice saat baris tabel diklik
  const handleBukaRincianDokumen = async (id) => {
    // Nyalakan loading khusus detail barang
    setLoadingDetail(true);
    try {
      // Tembak API Django spesifik menggunakan ID piutang target
      const response = await fetch(
        `http://127.0.0.1:8000/api/finance/piutang/${id}/`,
      );
      if (!response.ok)
        throw new Error("Gagal memuat rincian item dari server");

      const data = await response.json();
      // Masukkan data rincian barang ke state peninjauan agar pop-up modal tergambar di layar
      setInvoiceDitinjau(data);
    } catch (error) {
      console.error("Error detail piutang:", error);
      alert(error.message);
    } finally {
      // Matikan loading detail barang
      setLoadingDetail(false);
    }
  };

  // ==========================================================
  // [SESI 3: MUTATION LOGIC (PROSEDUR PERUBAHAN & PENGHAPUSAN)]
  // ==========================================================

  // FUNGSI A: Eksekusi mengubah status utang menjadi Lunas (PUT Method)
  const handleEksekusiPelunasanFull = async () => {
    // Safety guard: Jika data kosong, batalkan eksekusi untuk menghindari eror crash aplikasi
    if (!piutangAkanDilunasi) return;

    // Bungkus paket data baru. Set sisa_piutang jadi 0 dan ganti status keuangan menjadi "Lunas"
    const payload = {
      nomor_invoice: piutangAkanDilunasi.nomorInvoice,
      pelanggan: piutangAkanDilunasi.pelanggan,
      tanggal_transaksi: piutangAkanDilunasi.tanggalTransaksi,
      jatuh_tempo: piutangAkanDilunasi.jatuhTempo,
      total_tagihan: piutangAkanDilunasi.totalTagihan,
      sisa_piutang: 0,
      status_piutang: "Lunas",
    };

    try {
      // Kirim perintah PUT ke server untuk menimpa data piutang lama di database Django
      const response = await fetch(
        `http://127.0.0.1:8000/api/finance/piutang/${piutangAkanDilunasi.id}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) throw new Error("Gagal memproses pelunasan di server");

      const dataTerupdate = await response.json();

      // JALUR OVERRIDE STATE: Mengubah data di layar kasir secara instan tanpa fetch ulang ke server
      setDaftarPiutang((prevList) =>
        prevList.map(
          (item) =>
            item.id === piutangAkanDilunasi.id
              ? {
                  ...item,
                  sisaPiutang: dataTerupdate.sisa_piutang,
                  statusPiutang: dataTerupdate.status_piutang,
                }
              : item, // Jika ID tidak cocok, biarkan data item PO/Sales lainnya tetap utuh
        ),
      );

      // Tutup kembali pop-up modal pelunasan keuangan
      setPiutangAkanDilunasi(null);
    } catch (error) {
      console.error("Error Pelunasan Piutang:", error);
      alert(error.message);
    }
  };

  // FUNGSI B: Lenyapkan catatan piutang dari lembar kerja (DELETE Method)
  const handleEksekusiHapus = async () => {
    if (!dataAkanHapus) return;

    try {
      // Kirim sinyal penghancuran data (DELETE) ke server database Django
      const response = await fetch(
        `http://127.0.0.1:8000/api/finance/piutang/${dataAkanHapus.id}/`,
        { method: "DELETE" },
      );

      if (!response.ok)
        throw new Error("Gagal menghapus entitas piutang dari server");

      // Usir baris data yang dihapus dari layar browser kasir menggunakan fungsi array .filter()
      setDaftarPiutang((prev) =>
        prev.filter((item) => item.id !== dataAkanHapus.id),
      );

      // Bersihkan dan tutup seluruh sisa pop-up modal yang sedang mengambang di layar
      setInvoiceDitinjau(null);
      setDataAkanHapus(null);
    } catch (error) {
      console.error("Error Deleting Piutang:", error);
      alert(error.message);
    }
  };

  // ==========================================================
  // [SESI 4: LIVE METRIC CALCULATION & REAL-TIME FILTERING]
  // ==========================================================

  // METRIK 1: Menghitung total akumulasi nominal piutang yang belum dibayar oleh pembeli/customer
  const totalPiutangBeredar = daftarPiutang.reduce(
    (sum, item) =>
      sum + (item.statusPiutang !== "Lunas" ? item.sisaPiutang : 0),
    0, // Angka akumulator sum dimulai dari nominal 0
  );

  // METRIK 2: Menghitung total nilai uang yang mandek akibat customer melewati batas tanggal jatuh tempo
  const totalOverdue = daftarPiutang.reduce(
    (sum, item) =>
      sum + (item.statusPiutang === "Jatuh Tempo" ? item.sisaPiutang : 0),
    0,
  );

  // ENGINE PENYARING DATA: Memotong isi tabel secara real-time berdasarkan input ketikan teks and tombol status
  const filteredData = daftarPiutang.filter((item) => {
    const cocokNama =
      item.pelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nomorInvoice.toLowerCase().includes(searchTerm.toLowerCase());

    const cocokStatus =
      filterStatus === "Semua" || item.statusPiutang === filterStatus;

    return cocokNama && cocokStatus; // Hanya lolos ke tabel jika kedua kondisi bernilai benar (true)
  });

  // ==========================================================
  // [SESI 5: RENDER USER INTERFACE & POP-UP LAYOUT MODAL]
  // ==========================================================
  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col">
      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Piutang Dagang Usaha
        </h2>
      </div>

      {/* METRIK SUMMARY BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Total Piutang Aktif
          </p>
          <p className="text-xl font-black text-amber-400 mt-1">
            Rp {totalPiutangBeredar.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Jatuh Tempo
          </p>
          <p className="text-xl font-black text-red-500 mt-1">
            Rp {totalOverdue.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Total Invoice Pending
          </p>
          <p className="text-xl font-black text-white mt-1">
            {daftarPiutang.filter((i) => i.statusPiutang !== "Lunas").length}{" "}
            Dokumen
          </p>
        </div>
      </div>

      {/* FILTER PENCARIAN */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari Invoice atau Nama Toko/Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex gap-2 text-xs">
          {["Semua", "Belum Lunas", "Jatuh Tempo", "Lunas"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                filterStatus === status
                  ? "bg-amber-950/20 border-amber-500 text-amber-400"
                  : "bg-[#15171c] border-gray-800 text-gray-400 hover:border-gray-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* TABEL DATA PIUTANG */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#15171c] text-gray-400 border-b border-gray-800 uppercase tracking-wider font-semibold select-none">
                <th className="p-4">No. Invoice</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Tgl Nota</th>
                <th className="p-4">Jatuh Tempo</th>
                <th className="p-4 text-center">Total Tagihan</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-8 text-center text-amber-400 font-semibold bg-[#1a1c23]"
                  >
                    🔄 Menyelaraskan sisa piutang usaha dengan server Django...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-8 text-center text-gray-500 font-medium"
                  >
                    Tidak ada data transaksi piutang usaha yang cocok.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#20232c] transition-colors cursor-pointer"
                    onClick={() => handleBukaRincianDokumen(item.id)}
                  >
                    <td className="p-4 font-mono font-bold text-amber-500">
                      {item.nomorInvoice}
                    </td>
                    <td className="p-4 font-semibold text-gray-200">
                      {item.pelanggan}
                    </td>
                    <td className="p-4 text-gray-400">
                      {item.tanggalTransaksi}
                    </td>
                    <td
                      className={`p-4 font-medium ${item.statusPiutang === "Jatuh Tempo" ? "text-red-400" : "text-gray-400"}`}
                    >
                      {item.jatuhTempo}
                    </td>
                    <td className="p-4 text-center text-gray-300 font-semibold">
                      Rp {item.totalTagihan.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.statusPiutang === "Lunas"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                            : item.statusPiutang === "Jatuh Tempo"
                              ? "bg-red-950 text-red-400 border border-red-900"
                              : "bg-amber-950 text-amber-400 border border-amber-900"
                        }`}
                      >
                        {item.statusPiutang === "Lunas"
                          ? "✅ Lunas"
                          : item.statusPiutang}
                      </span>
                    </td>
                    <td
                      className="p-4 text-center"
                      onClick={(e) => e.stopPropagation()} // Menahan pemicu agar klik tombol lunas tidak bentrok dengan fungsi klik baris tabel
                    >
                      <div className="flex items-center justify-center gap-3">
                        {item.statusPiutang !== "Lunas" ? (
                          <button
                            type="button"
                            onClick={() => setPiutangAkanDilunasi(item)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[11px] transition-all active:scale-95 shadow-md shadow-emerald-950/20"
                          >
                            💸 Set lunas
                          </button>
                        ) : (
                          <span className="text-gray-600 text-[11px] font-medium">
                            Lunas
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INDIKATOR LOADING DETAIL BARANG */}
      {loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="text-amber-400 font-bold text-xs">
            🔄 Memuat rincian berkas dari gudang...
          </div>
        </div>
      )}

      {/* MODAL POPUP: RINCIAN DOKUMEN ITEM INVOICE JUAL */}
      {invoiceDitinjau && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl w-full max-w-2xl p-5 shadow-2xl relative space-y-4">
            <button
              onClick={() => setInvoiceDitinjau(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors font-bold text-sm"
            >
              ✕
            </button>
            <div>
              <h3 className="text-sm font-black uppercase text-white tracking-wide">
                Rincian Dokumen Item Invoice Jual
              </h3>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                No Ref: {invoiceDitinjau.nomor_invoice} | Tanggal:{" "}
                {invoiceDitinjau.tanggal_transaksi}
              </p>
            </div>
            <div className="bg-[#15171c]/60 border border-gray-800/80 rounded-xl p-3.5 text-xs space-y-2">
              <div>
                <p className="text-[10px] text-gray-500 font-medium">
                  Customer / Toko Pembeli:
                </p>
                <p className="text-white font-black text-sm mt-0.5">
                  {invoiceDitinjau.pelanggan}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-800/40">
                <p className="text-[10px] text-gray-500 font-medium">
                  Alamat Tujuan Pengiriman:
                </p>
                <p className="text-gray-300 font-bold mt-0.5">
                  {invoiceDitinjau.alamat || "Jakarta"}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-800/40 flex justify-between items-center text-[11px]">
                <div>
                  <span className="text-gray-500">Metode Jual:</span>
                  <span className="text-amber-400 font-black ml-1.5">
                    {invoiceDitinjau.status_piutang === "Lunas"
                      ? "LUNAS"
                      : "TEMPO / KREDIT (Belum Lunas)"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Biaya Kirim:</span>
                  <span className="text-emerald-400 font-mono font-bold ml-1.5">
                    Rp 0
                  </span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-800/50 max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#15171c] text-gray-400 border-b border-gray-800 text-[10px] font-bold">
                    <th className="p-3 pl-4 w-[15%]">SKU</th>
                    <th className="p-3 w-[45%]">
                      Deskripsi Varian Produk Terjual
                    </th>
                    <th className="p-3 text-right w-[15%]">Harga Jual</th>
                    <th className="p-3 text-center w-[10%]">Qty</th>
                    <th className="p-3 text-right pr-4 w-[15%]">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 font-medium text-xs">
                  {invoiceDitinjau.items && invoiceDitinjau.items.length > 0 ? (
                    invoiceDitinjau.items.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-[#20232c]/40 text-gray-300"
                      >
                        <td className="p-3 pl-4 font-mono text-blue-400">
                          {item.sku}
                        </td>
                        <td className="p-3 text-white font-bold">
                          {item.nama_produk}
                        </td>
                        <td className="p-3 text-right text-gray-400 font-mono">
                          Rp {item.harga.toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-bold text-white font-mono">
                          {item.qty}
                        </td>
                        <td className="p-3 text-right pr-4 text-sky-400 font-bold font-mono">
                          Rp {item.total.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-gray-500">
                        Item tidak ditemukan atau nota lama.
                      </td>
                    </tr>
                  )}
                  <tr className="bg-[#15171c]/80 text-xs font-black text-white">
                    <td colSpan="4" className="p-2.5 text-right text-gray-400">
                      GRAND TOTAL NOTA MASUK:
                    </td>
                    <td className="p-2.5 text-right pr-4 font-mono text-sm text-sky-400">
                      Rp{" "}
                      {invoiceDitinjau.total_tagihan
                        ? invoiceDitinjau.total_tagihan.toLocaleString()
                        : (
                            invoiceDitinjau.total_merchandise || 0
                          ).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setDataAkanHapus({
                    id: invoiceDitinjau.id,
                    nomorInvoice: invoiceDitinjau.nomor_invoice,
                  })
                }
                className="w-1/3 bg-red-950/30 hover:bg-red-900/60 border border-red-800/50 text-red-400 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all shadow-sm"
              >
                🗑️ Hapus
              </button>
              <button
                type="button"
                onClick={() => setInvoiceDitinjau(null)}
                className="w-2/3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all shadow-sm"
              >
                Tutup Peninjauan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION: DELETE (SI MERAH) */}
      {dataAkanHapus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1a1c23] border border-red-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🚨</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Hapus Record Piutang?
              </h3>
            </div>
            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Apakah Anda benar-benar yakin ingin menghapus record piutang untuk
              invoice{" "}
              <span className="font-mono font-bold text-red-400">
                "{dataAkanHapus.nomorInvoice}"
              </span>
              ? Tindakan ini hanya membuang pencatatan tagihan di modul finance
              and tidak akan menghapus berkas utama transaksi di POS.
            </div>
            <div className="flex gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDataAkanHapus(null)}
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

      {/* MODAL CONFIRMATION: PELUNASAN (SI AMBER) */}
      {piutangAkanDilunasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1a1c23] border border-amber-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-amber-500">
              <span className="text-xl">⚠️</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Perhatian Sebelum Menyimpan!
              </h3>
            </div>
            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Anda akan merubah status nota{" "}
              <span className="font-mono font-bold text-white">
                "{piutangAkanDilunasi.nomorInvoice}"
              </span>{" "}
              milik{" "}
              <span className="text-white font-bold">
                {piutangAkanDilunasi.pelanggan}
              </span>{" "}
              menjadi <span className="text-emerald-400 font-bold">LUNAS</span>{" "}
              secara penuh.
            </div>
            <div className="bg-[#15171c] p-3.5 rounded-lg space-y-2 text-xs border border-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-500">Nilai Tagihan Hutang:</span>
                <span className="text-gray-300 font-bold">
                  Rp {piutangAkanDilunasi.totalTagihan.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-800/60 pt-2 font-bold">
                <span className="text-gray-500">Jumlah Uang Diterima:</span>
                <span className="text-emerald-400 text-sm">
                  Rp {piutangAkanDilunasi.sisaPiutang.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 italic">
              * Pastikan dana transfer bank atau kas fisik tunai sudah
              benar-benar masuk ke rekening PT Solution Corp Indonesia sebelum
              menekan tombol simpan.
            </p>
            <div className="flex gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setPiutangAkanDilunasi(null)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-bold transition-all"
              >
                Kembali / Batal
              </button>
              <button
                type="button"
                onClick={handleEksekusiPelunasanFull}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-emerald-950/20"
              >
                Ya, Simpan Lunas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
