import React, { useState, useEffect, useMemo } from "react";
// IMPOR NOTIFIKASI TOAST MODERN
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LaporanSales() {
  // ==========================================================
  // [SESI 1: STATE MANAGEMENT & INITIALIZATION (LACI MEMORI)]
  // ==========================================================

  // Laci utama penampung riwayat data transaksi penjualan riil hasil tarikan dari database Django
  const [dataSales, setDataSales] = useState([]);

  // Saklar loading utama untuk mengontrol indikator visual saat browser menyinkronkan data server
  const [loading, setLoading] = useState(true);

  // LOGIKA SETTING DATE DEFAULT (AWAL BULAN): Mengunci string tanggal ke tanggal 1 di bulan berjalan (YYYY-MM-01)
  const [filterTglMulai, setFilterTglMulai] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });

  // LOGIKA SETTING DATE DEFAULT (AKHIR BULAN): Mencari hari terakhir (bisa tanggal 28, 29, 30, atau 31) pada bulan berjalan
  const [filterTglSelesai, setFilterTglSelesai] = useState(() => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); // Parameter 0 mengambil hari terakhir bulan sebelumnya
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${lastDay}`;
  });

  // Keyword string untuk memfilter pencarian nomor invoice atau nama pelanggan secara real-time
  const [searchTerm, setSearchTerm] = useState("");

  // Menyimpan status filter keuangan, pilihan standarnya adalah "Semua Status"
  const [filterStatus, setFilterStatus] = useState("Semua Status");

  // Slot memori penyimpan objek transaksi yang diklik admin untuk ditinjau rincian item barangnya di pop-up modal
  const [salesTerpilih, setSalesTerpilih] = useState(null);

  // Slot pengunci transaksi yang ditargetkan untuk dihapus permanen lewat modal konfirmasi merah
  const [dataAkanDihapus, setDataAkanDihapus] = useState(null);

  // ==========================================================
  // [SESI 2: DATA FETCHING FROM DJANGO BACKEND (SINKRONISASI)]
  // ==========================================================

  // Trigger Otomatis: Tarik data transaksi penjualan sesaat setelah halaman dibuka pertama kali
  useEffect(() => {
    fetchSeluruhArsipSales();
  }, []);

  // Fungsi pengambil data riwayat penjualan utuh dari cloud backend Django
  const fetchSeluruhArsipSales = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/sales/pos-transactions/?all=true",
      );
      if (response.ok) {
        const data = await response.json();

        // Memetakan skema snake_case API backend menjadi camelCase agar serasi dengan arsitektur frontend React
        const dataDipetakan = data.map((item) => ({
          id: item.id,
          nomorInvoice: item.nomor_invoice,
          pelanggan: item.pelanggan,
          tanggal: item.tanggal,
          status: item.status === "Lunas" ? "LUNAS" : "BELUM LUNAS", // Standardisasi penulisan string status keuangan
          nominal: item.grand_total,
          metodeBayar: item.metode_bayar,
          ongkir: item.ongkir,
          alamat: item.alamat || "Melalui Loket Kasir POS Proyek", // Fallback string jika alamat pengiriman kosong
          items: item.items.map((it) => ({
            sku: it.sku,
            nama: it.nama_produk,
            qty: it.qty,
            harga: it.harga,
            total: it.total,
          })),
        }));
        setDataSales(dataDipetakan);
      }
    } catch (error) {
      console.error("Gagal menyinkronkan data laporan sales:", error);
      toast.error("Gagal memuat arsip transaksi dari server.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // [SESI 3: LOGIKA RUMUSAN FILTERING UTAMA (REAL-TIME FILTER)]
  // ==========================================================
  // useMemo bertugas mengunci performa rendering agar tabel tidak lambat saat admin mengetik huruf pencarian
  const dataLaporanDisaring = useMemo(() => {
    return dataSales.filter((row) => {
      // Parameter A: Rentang Tanggal (Harus berada di antara tanggal mulai dan tanggal selesai)
      const cocokTanggal =
        row.tanggal >= filterTglMulai && row.tanggal <= filterTglSelesai;

      // Parameter B: Input Kata Kunci (Mencocokkan string nomor invoice atau nama pembeli)
      const cocokSearch =
        row.nomorInvoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.pelanggan.toLowerCase().includes(searchTerm.toLowerCase());

      // Parameter C: Opsi Dropdown Status Keuangan ("LUNAS" / "BELUM LUNAS")
      const cocokStatus =
        filterStatus === "Semua Status" ||
        row.status.toUpperCase() === filterStatus.toUpperCase();

      // Transaksi lolos saringan jika memenuhi ketiga kriteria kecocokan di atas
      return cocokTanggal && cocokSearch && cocokStatus;
    });
  }, [dataSales, filterTglMulai, filterTglSelesai, searchTerm, filterStatus]);

  // ==========================================================
  // [SESI 4: METRIK KEUANGAN GLOBAL (SUMMARY METRICS ENGINE)]
  // ==========================================================
  // Otomatis menghitung ulang akumulasi omset dan piutang berjalan mengikuti hasil saringan filter di atas
  const ringkasanMetrik = useMemo(() => {
    let totalOmset = 0;
    let totalPiutangBelumLunas = 0;
    let totalNotaInvoice = dataLaporanDisaring.length;

    dataLaporanDisaring.forEach((row) => {
      totalOmset += row.nominal; // Akumulasi total nilai seluruh penjualan kotor
      if (row.status === "BELUM LUNAS") {
        totalPiutangBelumLunas += row.nominal; // Akumulasi sisa dana transaksi tempo yang belum tertagih
      }
    });

    return { totalOmset, totalPiutangBelumLunas, totalNotaInvoice };
  }, [dataLaporanDisaring]);

  // ==========================================================
  // [SESI 5: CORE ENGINE: REPRINT INVOICE OR SURAT JALAN PDF]
  // ==========================================================
  // Fungsi penembak API khusus untuk mengunduh ulang cetakan dokumen eksternal berwujud file PDF langsung dari server
  const handleCetakDokumen = async (e, tipe, nomorInv, namaCust, tglNota) => {
    e.stopPropagation(); // Menahan gelembung klik agar baris tabel di bawahnya tidak ikut memicu modal rincian terbuka

    // Sterilkan karakter string nama customer dari simbol ilegal yang dilarang oleh Windows/Mac
    const namaAman = namaCust.replace(/[/\\?%*:|"<>]/g, "-");

    // Tentukan rute endpoint dinamis berdasarkan tipe tombol dokumen yang ditekan admin
    const endpointPath =
      tipe === "INVOICE" ? "reprint-invoice" : "print-surat-jalan";

    const idToastReport = toast.loading(
      `Sedang menggambar berkas biner ${tipe} dari server...`,
    );

    try {
      // Jalankan encoding komponen URL agar string nomor invoice aman saat melewati jaringan internet
      const nomorInvoiceAman = encodeURIComponent(nomorInv);
      const response = await fetch(
        `http://127.0.0.1:8000/api/sales/pos-transactions/${endpointPath}/?invoice=${nomorInvoiceAman}`,
      );

      if (!response.ok)
        throw new Error(`Gagal meregenerasi PDF ${tipe} dari database.`);

      // JALUR MEMORI BINER (STREAM): Tangkap data stream arrayBuffer dari backend untuk dilarungkan menjadi Blob file PDF
      const buffer = await response.arrayBuffer();
      const pdfBlob = new Blob([buffer], { type: "application/pdf" });
      const fileUrl = window.URL.createObjectURL(pdfBlob);

      // Gunakan teknik virtual downloading link samaran untuk memicu download otomatis file di komputer admin
      const linkDownload = document.createElement("a");
      linkDownload.href = fileUrl;

      if (tipe === "INVOICE") {
        linkDownload.download = `Invoice ${namaAman} ${tglNota}.pdf`;
      } else {
        linkDownload.download = `Surat Jalan ${namaAman} ${tglNota}.pdf`;
      }

      linkDownload.style.display = "none";
      document.body.appendChild(linkDownload);
      linkDownload.click(); // Eksekusi download instan berkas cetak

      // Hancurkan link sampah virtual dari memori browser setelah download berhasil dipicu
      document.body.removeChild(linkDownload);
      window.URL.revokeObjectURL(fileUrl);

      // Perbarui notifikasi report loading menjadi sukses terunduh
      toast.update(idToastReport, {
        render: `Sukses! Dokumen ${tipe} berhasil diunduh otomatis.`,
        type: "success",
        isLoading: false,
        autoClose: 2500,
      });
    } catch (error) {
      toast.update(idToastReport, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  // ==========================================================
  // [SESI 6: DATABASE MUTATION (LOGIKAELEMINASI TRANSAKSI)]
  // ==========================================================
  // Fungsi eksekusi pembatalan/penghapusan nota invoice permanen dari cloud database (DELETE REQUEST)
  const handleEksekusiHapus = async () => {
    if (!dataAkanDihapus) return;

    const idToastDelete = toast.loading(
      `Sedang menghancurkan berkas faktur ${dataAkanDihapus.nomorInvoice}...`,
    );

    try {
      const nomorInvoiceAman = encodeURIComponent(dataAkanDihapus.nomorInvoice);
      const response = await fetch(
        `http://127.0.0.1:8000/api/sales/pos-transactions/delete-by-invoice/?invoice=${nomorInvoiceAman}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error("Gagal menghapus arsip transaksi dari server.");
      }

      toast.update(idToastDelete, {
        render: `Sukses! Arsip faktur ${dataAkanDihapus.nomorInvoice} berhasil dilenyapkan.`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      // Tutup semua tirai modal peninjau dan segarkan isi tabel laporan mengikuti isi database terbaru
      setDataAkanDihapus(null);
      setSalesTerpilih(null);
      fetchSeluruhArsipSales();
    } catch (error) {
      toast.update(idToastDelete, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      <ToastContainer theme="dark" />

      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Laporan Penjualan (Sales Report)
        </h2>
        <button
          onClick={fetchSeluruhArsipSales}
          className="bg-[#242731] hover:bg-gray-700 text-xs text-white px-3 py-1.5 rounded-lg border border-gray-800 transition-all font-semibold active:scale-95"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* METRIK SUMMARY CARDS (PAPAN RANGKUMAN INDIKATOR ATAS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-md">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Total Nilai Penjualan (Omset)
          </p>
          <h3 className="text-xl font-black text-white font-mono mt-1">
            Rp {ringkasanMetrik.totalOmset.toLocaleString("id-ID")}
          </h3>
          <p className="text-[9px] text-gray-600 mt-0.5">
            Akumulasi pendapatan kotor berjalan
          </p>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-md">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Total Piutang Berjalan (Belum Lunas)
          </p>
          <h3 className="text-xl font-black text-amber-500 font-mono mt-1">
            Rp {ringkasanMetrik.totalPiutangBelumLunas.toLocaleString("id-ID")}
          </h3>
          <p className="text-[9px] text-amber-500/40 mt-0.5">
            Sisa dana invoice tempo yang harus ditagih
          </p>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-md">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Jumlah Invoice Terbit
          </p>
          <h3 className="text-xl font-black text-sky-400 font-mono mt-1">
            {ringkasanMetrik.totalNotaInvoice} Dokumen
          </h3>
          <p className="text-[9px] text-gray-600 mt-0.5">
            Banyak arsip faktur transaksi yang lolos saringan
          </p>
        </div>
      </div>

      {/* BARIS FILTRASI PARAMETER */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-gray-500 mb-1">Mulai Tanggal</label>
          <input
            type="date"
            value={filterTglMulai}
            onChange={(e) => setFilterTglMulai(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:border-blue-500 focus:outline-none text-[11px] [color-scheme:dark] font-bold"
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={filterTglSelesai}
            onChange={(e) => setFilterTglSelesai(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:border-blue-500 focus:outline-none text-[11px] [color-scheme:dark] font-bold"
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">
            Cari Pelanggan / Nomor
          </label>
          <input
            type="text"
            placeholder="Ketik invoice atau nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#15171c] border border-emerald-500/30 rounded-lg p-2 text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none text-[11px] font-bold"
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">Status Keuangan</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold focus:border-blue-500 focus:outline-none text-[11px] cursor-pointer"
          >
            <option value="Semua Status">-- Semua Status --</option>
            <option value="Lunas">LUNAS</option>
            <option value="Belum Lunas">BELUM LUNAS</option>
          </select>
        </div>
      </div>

      {/* CORE TABEL AKTIVITAS LAPORAN */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl">
        <div className="overflow-x-auto rounded-lg border border-gray-800/60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#15171c] text-gray-400 border-b border-gray-800 font-semibold select-none text-[11px]">
                <th className="p-3.5 pl-5">Nomor Invoice</th>
                <th className="p-3.5">Tanggal Nota</th>
                <th className="p-3.5">Nama Pelanggan / Toko</th>
                <th className="p-3.5">Muatan Ringkas</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Nominal Omset</th>
                <th className="p-3.5 text-center pr-5">Cetak Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-medium text-xs">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-12 text-center text-gray-400 font-bold bg-[#1a1c23]"
                  >
                    ⏳ Sedang memuat seluruh riwayat database POS Solution
                    Indonesia...
                  </td>
                </tr>
              ) : dataLaporanDisaring.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-8 text-center text-gray-500 font-semibold bg-[#1a1c23]"
                  >
                    ❌ Tidak ada arsip invoice penjualan yang cocok dengan
                    parameter filter.
                  </td>
                </tr>
              ) : (
                dataLaporanDisaring.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSalesTerpilih(row)}
                    className="hover:bg-[#1d2029]/80 transition-colors cursor-pointer group"
                    title="Klik untuk meninjau rincian item & opsi hapus"
                  >
                    <td className="p-3.5 pl-5 font-mono text-blue-400 font-bold group-hover:underline">
                      {row.nomorInvoice}
                    </td>
                    <td className="p-3.5 text-gray-500 font-mono">
                      {row.tanggal}
                    </td>
                    <td className="p-3.5 text-white font-bold">
                      {row.pelanggan}
                    </td>
                    <td className="p-3.5 text-gray-400">
                      {row.items
                        .reduce((sum, item) => sum + item.qty, 0)
                        .toLocaleString("id-ID")}{" "}
                      Pcs
                    </td>
                    <td className="p-3.5 text-center select-none">
                      {/* BADGE LABELLING STATUS FINANSIAL NOTA */}
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black border tracking-wide ${
                          row.status === "LUNAS"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-900/60"
                            : "bg-amber-950 text-amber-400 border-amber-900/60"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-sky-400 font-mono text-[13px]">
                      Rp {row.nominal.toLocaleString("id-ID")}
                    </td>
                    <td className="p-3.5 text-center pr-5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) =>
                            handleCetakDokumen(
                              e,
                              "INVOICE",
                              row.nomorInvoice,
                              row.pelanggan,
                              row.tanggal,
                            )
                          }
                          className="bg-sky-950/40 border border-sky-800/60 hover:bg-sky-900/60 text-sky-400 font-bold px-2.5 py-1 rounded text-[10px] uppercase transition-all active:scale-95 shadow-sm"
                          title="Cetak Ulang Invoice Komersial"
                        >
                          INV
                        </button>
                        <button
                          type="button"
                          onClick={(e) =>
                            handleCetakDokumen(
                              e,
                              "SURAT JALAN",
                              row.nomorInvoice,
                              row.pelanggan,
                              row.tanggal,
                            )
                          }
                          className="bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/60 text-emerald-400 font-bold px-2.5 py-1 rounded text-[10px] uppercase transition-all active:scale-95 shadow-sm"
                          title="Cetak Surat Jalan Gudang / DO"
                        >
                          SJ
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

      {/* POP-UP MODAL PENINJAU RINCIAN BARANG SALES (DIALIRKAN SAAT ROW TABEL DIKLIK) */}
      {salesTerpilih && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl w-full max-w-xl p-5 space-y-4 shadow-2xl animate-fadeIn">
            {/* Header Modal */}
            <div className="flex justify-between items-start border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Rincian Dokumen Item Invoice Jual
                </h3>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                  No Ref: {salesTerpilih.nomorInvoice} | Tanggal:{" "}
                  {salesTerpilih.tanggal}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSalesTerpilih(null)}
                className="text-gray-500 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Sub-Header Pelanggan & Alamat */}
            <div className="bg-[#15171c] p-3 rounded-lg border border-gray-800 text-xs space-y-1">
              <div>
                <span className="text-gray-500 text-[10px] block">
                  Customer / Toko Pembeli:
                </span>
                <span className="text-white font-bold text-sm">
                  {salesTerpilih.pelanggan}
                </span>
              </div>
              <div className="pt-1 border-t border-gray-800/60">
                <span className="text-gray-500 text-[10px] block">
                  Alamat Tujuan Pengiriman:
                </span>
                <span className="text-gray-400 font-medium">
                  {salesTerpilih.alamat}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-gray-800/60 text-[11px]">
                <p>
                  <span className="text-gray-500">Metode Jual:</span>{" "}
                  <span className="text-white font-bold">
                    {salesTerpilih.metodeBayar}
                  </span>
                </p>
                <p className="text-right">
                  <span className="text-gray-500">Biaya Kirim:</span>{" "}
                  <span className="text-emerald-400 font-bold font-mono">
                    Rp {salesTerpilih.ongkir.toLocaleString("id-ID")}
                  </span>
                </p>
              </div>
            </div>

            {/* Tabel Detail Multi-Item Komoditas Terjual */}
            <div className="overflow-hidden border border-gray-800/80 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#15171c] text-gray-400 text-[10px] border-b border-gray-800 font-bold select-none">
                    <th className="p-2 pl-4">SKU</th>
                    <th className="p-2">Deskripsi Varian Produk Terjual</th>
                    <th className="p-2 text-right">Harga Jual</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right pr-4">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-[11px] font-medium">
                  {salesTerpilih.items.map((it, idx) => (
                    <tr key={idx} className="text-gray-300">
                      <td className="p-2 pl-4 font-mono text-blue-400">
                        {it.sku}
                      </td>
                      <td className="p-2 text-white font-bold">{it.nama}</td>
                      <td className="p-2 text-right text-gray-400">
                        Rp {it.harga.toLocaleString("id-ID")}
                      </td>
                      <td className="p-2 text-center text-white font-mono font-bold">
                        {it.qty.toLocaleString("id-ID")}
                      </td>
                      <td className="p-2 text-right pr-4 font-bold text-sky-400 font-mono">
                        Rp {it.total.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#15171c]/80 text-xs font-black text-white">
                    <td colSpan="4" className="p-2.5 text-right text-gray-400">
                      GRAND TOTAL NOTA MASUK:
                    </td>
                    <td className="p-2.5 text-right pr-4 font-mono text-sm text-sky-400">
                      Rp {salesTerpilih.nominal.toLocaleString("id-ID")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tombol Closing & Aksi Hapus yang memicu Modal Merah Sekunder */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDataAkanDihapus(salesTerpilih)}
                className="w-1/3 bg-red-950/30 hover:bg-red-900/60 border border-red-800/50 text-red-400 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all shadow-sm"
              >
                🗑️ Hapus
              </button>
              <button
                type="button"
                onClick={() => setSalesTerpilih(null)}
                className="w-2/3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all shadow-sm"
              >
                Tutup Peninjauan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL KONFIRMASI HAPUS PERMANEN (SI MERAH SEKUNDER) */}
      {dataAkanDihapus && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-red-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🚨</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Hapus Faktur Penjualan?
              </h3>
            </div>

            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Apakah Anda benar-benar yakin ingin menghapus permanen faktur
              <span className="text-red-400 font-bold">
                {" "}
                {dataAkanDihapus.nomorInvoice}{" "}
              </span>
              beserta seluruh rincian barangnya? Tindakan ini tidak dapat
              dibatalkan.
            </div>

            <div className="flex gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDataAkanDihapus(null)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-bold transition-all"
              >
                Batal / Kembali
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
