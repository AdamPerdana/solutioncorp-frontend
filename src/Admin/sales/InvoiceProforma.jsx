import React, { useState, useMemo } from "react";

export default function InvoiceProforma() {
  // =========================================================
  // 1. DATABASE SEMENTARA (SINKRON TOTAL DENGAN DATA POS)
  // =========================================================

  // DATA KATALOG PRODUK MASTER
  const [produkGudang] = useState([
    { sku: "STR-01", nama: "Sterno Kaleng Original", harga: 5600 },
    { sku: "STR-02", nama: "Sterno Gel Pxton Kaleng", harga: 6000 },
    { sku: "STR-03", nama: "Sterno Gel Refill Denigen 1kg", harga: 45000 },
    { sku: "STR-04", nama: "Sterno Cair Eco Liquid 1L", harga: 35000 },
  ]);

  // DATA MASTER CUSTOMER
  const [daftarCustomer, setDaftarCustomer] = useState([
    "-- Pilih Customer --",
    "CV. Victoria Indo Pratama",
    "PT. Jaya Sukses Mandiri",
    "Hotel Nusantara Jakarta",
  ]);

  // Kontrol tambah customer baru lewat dropdown
  const [isTambahCustomerBaru, setIsTambahCustomerBaru] = useState(false);
  const [namaCustomerBaru, setNamaCustomerBaru] = useState("");

  // STATE FORM INFRASTRUKTUR NOTA TAGIHAN
  const [formData, setFormData] = useState({
    nomorInvoice: "54/SCI/6/2026",
    pelanggan: "-- Pilih Customer --",
    tanggal: "2026-06-06",
    ongkir: 0,
  });

  const [alamat, setAlamat] = useState("Jakarta Utara");

  // FORM INPUT ITEM MASUK KERANJANG (IDENTIK POS)
  const [itemInput, setItemInput] = useState({
    selectedIndexProduk: "",
    qty: "",
    hargaCustom: "",
  });

  // MULTI-ITEM KERANJANG KERTAS PREVIEW
  const [itemsKeranjang, setItemsKeranjang] = useState([
    {
      sku: "STR-01",
      nama: "Sterno Kaleng Original",
      qty: 5000,
      harga: 5600,
      total: 28000000,
    },
  ]);

  // =========================================================
  // 2. LOGIKA HANDLER & KONTROL INPUT (LOGIKA POS)
  // =========================================================

  // DROPDOWN: Isi Otomatis Harga Saat Pilih Produk
  const handleProdukSelectChange = (indexStr) => {
    if (indexStr === "") {
      setItemInput({ selectedIndexProduk: "", qty: "", hargaCustom: "" });
      return;
    }
    const prod = produkGudang[indexStr];
    setItemInput({
      selectedIndexProduk: indexStr,
      qty: itemInput.qty,
      hargaCustom: prod.harga.toString(),
    });
  };

  // FUNGSI: MASUKKAN BARANG KE KERANJANG INVOICE
  const handleTambahProduk = (e) => {
    e.preventDefault();
    if (
      itemInput.selectedIndexProduk === "" ||
      !itemInput.qty ||
      !itemInput.hargaCustom
    ) {
      return alert("Silakan lengkapi pilihan produk dan volume kuantitas!");
    }

    const prod = produkGudang[itemInput.selectedIndexProduk];
    const kuantitas = parseInt(itemInput.qty) || 0;
    const hargaJual = parseInt(itemInput.hargaCustom) || 0;

    if (kuantitas <= 0 || hargaJual <= 0) return;

    // Gabungkan kuantitas kalo produk yang dipilih sudah ada di kertas nota
    const itemEksisIdx = itemsKeranjang.findIndex(
      (item) => item.sku === prod.sku,
    );
    if (itemEksisIdx !== -1) {
      setItemsKeranjang((prev) =>
        prev.map((item, idx) =>
          idx === itemEksisIdx
            ? {
                ...item,
                qty: item.qty + kuantitas,
                total: (item.qty + kuantitas) * item.harga,
              }
            : item,
        ),
      );
    } else {
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

    // Reset input produk form
    setItemInput({ selectedIndexProduk: "", qty: "", hargaCustom: "" });
  };

  // HAPUS BARIS PRODUK DARI TABEL KERTAS
  const handleHapusItem = (sku) => {
    setItemsKeranjang((prev) => prev.filter((item) => item.sku !== sku));
  };

  // SIMPAN CUSTOMER BARU KE LIST DROPDOWN
  const handleSimpanCustomerBaru = () => {
    if (namaCustomerBaru.trim() !== "") {
      setDaftarCustomer((prev) => [...prev, namaCustomerBaru]);
      setFormData((prev) => ({ ...prev, pelanggan: namaCustomerBaru }));
      setIsTambahCustomerBaru(false);
      setNamaCustomerBaru("");
    }
  };

  // =========================================================
  // 3. RUMUSAN REAL-TIME HITUNG NOTA
  // =========================================================
  const hitungSubtotal = useMemo(() => {
    return itemsKeranjang.reduce((sum, item) => sum + item.total, 0);
  }, [itemsKeranjang]);

  const hitungGrandTotal = useMemo(() => {
    return hitungSubtotal + (parseInt(formData.ongkir) || 0);
  }, [hitungSubtotal, formData.ongkir]);

  // =========================================================
  // 4. DISPLAY LAYOUT VIEW RENDER
  // =========================================================
  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300">
      {/* HEADER HALAMAN */}
      <div className="pb-6 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Invoice Proforma Generator
        </h2>
      </div>

      {/* GRID UTAMA LAYOUT (IDENTIK COMPONENT POS) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* PANEL KENDALI INPUT LIVE (xl:col-span-4) */}
        <div className="xl:col-span-4 bg-[#1a1c23] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4 sticky top-6 font-sans">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
            📋 Informasi Customer
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Input Seleksi Customer */}
            <div className="col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-gray-400">Customer</label>
                <button
                  type="button"
                  onClick={() => setIsTambahCustomerBaru(!isTambahCustomerBaru)}
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  {isTambahCustomerBaru ? "← List" : "➕ Baru"}
                </button>
              </div>

              {isTambahCustomerBaru ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Nama PT/Toko..."
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
                  onChange={(e) =>
                    setFormData({ ...formData, pelanggan: e.target.value })
                  }
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold text-[11px] cursor-pointer focus:border-blue-500 focus:outline-none"
                >
                  {daftarCustomer.map((cust, index) => (
                    <option key={index} value={cust}>
                      {cust}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Input Alamat Kirim */}
            <div className="col-span-2">
              <label className="block text-gray-400 mb-1">
                Alamat Pengiriman
              </label>
              <input
                type="text"
                placeholder="Jakarta"
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold focus:border-blue-500 focus:outline-none text-[11px]"
              />
            </div>

            {/* Nomor Invoice Proforma */}
            <div>
              <label className="block text-gray-400 mb-1">Nomor Invoice</label>
              <input
                type="text"
                placeholder="54/SCI/6/2026"
                onChange={(e) =>
                  setFormData({ ...formData, nomorInvoice: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-blue-400 font-mono font-bold focus:border-blue-500 focus:outline-none text-[11px]"
              />
            </div>

            {/* Tanggal Terbit Nota */}
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

          {/* SEC 2: MUAT ARTIKEL BARANG */}
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

            {/* Input Biaya Pengiriman Ongkir */}
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
              onClick={() =>
                alert("Mengirim payload proforma utuh ke Django DRF...")
              }
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-950/40 active:scale-95 text-xs uppercase tracking-wider"
            >
              💾 Cetak & Simpan
            </button>
          </div>
        </div>

        {/* PANEL LIVE PREVIEW KERTAS INVOICE (UKURAN TETAP A4 INDONESIA) */}
        <div className="xl:col-span-8 w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white text-gray-800 rounded-xl p-10 shadow-2xl flex flex-col justify-between font-sans border border-gray-200 box-border">
          <div>
            {/* Kop Surat Perusahaan */}
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

            {/* Info Pihak Penerima Tagihan */}
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

            {/* Tabel Data Barang Live Render */}
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

          {/* SISI BAWAH DOKUMEN PREVIEW KERTAS */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-start">
              {/* Rekening Pembayaran Resmi */}
              <div className="text-[11px] text-gray-600 space-y-0.5 border border-dashed border-gray-300 p-2.5 rounded-lg bg-gray-50/50 font-medium">
                <p className="font-bold text-gray-800 text-[10px] uppercase tracking-wide mb-1">
                  Pembayaran via Transfer Bank:
                </p>
                <p className="font-bold text-gray-900">BCA 474-9999699</p>
                <p className="text-gray-500">a/n PT Solution Corp Indonesia</p>
              </div>

              {/* Ringkasan Subtotal, Ongkir, dan Grand Total Jual */}
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

            {/* Baris Tanda Tangan Proforma */}
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
