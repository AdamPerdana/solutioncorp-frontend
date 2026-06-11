import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function InvoiceProforma() {
  // STATE MANAGEMENT & MASTER DATA INTEGRATION

  const [produkGudang] = useState([
    { sku: "STR-01", nama: "Sterno Kaleng Original", harga: 5600 },
    { sku: "STR-02", nama: "Sterno Gel Pxton Kaleng", harga: 6000 },
    { sku: "STR-03", nama: "Sterno Gel Refill Denigen 1kg", harga: 45000 },
    { sku: "STR-04", nama: "Sterno Cair Eco Liquid 1L", harga: 35000 },
  ]);

  const [daftarCustomer, setDaftarCustomer] = useState([]);
  const [isTambahCustomerBaru, setIsTambahCustomerBaru] = useState(false);
  const [namaCustomerBaru, setNamaCustomerBaru] = useState("");
  const [alamat, setAlamat] = useState("");
  const [itemsKeranjang, setItemsKeranjang] = useState([]);

  const [formData, setFormData] = useState({
    nomorInvoice: "",
    pelanggan: "",
    tanggal: new Date().toISOString().split("T")[0],
    ongkir: 0,
  });

  const [itemInput, setItemInput] = useState({
    selectedIndexProduk: "",
    qty: "",
    hargaCustom: "",
  });

  useEffect(() => {
    fetchCustomerMaster();
  }, []);

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

  //  LOGIKA HANDLER & KONTROL INPUT (LOGIKA POS)

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

    setItemInput({ selectedIndexProduk: "", qty: "", hargaCustom: "" });
    toast.success("Produk berhasil dimuat ke draf nota.", { autoClose: 1500 });
  };

  const handleHapusItem = (sku) => {
    setItemsKeranjang((prev) => prev.filter((item) => item.sku !== sku));
    toast.info("Item dikeluarkan dari keranjang.", { autoClose: 1500 });
  };

  const handleSimpanCustomerBaru = () => {
    if (namaCustomerBaru.trim() !== "") {
      setFormData((prev) => ({ ...prev, pelanggan: namaCustomerBaru }));
      setIsTambahCustomerBaru(false);
      setNamaCustomerBaru("");
      toast.success("Customer sementara berhasil ditentukan.");
    }
  };

  //  ASYNCHRONOUS API MUTATION & ARRAYBUFFER LOGIC

  const handleCetakDanSimpanInvoice = async () => {
    if (!formData.nomorInvoice || formData.nomorInvoice.trim() === "") {
      return toast.error("Gagal! Nomor Invoice wajib diisi.");
    }
    if (!formData.pelanggan || formData.pelanggan === "") {
      return toast.error("Gagal! Nama customer belum ditentukan.");
    }
    if (itemsKeranjang.length === 0) {
      return toast.error("Gagal! Keranjang muatan barang masih kosong.");
    }

    const payload = {
      nomor_invoice: formData.nomorInvoice,
      pelanggan: formData.pelanggan,
      alamat_pengiriman: alamat || "Jakarta Utara",
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

    const idToastLoading = toast.loading(
      "Sedang mengunci database dan memproses file PDF...",
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.nomor_invoice) {
          throw new Error("Nomor Invoice sudah terdaftar! Gunakan nomor lain.");
        }
        throw new Error("Gagal memproses dokumen invoice di server.");
      }

      const buffer = await response.arrayBuffer();
      const pdfBlob = new Blob([buffer], { type: "application/pdf" });

      if (pdfBlob.size === 0) {
        throw new Error(
          "Gagal mengunduh. File biner PDF yang diterima berukuran 0 byte.",
        );
      }

      const fileUrl = window.URL.createObjectURL(pdfBlob);
      const linkDownload = document.createElement("a");
      linkDownload.href = fileUrl;

      const namaCustomer = formData.pelanggan
        ? formData.pelanggan.trim()
        : "Customer";
      const tanggalInvoice = formData.tanggal || "Tanggal";

      const namaAman = namaCustomer.replace(/[/\\?%*:|"<>]/g, "-");
      const tanggalAman = tanggalInvoice.replace(/[/\\?%*:|"<>]/g, "-");

      // Hasil keluaran nama file: Proforma Invoice [Nama PT] [Tanggal].pdf
      linkDownload.download = `Proforma Invoice ${namaAman} ${tanggalAman}.pdf`;
      // =========================================================

      linkDownload.style.display = "none";
      document.body.appendChild(linkDownload);
      linkDownload.click();

      document.body.removeChild(linkDownload);
      window.URL.revokeObjectURL(fileUrl);

      toast.update(idToastLoading, {
        render: "Sukses! Transaksi terkunci dan PDF resmi berhasil diunduh.",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setItemsKeranjang([]);
      setAlamat("");
      setFormData({
        nomorInvoice: "",
        pelanggan: "",
        tanggal: new Date().toISOString().split("T")[0],
        ongkir: 0,
      });
    } catch (error) {
      toast.update(idToastLoading, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  // RUMUSAN REAL-TIME HITUNG NOTA

  const hitungSubtotal = useMemo(() => {
    return itemsKeranjang.reduce((sum, item) => sum + item.total, 0);
  }, [itemsKeranjang]);

  const hitungGrandTotal = useMemo(() => {
    return hitungSubtotal + (parseInt(formData.ongkir) || 0);
  }, [hitungSubtotal, formData.ongkir]);

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300">
      <ToastContainer theme="dark" />

      <div className="pb-6 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Invoice Proforma Generator
        </h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
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
                placeholder="Contoh: 54/SCI/6/2026"
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

        <div className="xl:col-span-8 w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white text-gray-800 rounded-xl p-10 shadow-2xl flex flex-col justify-between font-sans border border-gray-200 box-border">
          <div>
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
