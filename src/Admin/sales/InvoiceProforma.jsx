import React, { useState, useEffect, useMemo } from "react";
// IMPOR NOTIFIKASI TOAST MODERN
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Pos() {
  // ==========================================================
  // [SESI 1: STATE MANAGEMENT & INITIALIZATION (LACI MEMORI)]
  // ==========================================================
  // Papan kendali penyimpanan data transaksi POS selama admin beraktivitas di halaman proforma.

  // Katalog produk siap jual hasil sinkronisasi dari database aplikasi Inventory
  const [produkGudang, setProdukGudang] = useState([]);

  // Saklar loading utama untuk melacak status penarikan data awal dari server Django
  const [loading, setLoading] = useState(true);

  // Master data pelanggan terdaftar untuk opsi dropdown penjualan
  const [daftarCustomer, setDaftarCustomer] = useState([]);

  // Saklar form customer baru: true jika membuat nama pembeli sementara, false jika pakai list database
  const [isTambahCustomerBaru, setIsTambahCustomerBaru] = useState(false);

  // Penampung teks nama customer sementara yang belum terdaftar di database utama
  const [namaCustomerBaru, setNamaCustomerBaru] = useState("");

  // Menyimpan string alamat pengiriman barang yang tampil di preview nota cetak
  const [alamat, setAlamat] = useState("");

  // LACI MULTI-ITEM: Menampung daftar belanja barang sementara sebelum dikunci menjadi nota proforma resmi
  const [itemsKeranjang, setItemsKeranjang] = useState([]);

  // FORM DATA HEADER: Menyimpan informasi surat berupa Nomor Proforma, Nama Pelanggan, Tanggal, dan Ongkir
  const [formData, setFormData] = useState({
    nomorInvoice: "",
    pelanggan: "",
    tanggal: new Date().toISOString().split("T")[0], // Otomatis mengisi tanggal hari ini (YYYY-MM-DD)
    ongkir: 0,
  });

  // FORM DATA ITEM: Menampung baris isian barang (Produk, qty, and harga jual custom) yang sedang diketik
  const [itemInput, setItemInput] = useState({
    selectedIndexProduk: "",
    qty: "",
    hargaCustom: "",
  });

  // ==========================================================
  // [SESI 2: SINKRONISASI DATABASE & INTEGRASI DJANGO API]
  // ==========================================================

  // Trigger Otomatis: Sinkronisasikan data customer, counter nomor urut, dan katalog produk saat halaman dibuka
  useEffect(() => {
    fetchCustomerMaster();
    generateNomorProformaOtomatis();
    fetchKatalogProdukGudang();
  }, []);

  // FUNGSI A: Mengambil daftar nama customer resmi dari server Sales
  const fetchCustomerMaster = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/sales/customers/",
      );
      if (!response.ok) throw new Error("Gagal sinkronisasi data pelanggan.");
      const data = await response.json();
      setDaftarCustomer(data);
    } catch (error) {
      console.error("Error Fetching Master Customers:", error);
    }
  };

  // FUNGSI B: Mengatur aksi saat dropdown pilihan customer berubah (Auto-Fill Alamat Tujuan Kirim)
  const handleCustomerSelectChange = (namaSelected) => {
    setFormData({ ...formData, pelanggan: namaSelected });

    // Cari objek data customer terpilih di dalam laci daftarCustomer
    const dataCust = daftarCustomer.find((c) => c.nama === namaSelected);
    if (dataCust && dataCust.alamat) {
      // AUTO ALAMAT: Isikan alamat tujuan kirim secara otomatis jika data alamat terekam di database
      setAlamat(dataCust.alamat);
    } else {
      setAlamat("");
    }
  };

  // FUNGSI C: Menghitung counter transaksi bulanan untuk menyusun format string Nomor Proforma otomatis
  const generateNomorProformaOtomatis = async () => {
    const tglSekarang = new Date();
    const tahun = tglSekarang.getFullYear();
    const bulan = String(tglSekarang.getMonth() + 1).padStart(2, "0");

    let jumlahTransaksiBulanIni = 0;

    try {
      // Minta data counter urutan transaksi proforma yang sudah terbit di bulan berjalan dari backend Django
      const response = await fetch(
        "http://127.0.0.1:8000/api/sales/proforma-invoices/last-counter/",
      );
      if (response.ok) {
        const resData = await response.json();
        jumlahTransaksiBulanIni = resData.counter;
      }
    } catch (error) {
      console.error("Gagal mengambil counter proforma terakhir:", error);
    }

    const nomorMulai = 10; // Standar awal penomoran proforma kantor
    const nomorUrutFinal = nomorMulai + jumlahTransaksiBulanIni;
    const stringUrutan = String(nomorUrutFinal).padStart(4, "0"); // Hasil urutan konstan 4 digit (misal: "0010")

    // Suntik string penomoran otomatis ke form header dokumen proforma
    setFormData((prev) => ({
      ...prev,
      nomorInvoice: `PRO/${tahun}/${bulan}/${stringUrutan}`,
    }));
  };

  // FUNGSI D: Mengambil katalog komoditas barang dari aplikasi Inventory untuk referensi harga jual real-time
  const fetchKatalogProdukGudang = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/inventory/products/",
      );
      if (!response.ok)
        throw new Error("Gagal memuat katalog produk dari database.");

      const data = await response.json();

      // Mapping skema JSON: Memetakan variabel snake_case backend ke variabel properti React POS
      const dataDipetakan = data.map((item) => ({
        id: item.id,
        sku: item.sku,
        nama: item.nama,
        harga: item.harga_jual || 0, // Mengunci nilai field harga jual resmi dari database
        stokAktual: item.stok_aktual ?? item.stokAktual ?? 0,
        satuan: item.satuan,
      }));

      setProdukGudang(dataDipetakan);
    } catch (error) {
      console.error("Gagal sinkronisasi katalog produk untuk Proforma:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // [SESI 3: LOGIKA HANDLER & KONTROL INPUT (LOGIKA POS)]
  // ==========================================================

  // FUNGSI A: Mengatur aksi saat dropdown pilihan produk berubah (Auto-Fill Harga Jual Satuan)
  const handleProdukSelectChange = (indexStr) => {
    if (indexStr === "") {
      setItemInput({ selectedIndexProduk: "", qty: "", hargaCustom: "" });
      return;
    }

    // Ambil data produk terarah berdasarkan nomor indeks array katalog gudang
    const prod = produkGudang[indexStr];

    setItemInput({
      selectedIndexProduk: indexStr,
      qty: itemInput.qty || "", // Short-circuit guard agar field qty tidak bertipe undefined
      // AUTO HARGA JUAL: Mengisi inputan secara otomatis menggunakan nilai harga_jual dasar barang
      hargaCustom: prod.harga ? prod.harga.toString() : "0",
    });
  };

  // FUNGSI B: Memasukkan barang dari form input produk ke dalam list draf meja kasir (Keranjang POS)
  const handleTambahProduk = (e) => {
    e.preventDefault();
    if (
      itemInput.selectedIndexProduk === "" ||
      !itemInput.qty ||
      !itemInput.hargaCustom
    ) {
      return toast.warning("Silakan lengkapi pilihan produk dan kuantitas!");
    }

    const prod = produkGudang[itemInput.selectedIndexProduk];
    const kuantitas = parseInt(itemInput.qty) || 0;
    const hargaJual = parseInt(itemInput.hargaCustom) || 0;

    if (kuantitas <= 0 || hargaJual <= 0) return;

    // REKONSILIASI KEMBAR: Cek apakah produk dengan SKU tersebut sudah nangkring di keranjang belanja?
    const itemEksisIdx = itemsKeranjang.findIndex(
      (item) => item.sku === prod.sku,
    );

    if (itemEksisIdx !== -1) {
      // Jika SKU sudah ada, cukup akumulasikan jumlah kuantitas lamanya dengan inputan kuantitas yang baru
      setItemsKeranjang((prev) =>
        prev.map((item, idx) =>
          idx === itemEksisIdx
            ? {
                ...item,
                qty: item.qty + kuantitas,
                total: (item.qty + kuantitas) * hargaJual,
              }
            : item,
        ),
      );
    } else {
      // Jika SKU benar-benar baru, daftarkan baris objek barang baru ke dalam list array keranjang POS
      setItemsKeranjang((prev) => [
        ...prev,
        {
          sku: prod.sku,
          nama: prod.nama,
          qty: kuantitas,
          harga: hargaJual,
          total: kuantitas * hargaJual,
        },
      ]);
    }

    // Bersihkan form baris input barang agar siap mengetik atau memilih item selanjutnya
    setItemInput({ selectedIndexProduk: "", qty: "", hargaCustom: "" });
    toast.success("Produk berhasil dimuat ke draf nota.", { autoClose: 1500 });
  };

  // FUNGSI C: Mengeluarkan satu baris item barang dari list pratinjau nota A4
  const handleHapusItem = (sku) => {
    setItemsKeranjang((prev) => prev.filter((item) => item.sku !== sku));
    toast.info("Item dikeluarkan dari keranjang.", { autoClose: 1500 });
  };

  // FUNGSI D: Menentukan nama pembeli manual/sementara jika bendera isTambahCustomerBaru aktif
  const handleSimpanCustomerBaru = () => {
    if (namaCustomerBaru.trim() !== "") {
      setFormData((prev) => ({ ...prev, pelanggan: namaCustomerBaru.trim() }));
      setAlamat(""); // Kosongkan alamat agar admin bisa mengetik manual lokasi kirim customer baru
      setIsTambahCustomerBaru(false);
      setNamaCustomerBaru("");
      toast.success("Customer sementara berhasil ditentukan.");
    }
  };

  // ==========================================================
  // [SESI 4: ASYNCHRONOUS API MUTATION & ARRAYBUFFER LOGIC]
  // ==========================================================

  // FUNGSI UTAMA: Mengunci transaksi proforma ke cloud Django sekaligus menangkap data biner PDF untuk diunduh langsung
  const handleCetakDanSimpanInvoice = async () => {
    // Rangkaian gerbang validasi administratif data POS sebelum dikirim via internet
    if (!formData.nomorInvoice || formData.nomorInvoice.trim() === "") {
      return toast.error("Gagal! Nomor Invoice wajib diisi.");
    }
    if (!formData.pelanggan || formData.pelanggan === "") {
      return toast.error("Gagal! Nama customer belum ditentukan.");
    }
    if (itemsKeranjang.length === 0) {
      return toast.error("Gagal! Keranjang muatan barang masih kosong.");
    }

    // Bungkus payload terstruktur rapi sesuai spesifikasi serializer database Django
    const payload = {
      nomor_invoice: formData.nomorInvoice,
      pelanggan: formData.pelanggan,
      alamat_pengiriman: alamat.trim() || "Jakarta Utara", // Default alamat fallback jika kosong
      tanggal: formData.tanggal,
      ongkir: parseInt(formData.ongkir) || 0,
      items: itemsKeranjang.map((item) => ({
        sku: item.sku,
        nama_produk: item.nama,
        qty: item.qty,
        harga: item.harga,
        total: item.total,
      })),
    };

    // Tampilkan animasi loading bertipe status mengambang (floating toast)
    const idToastLoading = toast.loading(
      "Sedang memproses dokumen penawaran dan memproses file PDF...",
    );

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/sales/proforma-invoices/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      // Deteksi validasi error khusus backend jika nomor proforma invoice kedapatan duplikat di server
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.nomor_invoice) {
          throw new Error("Nomor Invoice sudah terdaftar! Gunakan nomor lain.");
        }
        throw new Error("Gagal memproses dokumen invoice di server.");
      }

      // LOGIKA BINER (STREAM DOWNLOAD): Menangkap aliran data mentah berkas PDF dari Django REST Framework
      const buffer = await response.arrayBuffer();
      // Bungkus data buffer biner ke dalam objek Blob bertipe MIME aplikasi PDF resmi
      const pdfBlob = new Blob([buffer], { type: "application/pdf" });

      if (pdfBlob.size === 0) {
        throw new Error(
          "Gagal mengunduh. File biner PDF yang diterima berukuran 0 byte.",
        );
      }

      // Prosedur Unduh Otomatis: Membuat tautan virtual di memori browser, eksekusi klik, lalu hancurkan link-nya
      const fileUrl = window.URL.createObjectURL(pdfBlob);
      const linkDownload = document.createElement("a");
      linkDownload.href = fileUrl;

      const namaCustomer = formData.pelanggan
        ? formData.pelanggan.trim()
        : "Customer";
      const tanggalInvoice = formData.tanggal || "Tanggal";

      // Bersihkan string penamaan file dari simbol-simbol ilegal pembaca file sistem operasi
      const namaAman = namaCustomer.replace(/[/\\?%*:|"<>]/g, "-");
      const tanggalAman = tanggalInvoice.replace(/[/\\?%*:|"<>]/g, "-");

      linkDownload.download = `Proforma Invoice ${namaAman} ${tanggalAman}.pdf`;

      linkDownload.style.display = "none";
      document.body.appendChild(linkDownload);
      linkDownload.click(); // Eksekusi download file PDF pesanan pembeli

      document.body.removeChild(linkDownload);
      window.URL.revokeObjectURL(fileUrl); // Sterilkan sisa URL memori browser

      // Ubah loading toast menjadi status sukses terbit
      toast.update(idToastLoading, {
        render: "Sukses! Transaksi selewat berhasil dikonversi ke PDF resmi.",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      // BERSIHKAN MEJA KERJA KASIR: Kosongkan seluruh state form input karena lembar kerja POS sudah selesai direkam
      setItemsKeranjang([]);
      setAlamat("");
      setFormData({
        nomorInvoice: "",
        pelanggan: "",
        tanggal: new Date().toISOString().split("T")[0],
        ongkir: 0,
      });

      // Pemicu maju hitungan nomor proforma otomatis selanjutnya dari database
      generateNomorProformaOtomatis();
    } catch (error) {
      toast.update(idToastLoading, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  // ==========================================================
  // [SESI 5: REAL-TIME HITUNG NOTA VALUASI FINANSIAL]
  // ==========================================================

  // Menghitung akumulasi nilai belanja bersih komoditas barang di keranjang
  const hitungSubtotal = useMemo(() => {
    return itemsKeranjang.reduce((sum, item) => sum + item.total, 0);
  }, [itemsKeranjang]);

  // Menghitung nilai grand total akhir setelah ditambahkan dengan variabel ongkos kirim ekspedisi
  const hitungGrandTotal = useMemo(() => {
    return hitungSubtotal + (parseInt(formData.ongkir) || 0);
  }, [hitungSubtotal, formData.ongkir]);

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300">
      <ToastContainer theme="dark" />

      {/* TITEL HALAMAN PO */}
      <div className="pb-6 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Invoice Proforma Generator
        </h2>
      </div>

      {/* GRID RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* PANEL KIRI: LOGISTIK KONTROL INPUT WORKSPACE */}
        <div className="xl:col-span-4 bg-[#1a1c23] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4 sticky top-6 font-sans">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
            📋 Informasi Customer
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-gray-400">Customer</label>
                <button
                  type="button"
                  onClick={() => setIsTambahCustomerBaru(!isTambahCustomerBaru)}
                  className="text-[10px] text-emerald-400 hover:underline animate-pulse"
                >
                  {isTambahCustomerBaru ? "← List Database" : "➕ Pembeli Baru"}
                </button>
              </div>

              {isTambahCustomerBaru ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Nama PT/Toko/Instansi..."
                    value={namaCustomerBaru}
                    onChange={(e) => setNamaCustomerBaru(e.target.value)}
                    className="flex-1 bg-[#15171c] border border-emerald-500/50 rounded-lg p-2 text-white text-[11px] focus:outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleSimpanCustomerBaru}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 rounded-lg text-[11px] font-bold"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <select
                  value={formData.pelanggan}
                  onChange={(e) => handleCustomerSelectChange(e.target.value)}
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold text-[11px] cursor-pointer focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Pilih Customer --</option>
                  {daftarCustomer.map((cust) => (
                    <option key={cust.id} value={cust.nama}>
                      {cust.nama}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-gray-400 mb-1">
                Alamat Pengiriman
              </label>
              <input
                type="text"
                value={alamat}
                placeholder="Masukkan Alamat Tujuan Kirim..."
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold focus:border-blue-500 focus:outline-none text-[11px]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Nomor Invoice</label>
              <input
                type="text"
                value={formData.nomorInvoice}
                placeholder="Contoh: PRO/2026/06/0010"
                onChange={(e) =>
                  setFormData({ ...formData, nomorInvoice: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-blue-400 font-mono font-bold focus:border-blue-500 focus:outline-none text-[11px]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                Tanggal Dokumen
              </label>
              <input
                type="date"
                value={formData.tanggal}
                onChange={(e) =>
                  setFormData({ ...formData, tanggal: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold focus:border-blue-500 focus:outline-none text-[11px] [color-scheme:dark]"
              />
            </div>
          </div>

          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2 pt-2">
            📦 Produk
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">
                Pilih SKU Gudang
              </label>
              <select
                value={itemInput.selectedIndexProduk}
                onChange={(e) => handleProdukSelectChange(e.target.value)}
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-[11px] cursor-pointer font-bold"
              >
                <option value="">-- Pilih SKU Gudang --</option>
                {produkGudang.map((b, idx) => (
                  <option key={idx} value={idx}>
                    [{b.sku}] - {b.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Qty</label>
                <input
                  type="number"
                  placeholder="0"
                  value={itemInput.qty}
                  onChange={(e) =>
                    setItemInput({ ...itemInput, qty: e.target.value })
                  }
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold focus:border-blue-500 focus:outline-none text-[11px]"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">
                  Harga Jual (Rp)
                </label>
                <input
                  type="number"
                  placeholder="Rp"
                  value={itemInput.hargaCustom}
                  onChange={(e) =>
                    setItemInput({ ...itemInput, hargaCustom: e.target.value })
                  }
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold focus:border-blue-500 focus:outline-none text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                Biaya Pengiriman / Ongkir (Rp)
              </label>
              <input
                type="number"
                value={formData.ongkir === 0 ? "" : formData.ongkir}
                placeholder="0"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ongkir: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-emerald-400 font-mono font-bold focus:border-blue-500 focus:outline-none text-[11px]"
              />
            </div>

            <button
              type="button"
              onClick={handleTambahProduk}
              className="w-full bg-[#242731] hover:bg-[#2d313e] text-emerald-400 font-bold py-2 rounded-lg border border-emerald-900/30 transition-all active:scale-95 text-[11px] uppercase tracking-wide shadow-md"
            >
              ➕ Tambah Produk ke INVOICE
            </button>
          </div>

          <div className="border-t border-gray-800 pt-3">
            <button
              type="button"
              onClick={handleCetakDanSimpanInvoice}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-950/40 active:scale-95 text-xs uppercase tracking-wider"
            >
              💾 Cetak & Simpan
            </button>
          </div>
        </div>

        {/* --- PANEL VIEW KANAN (PREVIEW REAL NOTA INVOICE SURAT KERTAS A4) --- */}
        <div className="xl:col-span-8 w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white text-gray-800 rounded-xl p-10 shadow-2xl flex flex-col justify-between font-sans border border-gray-200 box-border">
          <div>
            {/* BRAND HEADER PERUSAHAAN */}
            <div className="flex justify-between items-start border-b-2 border-gray-200 pb-5">
              <div>
                <h1 className="text-base font-black text-gray-900 tracking-tight">
                  PT. Solution Corporation Indonesia
                </h1>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed font-medium">
                  Ruko Bassura City, Jl. Jend. Basuki Rachmat, Jakarta Timur
                  <br />
                  Telepon: 0888-2234566 | Email: Solution.Corp@outlook.com
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-base font-extrabold text-gray-900 uppercase tracking-wider">
                  PROFORMA INVOICE
                </h2>
                <p className="text-xs font-mono text-gray-700 font-bold mt-1 bg-gray-100 px-2 py-0.5 rounded inline-block">
                  Nomor: {formData.nomorInvoice || "-"}
                </p>
              </div>
            </div>

            {/* BARIS DATA KOORDINASI ATRIBUT INVOICE */}
            <div className="grid grid-cols-2 gap-4 my-6 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                  Tagihan Kepada:
                </p>
                <p className="font-black text-gray-900 text-sm">
                  {formData.pelanggan || "Nama Toko / Instansi Belum Diisi"}
                </p>
                <p className="text-gray-600 text-[11px] mt-0.5 font-medium">
                  {alamat || "Alamat Belum Diisi"}
                </p>
              </div>
              <div className="text-right space-y-1 font-semibold text-gray-700">
                <p>
                  <span className="text-gray-400 font-normal">Tanggal:</span>{" "}
                  <span className="text-gray-900 font-bold">
                    {formData.tanggal}
                  </span>
                </p>
              </div>
            </div>

            {/* TABEL BARIS MULTI-ITEM NOTA PREVIEW */}
            <table className="w-full text-left my-6 text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-900 text-gray-900 font-bold bg-gray-50 text-[11px]">
                  <th className="py-2.5 px-2 w-24">SKU</th>
                  <th className="py-2.5 px-2">Deskripsi Varian Produk</th>
                  <th className="py-2.5 px-2 text-center w-20">Qty</th>
                  <th className="py-2.5 px-2 text-right w-28">Harga Satuan</th>
                  <th className="py-2.5 px-2 text-right w-28">
                    Total Subtotal
                  </th>
                  <th className="py-2.5 px-2 text-center text-red-500 w-10 select-none">
                    Hapus
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                {itemsKeranjang.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-8 text-center text-gray-400 italic font-medium bg-gray-50/50"
                    >
                      Belum ada muatan barang. Masukkan produk melalui panel
                      kiri.
                    </td>
                  </tr>
                ) : (
                  itemsKeranjang.map((row) => (
                    <tr
                      key={row.sku}
                      className="hover:bg-gray-50/50 group text-[11px]"
                    >
                      <td className="py-3 px-2 text-blue-600 font-mono">
                        {row.sku}
                      </td>
                      <td className="py-3 px-2 text-gray-900">{row.nama}</td>
                      <td className="py-3 px-2 text-center text-gray-900 font-mono">
                        {row.qty.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-500 font-mono">
                        Rp {row.harga.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-900 font-mono font-black">
                        Rp {row.total.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-2 text-center select-none">
                        <button
                          type="button"
                          onClick={() => handleHapusItem(row.sku)}
                          className="text-gray-300 hover:text-red-500 font-bold text-xs p-1 transition-colors"
                          title="Keluarkan item"
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

          {/* AREA PENALTY FOOTER FINANSIAL & BANK ACCOUNT INFO */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-start">
              <div className="text-[11px] text-gray-600 space-y-0.5 border border-dashed border-gray-300 p-2.5 rounded-lg bg-gray-50/50 font-medium">
                <p className="font-bold text-gray-800 text-[10px] uppercase tracking-wide mb-1">
                  Pembayaran via Transfer Bank:
                </p>
                <p className="font-bold text-gray-900">BCA 474-9999699</p>
                <p className="text-gray-500">a/n PT Solution Corp Indonesia</p>
              </div>

              <div className="w-64 text-xs space-y-1.5 text-right font-semibold text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal Produk:</span>
                  <span className="text-gray-900 font-bold font-mono">
                    Rp {hitungSubtotal.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Pengiriman (Ongkir):</span>
                  <span className="text-gray-900 font-bold font-mono">
                    Rp {formData.ongkir.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-300 pt-2">
                  <span className="uppercase tracking-wider">
                    TOTAL TAGIHAN
                  </span>
                  <span className="text-emerald-600 text-base font-mono">
                    Rp {hitungGrandTotal.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            {/* LEGAL SIGNATURE AREA */}
            <div className="flex justify-between items-end mt-12">
              <div className="text-[9px] text-gray-400 max-w-xs leading-normal pr-4 italic font-medium">
                Dokumen ini diterbitkan secara otomatis oleh sistem PT Solution
                Corp Indonesia dan sah tanpa tanda tangan basah. Terima kasih
                atas kepercayaan Anda.
              </div>
              <div className="w-40 text-center text-xs flex-shrink-0 font-bold">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-14 font-medium">
                  Hormat Kami,
                </p>
                <p className="text-gray-900 border-b border-gray-400 pb-0.5 font-black">
                  (Admin Penjualan)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
