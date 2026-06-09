import React, { useState, useMemo } from "react";

export default function PurchaseOrder() {
  // 1. DATA MASTER ACUAN DROPDOWN (Nanti tinggal ditarik dari API GET Produk/Supplier)
  const [produkGudang] = useState([
    { sku: "STR-001", nama: "Sterno Kaleng Original Pxton" },
    { sku: "STR-002", nama: "Sterno Gel Refill 1kg Pxton" },
    { sku: "STR-003", nama: "Sterno Cair Eco Liquid 1L" },
  ]);

  const [daftarSupplier] = useState([
    { id: 1, nama: "PT Kimia Industri Utama" },
    { id: 2, nama: "Pabrik Kaleng Logam Jaya" },
    { id: 3, nama: "CV Distribusi Solusi Kimia" },
  ]);

  // 2. DATABASE ARSIP TRANSAKSI (Sengaja tidak pakai localStorage biar kehapus pas PC mati/refresh)
  const [arsipPO, setArsipPO] = useState([
    {
      id: 1,
      noPO: "PO-2026-001",
      supplier: "PT Kimia Industri Utama",
      tgl: "2026-06-01",
      grandTotal: 1635000,
      items: [
        {
          sku: "STR-002",
          nama: "Sterno Gel Refill 1kg Pxton",
          qty: 50,
          hargaBeli: 17500,
          total: 875000,
        },
      ],
    },
  ]);

  // 3. STATE KERANJANG DRAFT (MULTI-ARTIKEL)
  const [keranjangDraft, setKeranjangDraft] = useState([]);

  // State Form Isian Lembar Kerja
  const [metaPO, setMetaPO] = useState({
    noPO: "",
    supplier: "",
    tgl: new Date().toISOString().split("T")[0],
  });

  const [itemInput, setItemInput] = useState({
    selectedIndexProduk: "",
    qty: "",
    hargaBeli: "",
  });

  // State Pencarian & Modal Konfirmasi
  const [searchTerm, setSearchTerm] = useState("");
  const [dataAkanDisimpan, setDataAkanDisimpan] = useState(null);

  // FUNGSI: MASUKKAN BARANG KE KERANJANG DRAFT
  const handleTambahKeKeranjang = (e) => {
    e.preventDefault();
    if (
      itemInput.selectedIndexProduk === "" ||
      !itemInput.qty ||
      !itemInput.hargaBeli
    )
      return;

    const prod = produkGudang[itemInput.selectedIndexProduk];
    const kuantitas = parseInt(itemInput.qty) || 0;
    const harga = parseInt(itemInput.hargaBeli) || 0;

    if (kuantitas <= 0 || harga <= 0) return;

    const itemEksisIdx = keranjangDraft.findIndex(
      (item) => item.sku === prod.sku,
    );
    if (itemEksisIdx !== -1) {
      setKeranjangDraft((prev) =>
        prev.map((item, idx) =>
          idx === itemEksisIdx
            ? {
                ...item,
                qty: item.qty + kuantitas,
                total: (item.qty + kuantitas) * item.hargaBeli,
              }
            : item,
        ),
      );
    } else {
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

    setItemInput({ selectedIndexProduk: "", qty: "", hargaBeli: "" });
  };

  // FUNGSI: HAPUS SATU BARANG DI KERANJANG DRAFT
  const handleHapusItemDraft = (sku) => {
    setKeranjangDraft((prev) => prev.filter((item) => item.sku !== sku));
  };

  const grandTotalDraft = useMemo(() => {
    return keranjangDraft.reduce((sum, item) => sum + item.total, 0);
  }, [keranjangDraft]);

  // TAHAP 1 VALIDASI: AMBIL BUNDEL DATA SEBELUM TEMBAK
  const handlePicuKonfirmasi = () => {
    if (
      metaPO.noPO.trim() === "" ||
      metaPO.supplier === "" ||
      keranjangDraft.length === 0
    ) {
      alert(
        "Lengkapi No. PO, Supplier, dan minimal isi 1 barang di keranjang.",
      );
      return;
    }

    // Variabel PAYLOAD ini yang besok tinggal kamu bungkus buat ditembak ke Django API
    setDataAkanDisimpan({
      noPO: metaPO.noPO.trim().toUpperCase(),
      supplier: metaPO.supplier,
      tgl: metaPO.tgl,
      items: keranjangDraft,
      grandTotal: grandTotalDraft,
    });
  };

  // TAHAP 2 SIMPAN: MASUK ARSIP MOCKUP SEMENTARA
  const handleEksekusiSimpan = () => {
    if (!dataAkanDisimpan) return;

    setArsipPO((prev) => [{ id: Date.now(), ...dataAkanDisimpan }, ...prev]);

    // Reset Kerja Kasir
    setKeranjangDraft([]);
    setMetaPO({
      noPO: "",
      supplier: "",
      tgl: new Date().toISOString().split("T")[0],
    });
    setDataAkanDisimpan(null);
  };

  const filteredArsip = arsipPO.filter(
    (item) =>
      item.noPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      {/* HEADER MODUL */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Purchase Order (Mockup Multi-Item)
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Penyusunan modul transaksi eksternal. Struktur data siap dikoneksikan
          ke server backend Django.
        </p>
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
                <label className="block text-gray-400 mb-1">
                  Supplier Tujuan
                </label>
                <select
                  value={metaPO.supplier}
                  onChange={(e) =>
                    setMetaPO({ ...metaPO, supplier: e.target.value })
                  }
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none cursor-pointer text-[11px]"
                >
                  <option value="">-- Pilih Supplier Partner --</option>
                  {daftarSupplier.map((sup) => (
                    <option key={sup.id} value={sup.nama}>
                      {sup.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleTambahKeKeranjang}
            className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3"
          >
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
              📦 2. Muat Artikel Barang
            </h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Pilih Produk</label>
                <select
                  value={itemInput.selectedIndexProduk}
                  onChange={(e) =>
                    setItemInput({
                      ...itemInput,
                      selectedIndexProduk: e.target.value,
                    })
                  }
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none cursor-pointer text-[11px]"
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
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-[11px] uppercase tracking-wider transition-all"
            >
              ➕ Masukkan Keranjang
            </button>
          </form>
        </div>

        {/* PANEL KANAN: DRAFT KERANJANG & HISTORI TABLE */}
        <div className="xl:col-span-9 space-y-5">
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                🛒 Draft Keranjang Multi-Item
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
                    <th className="p-2 text-right pr-4">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-xs font-medium">
                  {keranjangDraft.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
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
                        <td className="p-2 text-right text-sky-400 font-bold pr-4">
                          Rp {item.total.toLocaleString("id-ID")}
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
                💾 Simpan & Validasi Purchase Order
              </button>
            )}
          </div>

          {/* ARSIP HISTORI BERJALAN */}
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                📋 Arsip Sejarah Pemesanan PO (Sesi Berjalan)
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
                    <th className="p-2.5">Supplier Partner</th>
                    <th className="p-2.5 text-center">Jumlah Item</th>
                    <th className="p-2.5 text-right pr-4">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-xs font-medium">
                  {filteredArsip.map((po) => (
                    <tr key={po.id} className="hover:bg-[#1d2029]/30">
                      <td className="p-2.5 pl-4 font-mono text-amber-500 font-bold">
                        {po.noPO}
                      </td>
                      <td className="p-2.5 text-gray-500 font-mono">
                        {po.tgl}
                      </td>
                      <td className="p-2.5 text-gray-300">{po.supplier}</td>
                      <td className="p-2.5 text-center text-white">
                        {po.items.length} Item
                      </td>
                      <td className="p-2.5 text-right font-black text-sky-400 font-mono pr-4">
                        Rp {po.grandTotal.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL MOCKUP DARK UNTUK SIMPAN */}
      {dataAkanDisimpan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-blue-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-xl">📝</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Konfirmasi Transaksi PO
              </h3>
            </div>
            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Apakah Anda ingin memvalidasi dokumen{" "}
              <span className="font-mono font-bold text-blue-400">
                "{dataAkanDisimpan.noPO}"
              </span>
              ? Besok, fungsi tombol ini akan mengirim payload JSON utuh ke API
              Django untuk mencetak PDF.
            </div>
            <div className="flex gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDataAkanDisimpan(null)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleEksekusiSimpan}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-bold shadow-lg"
              >
                Ya, Validasi Sementara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
