import React, { useState, useMemo } from "react";

export default function InvoiceProforma() {
  // 1. DATA MASTER PRODUK PT SOLUTION CORP INDONESIA
  const mockBarang = [
    { id: 1, nama: "Sterno Kaleng", harga: 5600 },
    { id: 2, nama: "Sterno Gel Pxton Kaleng", harga: 6000 },
    { id: 3, nama: "Sterno Gel Refill Denigen", harga: 45000 },
    { id: 4, nama: "Sterno Cair Eco Liquid 1L", harga: 19000 },
  ];

  // 2. UTAMA UNTUK INFORMASI NOTA TAGIHAN (DRAF DEFAULT)
  const [customer, setCustomer] = useState("CV. Victoria Indo Pratama");
  const [alamat, setAlamat] = useState("Jakarta Utara");
  const [nomorInvoice, setNomorInvoice] = useState("54/SCI/6/2026");
  const [tanggal, setTanggal] = useState("2026-06-06");
  const [jatuhTempo, setJatuhTempo] = useState("-");

  // 3. SELEKSI PRODUK & BIAYA TAMBAHAN
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [qtyInput, setQtyInput] = useState("");
  const [ongkirInput, setOngkirInput] = useState(0);

  // 4. MULTI-ITEM KERANJANG KERTAS PREVIEW
  const [itemsKeranjang, setItemsKeranjang] = useState([
    { id: 1, nama: "Sterno Kaleng", qty: 5000, harga: 5600, total: 28000000 },
  ]);

  // 5. PENAMBAHAN ITEM KE TABEL KERTAS
  const handleTambahProduk = (e) => {
    e.preventDefault();
    const kuantitas = parseInt(qtyInput);
    if (!kuantitas || kuantitas <= 0)
      return alert("Silakan isi volume kuantitas produk!");

    const produkTerpilih = mockBarang[selectedProductIndex];

    // Gabungkan kuantitas kalo produk yang dipilih sudah ada di kertas
    const indexSama = itemsKeranjang.findIndex(
      (item) => item.nama === produkTerpilih.nama,
    );
    if (indexSama !== -1) {
      setItemsKeranjang((prev) =>
        prev.map((item, idx) => {
          if (idx === indexSama) {
            const totalQty = item.qty + kuantitas;
            return { ...item, qty: totalQty, total: totalQty * item.harga };
          }
          return item;
        }),
      );
    } else {
      const itemBaru = {
        id: Date.now(),
        nama: produkTerpilih.nama,
        qty: kuantitas,
        harga: produkTerpilih.harga,
        total: kuantitas * produkTerpilih.harga,
      };
      setItemsKeranjang((prev) => [...prev, itemBaru]);
    }

    setQtyInput("");
  };

  // HAPUS BARIS PRODUK DARI TABEL KERTAS
  const handleHapusItem = (id) => {
    setItemsKeranjang((prev) => prev.filter((item) => item.id !== id));
  };

  // 6. HITUNG NOTA (SUBTOTAL & GRAND TOTAL)
  const hitungSubtotal = useMemo(() => {
    return itemsKeranjang.reduce((sum, item) => sum + item.total, 0);
  }, [itemsKeranjang]);

  const hitungGrandTotal = useMemo(() => {
    const biayaKirim = parseInt(ongkirInput) || 0;
    return hitungSubtotal + biayaKirim;
  }, [hitungSubtotal, ongkirInput]);

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300">
      {/* HEADER HALAMAN */}
      <div className="pb-6 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Invoice Proforma Generator
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Ketik langsung di panel kiri, tampilan draf kertas di kanan akan
          langsung berubah otomatis tanpa tombol preview.
        </p>
      </div>

      {/* GRID UTAMA LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* PANEL KENDALI INPUT LIVE (xl:col-span-4) */}
        <div className="xl:col-span-4 bg-[#1a1c23] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4 sticky top-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
            📋 Informasi Tagihan
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="col-span-2">
              <label className="block text-gray-400 mb-1">
                Nama Customer / Instansi
              </label>
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold focus:border-emerald-500 focus:outline-none text-[11px]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-400 mb-1">
                Alamat Tujuan Pengiriman
              </label>
              <input
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none text-[11px]"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Nomor Invoice</label>
              <input
                type="text"
                value={nomorInvoice}
                onChange={(e) => setNomorInvoice(e.target.value)}
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-blue-400 font-mono font-bold focus:border-emerald-500 focus:outline-none text-[11px]"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">
                Tanggal Dokumen
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none text-[11px]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-400 mb-1">Jatuh Tempo</label>
              <input
                type="text"
                value={jatuhTempo}
                onChange={(e) => setJatuhTempo(e.target.value)}
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none text-[11px]"
              />
            </div>
          </div>

          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2 pt-2">
            📦 Transaksi Produk
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">
                Pilih Varian Produk
              </label>
              <select
                value={selectedProductIndex}
                onChange={(e) =>
                  setSelectedProductIndex(parseInt(e.target.value))
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none text-[11px] cursor-pointer font-medium"
              >
                {mockBarang.map((b, idx) => (
                  <option key={b.id} value={idx}>
                    {b.nama} (Rp {b.harga.toLocaleString("id-ID")})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">
                  Volume Kuantitas (Qty)
                </label>
                <input
                  type="number"
                  placeholder="Pcs / Kaleng"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold focus:border-emerald-500 focus:outline-none text-[11px]"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">
                  Biaya Kirim / Ongkir (Rp)
                </label>
                <input
                  type="number"
                  value={ongkirInput === 0 ? "" : ongkirInput}
                  placeholder="Rp 0"
                  onChange={(e) =>
                    setOngkirInput(parseInt(e.target.value) || 0)
                  }
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none text-[11px]"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleTambahProduk}
              className="w-full bg-[#242731] hover:bg-[#2d313e] text-emerald-400 font-bold py-2 rounded-lg border border-emerald-900/30 transition-all active:scale-95 text-[11px] uppercase tracking-wide shadow-md"
            >
              ➕ Masukkan Produk ke Kertas Nota
            </button>
          </div>

          <div className="border-t border-gray-800 pt-3">
            <button
              type="button"
              onClick={() =>
                alert("Mengirim data proforma final ke Django server...")
              }
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-950/40 active:scale-95 text-xs uppercase tracking-wider"
            >
              💾 Cetak & Simpan Ke Database (Backend)
            </button>
          </div>
        </div>

        {/* PANEL LIVE PREVIEW KERTAS INVOICE (xl:col-span-8 ) */}
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
                  SALES INVOICE
                </h2>
                <p className="text-xs font-mono text-gray-700 font-bold mt-1 bg-gray-100 px-2 py-0.5 rounded inline-block">
                  Nomor: {nomorInvoice || "-"}
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
                  {customer || "Nama Toko / Instansi Belum Diisi"}
                </p>
                <p className="text-gray-600 text-[11px] mt-0.5 font-medium">
                  {alamat || "Alamat Belum Diisi"}
                </p>
              </div>
              <div className="text-right space-y-1 font-semibold text-gray-700">
                <p>
                  <span className="text-gray-400 font-normal">Tanggal:</span>{" "}
                  <span className="text-gray-900 font-bold">{tanggal}</span>
                </p>
                <p>
                  <span className="text-gray-400 font-normal">
                    Jatuh Tempo:
                  </span>{" "}
                  <span className="text-gray-900 font-bold">{jatuhTempo}</span>
                </p>
              </div>
            </div>

            {/* Tabel Data Barang Live Render */}
            <table className="w-full text-left my-6 text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-900 text-gray-900 font-bold bg-gray-50 text-[11px]">
                  <th className="py-2.5 px-2">Deskripsi Varian Produk</th>
                  <th className="py-2.5 px-2 text-center w-20">Qty</th>
                  <th className="py-2.5 px-2 text-right w-32">Harga Satuan</th>
                  <th className="py-2.5 px-2 text-right w-32">
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
                      colSpan="5"
                      className="py-8 text-center text-gray-400 italic font-medium bg-gray-50/50"
                    >
                      Belum ada muatan barang. Masukkan produk melalui panel
                      kiri.
                    </td>
                  </tr>
                ) : (
                  itemsKeranjang.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50/50 group text-[11px]"
                    >
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
                          onClick={() => handleHapusItem(row.id)}
                          className="text-gray-300 hover:text-red-500 font-bold text-xs p-1 transition-colors"
                          title="Keluarkan dari faktur"
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

          {/* SISI BAWAH DOKUMEN PREVIEW */}
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

              {/* Ringkasan Biaya Pengiriman & Total Tagihan Hitung Live */}
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
                    Rp {(parseInt(ongkirInput) || 0).toLocaleString("id-ID")}
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

            {/* Baris Tanda Tangan */}
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
