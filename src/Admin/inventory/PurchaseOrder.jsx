import React, { useState, useEffect, useMemo } from "react";
// IMPOR NOTIFIKASI TOAST MODERN
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PurchaseOrder() {
  // ==========================================================
  // [SESI 1: STATE MANAGEMENT & INITIALIZATION (LACI MEMORI)]
  // ==========================================================
  // Wadah penyimpanan data sementara selama admin beraktivitas di halaman PO.

  // Katalog master produk gudang yang siap dipilih untuk dimasukkan ke dalam keranjang
  const [produkGudang, setProdukGudang] = useState([]);

  // Daftar master supplier/vendor resmi yang aktif melayani suplai barang
  const [daftarSupplier, setDaftarSupplier] = useState([]);

  // Penampung riwayat aktivitas cetakan purchase order yang diterbitkan khusus hari ini
  const [arsipPO, setArsipPO] = useState([]);

  // Saklar loading utama untuk melacak status sinkronisasi data dari database Django
  const [loading, setLoading] = useState(true);

  // LACI MULTI-ITEM: Menampung daftar belanja barang sementara sebelum dikunci menjadi nota PO resmi
  const [keranjangDraft, setKeranjangDraft] = useState([]);

  // FORM DATA HEADER: Menyimpan informasi surat berupa Nomor PO, Supplier terpilih, dan Tanggal Transaksi
  const [metaPO, setMetaPO] = useState({
    noPO: "",
    supplier: "",
    tgl: new Date().toISOString().split("T")[0], // Default otomatis mengisi tanggal hari ini (YYYY-MM-DD)
  });

  // FORM DATA ITEM: Menampung baris isian barang (Produk, jumlah qty, dan harga beli vendor) yang sedang diketik
  const [itemInput, setItemInput] = useState({
    selectedIndexProduk: "",
    qty: "",
    hargaBeli: "",
  });

  // Teks keyword untuk menyaring daftar pencarian nota PO di tabel arsip bawah
  const [searchTerm, setSearchTerm] = useState("");

  // Slot pengunci data PO utuh (Header + Banyak Item) yang siap dikirim via jaringan internet
  const [dataAkanDisimpan, setDataAkanDisimpan] = useState(null);

  // Slot memori penyimpan objek PO yang dipilih admin untuk ditinjau sub-item barangnya di pop-up modal
  const [poTerpilih, setPoTerpilih] = useState(null);

  // Slot pengunci berkas PO yang ditargetkan untuk dihapus permanen lewat modal konfirmasi merah
  const [dataAkanDihapus, setDataAkanDihapus] = useState(null);

  // ==========================================================
  // [SESI 2: SINKRONISASI DATABASE & INTEGRASI DJANGO API]
  // ==========================================================

  // Trigger Otomatis: Ambil data master supplier, katalog barang, dan urutan PO saat halaman dibuka
  useEffect(() => {
    fetchSupplierMaster();
    fetchKatalogProdukGudang();
    fetchHistoriSertaUrutanPO();
  }, []);

  // FUNGSI A: Mengambil daftar nama vendor pemasok dari server
  const fetchSupplierMaster = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/inventory/suppliers/",
      );
      if (!response.ok)
        throw new Error("Gagal memuat master data vendor supplier.");
      const data = await response.json();
      setDaftarSupplier(data);
    } catch (error) {
      console.error("Error Fetching Master Suppliers:", error);
    }
  };

  // FUNGSI B: Mengambil katalog komoditas barang untuk referensi auto-harga beli (HPP)
  const fetchKatalogProdukGudang = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/inventory/products/",
      );
      if (!response.ok)
        throw new Error("Gagal memuat katalog komoditas gudang.");
      const data = await response.json();

      // Mapping data untuk memastikan variabel finansial dan SKU terekam dengan aman
      const dataDipetakan = data.map((item) => ({
        id: item.id,
        sku: item.sku,
        nama: item.nama,
        hpp: item.hpp || 0,
      }));
      setProdukGudang(dataDipetakan);
    } catch (error) {
      console.error("Gagal sinkronisasi katalog produk PO:", error);
    }
  };

  // FUNGSI C: Mengambil riwayat PO berjalan yang terbit pada hari ini
  const fetchHistoriSertaUrutanPO = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/inventory/purchase-orders/",
      );
      if (response.ok) {
        const data = await response.json();

        // Standardisasi Bahasa: Konversi snake_case Django menjadi camelCase React
        const dataDipetakan = data.map((item) => ({
          id: item.id,
          noPO: item.nomor_po,
          tgl: item.tanggal,
          supplier: item.supplier,
          grandTotal: item.grand_total,
          items: item.items.map((it) => ({
            sku: it.sku,
            nama_produk: it.nama_produk,
            qty: it.qty,
            harga_beli: it.harga_beli,
            total: it.total,
          })),
        }));

        setArsipPO(dataDipetakan);
        // Setelah data arsip termuat, hitung nomor PO otomatis untuk transaksi berikutnya
        generateNomorPOOtomatis();
      }
    } catch (error) {
      console.error("Gagal memuat histori transaksi PO:", error);
      toast.error("Gagal memuat arsip purchase order dari server.");
    } finally {
      setLoading(false);
    }
  };

  // FUNGSI D: Menghitung counter urutan nota untuk menyusun format string Nomor PO otomatis
  const generateNomorPOOtomatis = async () => {
    const tglSekarang = new Date();
    const tahun = tglSekarang.getFullYear();
    const bulan = String(tglSekarang.getMonth() + 1).padStart(2, "0");

    let jumlahPOBulanIni = 0;

    try {
      // Minta data counter urutan transaksi yang sudah terbit di bulan ini dari database Django
      const response = await fetch(
        "http://127.0.0.1:8000/api/inventory/purchase-orders/last-counter/",
      );
      if (response.ok) {
        const resData = await response.json();
        jumlahPOBulanIni = resData.counter;
      }
    } catch (error) {
      console.error("Gagal mengambil counter urutan PO terakhir:", error);
    }

    const nomorMulai = 1;
    const nomorUrutFinal = nomorMulai + jumlahPOBulanIni;
    // Format nomor urut menjadi 4 digit konstan berawalan nol (contoh: urutan 3 -> "0003")
    const stringUrutan = String(nomorUrutFinal).padStart(4, "0");

    // Suntik string penomoran otomatis ke form header dokumen
    setMetaPO((prev) => ({
      ...prev,
      noPO: `PO/${tahun}/${bulan}/${stringUrutan}`,
    }));
  };

  // ==========================================================
  // [SESI 3: LOGIKA KONTROL FORM INPUT & DROPDOWN]
  // ==========================================================

  // FUNGSI A: Mengatur aksi saat dropdown pilihan produk berubah (Auto-Fill Harga HPP Satuan)
  const handleProdukSelectChange = (indexStr) => {
    if (indexStr === "") {
      setItemInput({ selectedIndexProduk: "", qty: "", hargaBeli: "" });
      return;
    }

    // Ambil data produk terpilih berdasarkan index array katalog gudang
    const prod = produkGudang[indexStr];
    setItemInput({
      selectedIndexProduk: indexStr,
      qty: itemInput.qty || "",
      // AUTO HARGA: Mengisi inputan harga beli secara otomatis menggunakan nilai HPP dasar barang
      hargaBeli: prod.hpp ? prod.hpp.toString() : "0",
    });
  };

  // FUNGSI B: Memasukkan barang dari form input ke dalam list draf keranjang sementara
  const handleTambahKeKeranjang = (e) => {
    e.preventDefault();
    if (
      itemInput.selectedIndexProduk === "" ||
      !itemInput.qty ||
      !itemInput.hargaBeli
    ) {
      return toast.warning("Silakan lengkapi pilihan produk dan harga beli!");
    }

    const prod = produkGudang[itemInput.selectedIndexProduk];
    const kuantitas = parseInt(itemInput.qty) || 0;
    const harga = parseInt(itemInput.hargaBeli) || 0;

    if (kuantitas <= 0 || harga <= 0) return;

    // REKONSILIASI ITEM KEMBAR: Cek apakah produk dengan SKU tersebut sudah ada di keranjang?
    const itemEksisIdx = keranjangDraft.findIndex(
      (item) => item.sku === prod.sku,
    );

    if (itemEksisIdx !== -1) {
      // Jika SKU sudah ada, cukup tambahkan jumlah kuantitas lamanya dengan kuantitas inputan baru
      setKeranjangDraft((prev) =>
        prev.map((item, idx) =>
          idx === itemEksisIdx
            ? {
                ...item,
                qty: item.qty + kuantitas,
                total: (item.qty + kuantitas) * harga,
              }
            : item,
        ),
      );
    } else {
      // Jika SKU benar-benar baru, daftarkan baris objek baru ke dalam list array keranjang
      setKeranjangDraft((prev) => [
        ...prev,
        {
          sku: prod.sku,
          nama: prod.nama,
          qty: kuantitas,
          hargaBeli: harga,
          total: kuantitas * harga,
        },
      ]);
    }

    // Kosongkan kembali form input barang agar siap mengetik item selanjutnya
    setItemInput({ selectedIndexProduk: "", qty: "", hargaBeli: "" });
    toast.success("Barang dimuat ke draf purchase order.", { autoClose: 1500 });
  };

  // FUNGSI C: Membuang satu baris barang dari daftar draf keranjang belanja
  const handleHapusItemDraft = (sku) => {
    setKeranjangDraft((prev) => prev.filter((item) => item.sku !== sku));
    toast.info("Item dikeluarkan dari draf PO.", { autoClose: 1500 });
  };

  // KALKULATOR TOTAL SEMENTARA: Menghitung akumulasi nilai belanja draf keranjang secara real-time
  const grandTotalDraft = useMemo(() => {
    return keranjangDraft.reduce((sum, item) => sum + item.total, 0);
  }, [keranjangDraft]);

  // FUNGSI D: Menghapus berkas transaksi purchase order dari cloud database (DELETE REQUEST)
  const handleEksekusiHapus = async () => {
    if (!dataAkanDihapus) return;

    // Nyalakan teks animasi loading di toast notifikasi
    const idToastDelete = toast.loading(
      `Sedang menghancurkan berkas faktur PO ${dataAkanDihapus.noPO}...`,
    );

    try {
      // Encode URL agar karakter string khusus seperti garis miring (/) pada nomor PO tidak merusak rute API
      const nomorPOAman = encodeURIComponent(dataAkanDihapus.noPO);
      const response = await fetch(
        `http://127.0.0.1:8000/api/inventory/purchase-orders/delete-by-po/?po=${nomorPOAman}`,
        { method: "DELETE" },
      );

      if (!response.ok)
        throw new Error("Gagal mematikan transaksi PO di server.");

      // Ubah status loading toast menjadi status sukses terhapus
      toast.update(idToastDelete, {
        render: `Sukses! Arsip faktur PO ${dataAkanDihapus.noPO} berhasil dilenyapkan.`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      // Tutup modal pop-up dan segarkan data tabel arsip
      setDataAkanDihapus(null);
      setPoTerpilih(null);
      fetchHistoriSertaUrutanPO();
    } catch (error) {
      toast.update(idToastDelete, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  // FUNGSI E: Melakukan validasi kelengkapan form sebelum memicu pop-up konfirmasi simpan
  const handlePicuKonfirmasi = () => {
    if (
      metaPO.noPO.trim() === "" ||
      metaPO.supplier === "" ||
      keranjangDraft.length === 0
    ) {
      return toast.error(
        "Gagal! Mohon lengkapi No. PO, Supplier, dan isi item keranjang.",
      );
    }

    // Bungkus data header dan multi-item ke format standardisasi payload Django
    setDataAkanDisimpan({
      nomor_po: metaPO.noPO.trim().toUpperCase(),
      supplier: metaPO.supplier,
      tanggal: metaPO.tgl,
      grand_total: grandTotalDraft,
      items: keranjangDraft.map((item) => ({
        sku: item.sku,
        nama_produk: item.nama,
        qty: item.qty,
        harga_beli: item.hargaBeli,
        total: item.total,
      })),
    });
  };

  // ==========================================================
  // [SESI 4: EKSEKUSI MUTASI & LOGIKA ARRAYBUFFER PDF]
  // ==========================================================

  // FUNGSI UTAMA: Menyimpan data PO baru ke server sekaligus mengonversi data biner menjadi file PDF
  const handleEksekusiSimpan = async () => {
    if (!dataAkanDisimpan) return;

    const idToastPO = toast.loading(
      "Sedang merekam dokumen PO dan memproses cetakan PDF...",
    );

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/inventory/purchase-orders/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataAkanDisimpan),
        },
      );

      // Tangani validasi error khusus dari backend jika nomor PO kedapatan duplikat/sudah terkunci
      if (!response.ok) {
        const errRes = await response.json().catch(() => ({}));
        if (errRes.nomor_po) {
          throw new Error("Nomor PO ini sudah terbit atau terkunci di sistem!");
        }
        throw new Error("Gagal mengamankan nota Purchase Order ke server.");
      }

      // LOGIKA BINER (STREAM DOWNLOAD): Menerima kiriman output data mentah PDF dari Django REST
      const buffer = await response.arrayBuffer();
      // Konversi data buffer biner menjadi Blob bertipe aplikasi PDF resmi
      const pdfBlob = new Blob([buffer], { type: "application/pdf" });

      if (pdfBlob.size === 0) {
        throw new Error(
          "Gagal mengunduh berkas. Ukuran data biner PDF bernilai 0 byte.",
        );
      }

      // Prosedur Virtual Download: Membuat link download samaran di memori browser lalu mengkliknya otomatis
      const fileUrl = window.URL.createObjectURL(pdfBlob);
      const linkDownload = document.createElement("a");
      linkDownload.href = fileUrl;

      // Bersihkan string nama supplier dari simbol-simbol ilegal yang dilarang oleh sistem operasi file Windows/Mac
      const namaVendor = dataAkanDisimpan.supplier.replace(
        /[/\\?%*:|"<>]/g,
        "-",
      );
      linkDownload.download = `PO ${dataAkanDisimpan.nomor_po} ${namaVendor}.pdf`;
      linkDownload.style.display = "none";
      document.body.appendChild(linkDownload);
      linkDownload.click(); // Trigger klik download file otomatis

      // Bersihkan kembali sisa sampah link tautan memori setelah file sukses terunduh
      document.body.removeChild(linkDownload);
      window.URL.revokeObjectURL(fileUrl);

      // Perbarui notifikasi status menjadi sukses terbit
      toast.update(idToastPO, {
        render:
          "Sukses! Purchase Order berhasil diterbitkan and file PDF terunduh.",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      // Bersihkan seluruh meja draf keranjang kerja karena transaksi telah resmi dituntaskan
      setKeranjangDraft([]);
      setMetaPO({
        noPO: "",
        supplier: "",
        tgl: new Date().toISOString().split("T")[0],
      });
      setDataAkanDisimpan(null);

      // Segarkan isi tabel arsip berjalan
      fetchHistoriSertaUrutanPO();
    } catch (error) {
      toast.update(idToastPO, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  // ENGINE PENYARINGAN TEKS: Menyaring isi tabel arsip PO harian berdasarkan nomor PO atau nama supplier
  const filteredArsip = arsipPO.filter(
    (item) =>
      item.noPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      <ToastContainer theme="dark" />

      {/* HEADER MODUL */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Purchase Order
        </h2>
      </div>

      {/* GRID RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* PANEL KIRI: LOGISTIK INPUT */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
              📋 1. Dokumen Header
            </h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">
                  No. PO Transaksi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PO-2026-003"
                  value={metaPO.noPO}
                  onChange={(e) =>
                    setMetaPO({ ...metaPO, noPO: e.target.value })
                  }
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:border-blue-500 focus:outline-none text-[11px] font-bold"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Supplier</label>
                <select
                  value={metaPO.supplier}
                  onChange={(e) =>
                    setMetaPO({ ...metaPO, supplier: e.target.value })
                  }
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none cursor-pointer text-[11px] font-bold"
                >
                  <option value="">-- Pilih Supplier --</option>
                  {daftarSupplier.map((sup) => (
                    <option key={sup.id} value={sup.nama}>
                      {sup.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">
                  Tanggal Dokumen
                </label>
                <input
                  type="date"
                  value={metaPO.tgl}
                  onChange={(e) =>
                    setMetaPO({ ...metaPO, tgl: e.target.value })
                  }
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold focus:border-blue-500 focus:outline-none text-[11px] [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <form
            onSubmit={handleTambahKeKeranjang}
            className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3"
          >
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
              📦 2. Produk
            </h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Pilih Produk</label>
                <select
                  value={itemInput.selectedIndexProduk}
                  onChange={(e) => handleProdukSelectChange(e.target.value)}
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold focus:border-blue-500 focus:outline-none cursor-pointer text-[11px]"
                  required
                >
                  <option value="">-- Pilih SKU Gudang --</option>
                  {produkGudang.map((prod, index) => (
                    <option key={index} value={index}>
                      [{prod.sku}] - {prod.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-400 mb-1">Qty</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={itemInput.qty}
                    onChange={(e) =>
                      setItemInput({ ...itemInput, qty: e.target.value })
                    }
                    className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-[11px] font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">
                    Harga Satuan
                  </label>
                  <input
                    type="number"
                    placeholder="Rp"
                    value={itemInput.hargaBeli}
                    onChange={(e) =>
                      setItemInput({ ...itemInput, hargaBeli: e.target.value })
                    }
                    className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-[11px] font-bold"
                    required
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-[11px] transition-all uppercase tracking-wider shadow-lg shadow-emerald-950/20 active:scale-95"
            >
              ➕ Masukkan Keranjang
            </button>
          </form>
        </div>

        {/* KERANJANG */}
        <div className="xl:col-span-9 space-y-5">
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                🛒 Keranjang
              </h3>
              <span className="text-xs font-mono font-black text-white">
                Total Sementara:{" "}
                <span className="text-sky-400">
                  Rp {grandTotalDraft.toLocaleString("id-ID")}
                </span>
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-800/60 max-h-40 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#15171c] text-gray-400 text-[10px] font-bold select-none border-b border-gray-800">
                    <th className="p-2 pl-4">SKU</th>
                    <th className="p-2">Nama Barang</th>
                    <th className="p-2 text-right">Harga Satuan</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Subtotal</th>
                    <th className="p-2 text-center pr-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-xs font-medium">
                  {keranjangDraft.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-6 text-center text-gray-500 bg-[#1a1c23]"
                      >
                        Keranjang kosong. Isi data di panel kiri.
                      </td>
                    </tr>
                  ) : (
                    keranjangDraft.map((item) => (
                      <tr key={item.sku} className="hover:bg-[#1d2029]/40">
                        <td className="p-2 font-mono text-blue-400 pl-4">
                          {item.sku}
                        </td>
                        <td className="p-2 text-white font-bold">
                          {item.nama}
                        </td>
                        <td className="p-2 text-right text-gray-400">
                          Rp {item.hargaBeli.toLocaleString("id-ID")}
                        </td>
                        <td className="p-2 text-right text-white font-bold">
                          {item.qty}
                        </td>
                        <td className="p-2 text-right text-sky-400 font-bold">
                          Rp {item.total.toLocaleString("id-ID")}
                        </td>
                        <td className="p-2 text-center pr-4">
                          <button
                            type="button"
                            onClick={() => handleHapusItemDraft(item.sku)}
                            className="text-red-400 font-black text-xs px-1"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {keranjangDraft.length > 0 && (
              <button
                type="button"
                onClick={handlePicuKonfirmasi}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-lg text-xs uppercase tracking-widest shadow-xl transition-all"
              >
                💾 Simpan & Cetak Purchase Order
              </button>
            )}
          </div>

          {/* ARSIP HISTORI BERJALAN (FILTER HARIAN BY BACKEND) */}
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                📋 Aktivitas PO Hari Ini
              </h3>
              <input
                type="text"
                placeholder="Cari..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#15171c] border border-gray-800 rounded-lg px-3 py-1 text-xs text-gray-300 focus:outline-none w-40"
              />
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-800/60 max-h-40 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#15171c] text-gray-400 text-[10px] border-b border-gray-800">
                    <th className="p-2.5 pl-4">No. PO</th>
                    <th className="p-2.5">Tanggal</th>
                    <th className="p-2.5">Supplier</th>
                    <th className="p-2.5 text-center">Jumlah Item</th>
                    <th className="p-2.5 text-right">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-xs font-medium">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-4 text-center text-emerald-400 bg-[#1a1c23]"
                      >
                        ⏳ Sedang memuat seluruh riwayat database Purchase
                        Order...
                      </td>
                    </tr>
                  ) : filteredArsip.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-4 text-center text-gray-500 bg-[#1a1c23]"
                      >
                        ❌ Tidak ada arsip purchase order yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredArsip.map((po) => (
                      <tr
                        key={po.id}
                        onClick={() => setPoTerpilih(po)}
                        className="hover:bg-[#1d2029]/80 transition-colors cursor-pointer group"
                        title="Klik untuk meninjau rincian item & opsi hapus"
                      >
                        <td className="p-3.5 pl-4 font-mono text-amber-500 font-bold group-hover:underline">
                          {po.noPO}
                        </td>
                        <td className="p-3.5 text-gray-500 font-mono">
                          {po.tgl}
                        </td>
                        <td className="p-3.5 text-white font-bold">
                          {po.supplier}
                        </td>
                        <td className="p-3.5 text-center text-gray-400">
                          {po.items
                            ? po.items
                                .reduce((sum, item) => sum + item.qty, 0)
                                .toLocaleString("id-ID")
                            : 0}{" "}
                          Pcs
                        </td>
                        <td className="p-3.5 text-right font-black text-sky-400 font-mono text-[13px]">
                          Rp {po.grandTotal.toLocaleString("id-ID")}
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

      {/* MODAL POP-UP CONFIRM: SIMPAN DATA BARU (SI BLUE) */}
      {dataAkanDisimpan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-blue-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center space-x-2">
              <span className="text-xl">Doc</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Konfirmasi Transaksi PO
              </h3>
            </div>
            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Apakah Anda ingin memvalidasi dokumen{" "}
              <span className="font-mono font-bold text-blue-400">
                "{dataAkanDisimpan.nomor_po}"
              </span>
              ? Data akan dikunci permanen di cloud database Django dan
              mengonversi riwayat pembelian ke berkas cetakan eksternal.
            </div>
            <div className="bg-[#15171c] p-3 rounded-lg text-xs space-y-1.5 border border-gray-800 font-medium">
              <div className="flex justify-between">
                <span className="text-gray-500">Tujuan Pemasok:</span>
                <span className="text-white font-bold">
                  {dataAkanDisimpan.supplier}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Belanja Vendor:</span>
                <span className="text-sky-400 font-black font-mono">
                  Rp {dataAkanDisimpan.grand_total.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <div className="flex gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDataAkanDisimpan(null)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleEksekusiSimpan}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-bold shadow-lg transition-all"
              >
                Ya, Terbitkan PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL PENINJAU RINCIAN BARANG PURCHASE ORDER */}
      {poTerpilih && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl w-full max-w-xl p-5 space-y-4 shadow-2xl animate-fadeIn">
            {/* Header Modal */}
            <div className="flex justify-between items-start border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Rincian Dokumen Item Invoice Masuk (PO)
                </h3>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                  No Ref: {poTerpilih.noPO} | Tanggal: {poTerpilih.tgl}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPoTerpilih(null)}
                className="text-gray-500 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Sub-Header Vendor & Supplier Info */}
            <div className="bg-[#15171c] p-3 rounded-lg border border-gray-800 text-xs space-y-1">
              <div>
                <span className="text-gray-500 text-[10px] block">
                  Supplier / Vendor Pemasok:
                </span>
                <span className="text-white font-bold text-sm">
                  {poTerpilih.supplier}
                </span>
              </div>
              <div className="pt-1 border-t border-gray-800/60">
                <span className="text-gray-500 text-[10px] block">
                  Status Logistik Internal:
                </span>
                <span className="text-emerald-400 font-bold font-mono">
                  DITERBITKAN (STOK REKONSILIASI MASUK)
                </span>
              </div>
            </div>

            {/* Tabel Detail Multi-Item */}
            <div className="overflow-hidden border border-gray-800/80 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#15171c] text-gray-400 text-[10px] border-b border-gray-800 font-bold select-none">
                    <th className="p-2 pl-4">SKU</th>
                    <th className="p-2">Deskripsi Varian Produk</th>
                    <th className="p-2 text-right">Harga Beli</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right pr-4">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-[11px] font-medium">
                  {poTerpilih.items &&
                    poTerpilih.items.map((it, idx) => (
                      <tr key={idx} className="text-gray-300">
                        <td className="p-2 pl-4 font-mono text-blue-400">
                          {it.sku}
                        </td>
                        <td className="p-2 text-white font-bold">
                          {it.nama_produk}
                        </td>
                        <td className="p-2 text-right text-gray-400 font-mono">
                          Rp {(it.harga_beli ?? 0).toLocaleString("id-ID")}
                        </td>
                        <td className="p-2 text-center text-white font-mono font-bold">
                          {(it.qty ?? 0).toLocaleString("id-ID")}
                        </td>
                        <td className="p-2 text-right pr-4 font-bold text-sky-400 font-mono">
                          Rp {(it.total ?? 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  <tr className="bg-[#15171c]/80 text-xs font-black text-white">
                    <td colSpan="4" className="p-2.5 text-right text-gray-400">
                      GRAND TOTAL NOTA MASUK:
                    </td>
                    <td className="p-2.5 text-right pr-4 font-mono text-sm text-sky-400">
                      Rp {poTerpilih.grandTotal.toLocaleString("id-ID")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tombol Closing & Aksi Hapus yang memicu Modal Merah */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDataAkanDihapus(poTerpilih)}
                className="w-1/3 bg-red-950/30 hover:bg-red-900/60 border border-red-800/50 text-red-400 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all shadow-sm"
              >
                🗑️ Hapus
              </button>
              <button
                type="button"
                onClick={() => setPoTerpilih(null)}
                className="w-2/3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all shadow-sm"
              >
                Tutup Peninjauan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL KONFIRMASI HAPUS PERMANEN (SI MERAH) */}
      {dataAkanDihapus && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-red-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🚨</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Hapus Faktur Pembelian (PO)?
              </h3>
            </div>

            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Apakah Anda benar-benar yakin ingin menghapus permanen faktur PO
              <span className="text-red-400 font-bold">
                {" "}
                {dataAkanDihapus.noPO}{" "}
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
