import React, { useState, useMemo } from "react";

export default function Pos() {
  // DATA KATALOG PRODUK MASTER
  const [produkGudang] = useState([
    { sku: "STR-01", nama: "Sterno Kaleng Original", harga: 5600 },
    { sku: "STR-02", nama: "Sterno Gel Pxton Kaleng", harga: 6000 },
    { sku: "STR-03", nama: "Sterno Gel Refill Denigen 1kg", harga: 45000 },
    { sku: "STR-04", nama: "Sterno Cair Eco Liquid 1L", harga: 35000 },
  ]);

  //  DATA MASTER CUSTOMER
  const [daftarCustomer, setDaftarCustomer] = useState([
    "-- Pilih Customer --",
    "CV. Victoria Indo Pratama",
    "PT. Jaya Sukses Mandiri",
    "Hotel Nusantara Jakarta",
  ]);

  //Tambah Customer Baru Dropdown
  const [isTambahCustomerBaru, setIsTambahCustomerBaru] = useState(false);
  const [namaCustomerBaru, setNamaCustomerBaru] = useState("");

  //  DATABASE ARSIP TRANSAKSI POS (Sesi Berjalan)
  const [arsipPOS, setArsipPOS] = useState([
    {
      id: 1,
      nomorInvoice: "POS-20260608-000",
      pelanggan: "CV. Victoria Indo Pratama",
      tanggal: "2026-06-08",
      metodeBayar: "TEMPO/KREDIT",
      status: "Tempo",
      grandTotal: 28000000,
      items: [
        {
          sku: "STR-01",
          nama: "Sterno Kaleng Original",
          qty: 500,
          harga: 5600,
          total: 28000000,
        },
      ],
    },
  ]);

  // KERANJANG DRAFT (MULTI-ITEM) KASIR POS
  const [cart, setCart] = useState([]);

  // FORM ISIAN LEMBAR KERJA ADMINISTRATIF
  const [formData, setFormData] = useState({
    nomorInvoice: "POS-20260608-001",
    pelanggan: "-- Pilih Customer --",
    tanggal: "2026-06-08",
    metodeBayar: "TUNAI",
    jatahTempoHari: 0,
    jatuhTempo: "2026-06-08",
    status: "Lunas",
    ongkir: 0,
  });

  //Form Input Masuk Keranjang
  const [itemInput, setItemInput] = useState({
    selectedIndexProduk: "",
    qty: "",
    hargaCustom: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [dataAkanDisimpan, setDataAkanDisimpan] = useState(null);

  // UTILS: Hitung Tanggal Jatuh Tempo
  const hitungTanggalJatuhTempo = (tglAwal, jumlahHari) => {
    const hari = parseInt(jumlahHari) || 0;
    const tglBase = new Date(tglAwal || "2026-06-08");
    tglBase.setDate(tglBase.getDate() + hari);

    const yyyy = tglBase.getFullYear();
    const mm = String(tglBase.getMonth() + 1).padStart(2, "0");
    const dd = String(tglBase.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // DROPDOWN: Isi Otomatis Harga Jual Default Saat Pilih Produk
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

  // FUNGSI: MASUKKAN BARANG KE KERANJANG DRAFT KASIR
  const handleTambahKeKeranjang = (e) => {
    e.preventDefault();
    if (
      itemInput.selectedIndexProduk === "" ||
      !itemInput.qty ||
      !itemInput.hargaCustom
    )
      return;

    const prod = produkGudang[itemInput.selectedIndexProduk];
    const kuantitas = parseInt(itemInput.qty) || 0;
    const hargaJual = parseInt(itemInput.hargaCustom) || 0;

    if (kuantitas <= 0 || hargaJual <= 0) return;

    const itemEksisIdx = cart.findIndex((item) => item.sku === prod.sku);
    if (itemEksisIdx !== -1) {
      setCart((prev) =>
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
      setCart((prev) => [
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
  };

  // FUNGSI: HAPUS SATU BARANG DI KERANJANG DRAFT
  const handleHapusItemCart = (sku) => {
    setCart((prev) => prev.filter((item) => item.sku !== sku));
  };

  // KONTROL STATUS NOTA DARI METODE BAYAR
  const handleMetodeBayarChange = (metode) => {
    if (metode === "TUNAI") {
      setFormData((prev) => ({
        ...prev,
        metodeBayar: "TUNAI",
        status: "Lunas",
        jatahTempoHari: 0,
        jatuhTempo: prev.tanggal,
      }));
    } else {
      const defaultHari = 14;
      setFormData((prev) => ({
        ...prev,
        metodeBayar: "TEMPO/KREDIT",
        status: "Tempo",
        jatahTempoHari: defaultHari,
        jatuhTempo: hitungTanggalJatuhTempo(prev.tanggal, defaultHari),
      }));
    }
  };

  // Hari Jatuh Tempo Kredit
  const handleJatahHariInput = (hari) => {
    const jumlahHari = parseInt(hari) || 0;
    setFormData((prev) => ({
      ...prev,
      jatahTempoHari: jumlahHari,
      jatuhTempo: hitungTanggalJatuhTempo(prev.tanggal, jumlahHari),
    }));
  };

  // Simpan Registrasi Nama Pelanggan Baru ke List Dropdown
  const handleSimpanCustomerBaru = () => {
    if (namaCustomerBaru.trim() !== "") {
      setDaftarCustomer((prev) => [...prev, namaCustomerBaru]);
      setFormData((prev) => ({ ...prev, pelanggan: namaCustomerBaru }));
      setIsTambahCustomerBaru(false);
      setNamaCustomerBaru("");
    }
  };

  // RUMUSAN REAL-TIME SUB-TOTAL & GRAND TOTAL KASIR POS
  const subtotalCart = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const grandTotalCart = useMemo(() => {
    return subtotalCart + (parseInt(formData.ongkir) || 0);
  }, [subtotalCart, formData.ongkir]);

  // VALIDASI: BUNGKUS PAYLOAD UTUH SEBELUM TEMBAK API DJANGO
  const handlePicuKonfirmasi = () => {
    if (
      formData.nomorInvoice.trim() === "" ||
      formData.pelanggan === "" ||
      cart.length === 0
    ) {
      alert(
        "Lengkapi Nomor Invoice, Nama Pelanggan, dan minimal isi 1 barang di keranjang.",
      );
      return;
    }

    setDataAkanDisimpan({
      nomorInvoice: formData.nomorInvoice.trim().toUpperCase(),
      pelanggan: formData.pelanggan,
      tanggal: formData.tanggal,
      metodeBayar: formData.metodeBayar,
      status: formData.status,
      ongkir: parseInt(formData.ongkir) || 0,
      grandTotal: grandTotalCart,
      items: cart,
    });
  };

  // SIMPAN: COMMIT DATA SEMENTARA KE TABEL ARSIP KANAN
  const handleEksekusiSimpan = () => {
    if (!dataAkanDisimpan) return;

    setArsipPOS((prev) => [dataAkanDisimpan, ...prev]);

    // Bersihkan Meja Kasir POS
    setCart([]);
    setFormData({
      nomorInvoice: `POS-20260608-${String(Date.now()).slice(-3)}`,
      pelanggan: "Pelanggan Langsung (Cash)",
      tanggal: "2026-06-08",
      metodeBayar: "TUNAI",
      jatahTempoHari: 0,
      jatuhTempo: "2026-06-08",
      status: "Lunas",
      ongkir: 0,
    });
    setDataAkanDisimpan(null);
  };

  // FILTERING DATA ARSIP TRANSAKSI
  const filteredArsip = arsipPOS.filter(
    (item) =>
      item.nomorInvoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pelanggan.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Point of Sales (POS Kasir)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Sistem entri penjualan kasir terintegrasi. Format database siap
            disambung ke API Django.
          </p>
        </div>
      </div>

      {/* GRID RESPONSIVE LAYOUT (3 Berbanding 9, Identik PO) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* PANEL KIRI: FORM ENTRI ADMINISTRASI & ARTIKEL BARANG (col-span-3) */}
        <div className="xl:col-span-3 space-y-4">
          {/* SEC 1: DOKUMEN HEADER ADMINISTRASI */}
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
              📋 1. Informasi Customer
            </h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">
                  Nomor Invoice
                </label>
                <input
                  type="text"
                  placeholder="54/SCI/6/2026"
                  onChange={(e) =>
                    setFormData({ ...formData, nomorInvoice: e.target.value })
                  }
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:border-blue-500 focus:outline-none text-[11px] font-bold"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-400">Pilih Pelanggan</label>
                  <button
                    type="button"
                    onClick={() =>
                      setIsTambahCustomerBaru(!isTambahCustomerBaru)
                    }
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
                      className="flex-1 bg-[#15171c] border border-emerald-500/50 rounded-lg p-2 text-white focus:outline-none text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleSimpanCustomerBaru}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 rounded-lg text-[11px] font-bold"
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
                    className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none cursor-pointer text-[11px]"
                  >
                    {daftarCustomer.map((cust, index) => (
                      <option key={index} value={cust}>
                        {cust}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-400 mb-1">
                    Tanggal Nota
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => {
                      const tglBaru = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        tanggal: tglBaru,
                        jatuhTempo: hitungTanggalJatuhTempo(
                          tglBaru,
                          prev.jatahTempoHari,
                        ),
                      }));
                    }}
                    className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:outline-none text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">
                    Status Nota
                  </label>
                  <div
                    className={`w-full font-bold rounded-lg p-2 text-center border uppercase tracking-wider text-[10px] ${
                      formData.status === "Lunas"
                        ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
                        : "bg-amber-950/40 border-amber-800 text-amber-400"
                    }`}
                  >
                    {formData.status === "Lunas" ? "Lunas" : "Tempo"}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleMetodeBayarChange("TUNAI")}
                    className={`py-1.5 text-center rounded-lg font-bold border text-[10px] uppercase transition-all ${
                      formData.metodeBayar === "TUNAI"
                        ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                        : "bg-[#15171c] border-gray-800 text-gray-500"
                    }`}
                  >
                    📥 Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMetodeBayarChange("TEMPO/KREDIT")}
                    className={`py-1.5 text-center rounded-lg font-bold border text-[10px] uppercase transition-all ${
                      formData.metodeBayar === "TEMPO/KREDIT"
                        ? "bg-amber-950 text-amber-400 border-amber-500/40"
                        : "bg-[#15171c] border-gray-800 text-gray-500"
                    }`}
                  >
                    ⏳ Tempo
                  </button>
                </div>
              </div>

              {formData.metodeBayar === "TEMPO/KREDIT" && (
                <div className="grid grid-cols-2 gap-2 bg-[#1e1a15] p-2.5 rounded-lg border border-amber-900/40 animate-fadeIn">
                  <div>
                    <label className="block text-amber-400 mb-1">
                      Jatah (Hari)
                    </label>
                    <input
                      type="number"
                      value={formData.jatahTempoHari}
                      onChange={(e) => handleJatahHariInput(e.target.value)}
                      className="w-full bg-[#15171c] border border-amber-900/60 rounded-lg p-1 text-white focus:outline-none text-[11px] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">
                      Tgl Tempo
                    </label>
                    <input
                      type="date"
                      value={formData.jatuhTempo}
                      readOnly
                      className="w-full bg-[#15171c]/40 border border-gray-800 rounded-lg p-1 text-gray-500 text-[10px] cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-400 mb-1">
                  Biaya Pengiriman / Ongkir (Rp)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.ongkir === 0 ? "" : formData.ongkir}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ongkir: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-emerald-400 font-mono font-bold focus:border-blue-500 focus:outline-none text-[11px]"
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
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="Rp"
                    value={itemInput.hargaCustom}
                    onChange={(e) =>
                      setItemInput({
                        ...itemInput,
                        hargaCustom: e.target.value,
                      })
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
              ➕ Tambahkan Produk
            </button>
          </form>
        </div>

        {/* PANEL KANAN: PREVIEW DRAFT KERANJANG PENJUALAN & HISTORI JURNAL (col-span-9) */}
        <div className="xl:col-span-9 space-y-5">
          {/* TABEL DRAFT KERANJANG BELANJA KASIR */}
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                🛒 Point of Sale
              </h3>
              <div className="text-right text-xs font-mono">
                <span className="text-gray-500 mr-4">
                  Subtotal: Rp {subtotalCart.toLocaleString("id-ID")}
                </span>
                <span className="text-xs font-black text-white">
                  Grand Total Jual:{" "}
                  <span className="text-sky-400">
                    Rp {grandTotalCart.toLocaleString("id-ID")}
                  </span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-800/60 max-h-40 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#15171c] text-gray-400 text-[10px] font-bold select-none border-b border-gray-800">
                    <th className="p-2.5 pl-4">SKU</th>
                    <th className="p-2.5">Nama Produk </th>
                    <th className="p-2.5 text-right">Harga Jual</th>
                    <th className="p-2.5 text-right">Qty</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                    <th className="p-2.5 text-center pr-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-xs font-medium">
                  {cart.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-6 text-center text-gray-500 bg-[#1a1c23]"
                      >
                        Meja kasir kosong. Isi formulir muat artikel di panel
                        kiri.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item) => (
                      <tr key={item.sku} className="hover:bg-[#1d2029]/40">
                        <td className="p-2.5 pl-4 font-mono text-blue-400">
                          {item.sku}
                        </td>
                        <td className="p-2.5 text-white font-bold">
                          {item.nama}
                        </td>
                        <td className="p-2.5 text-right text-gray-400">
                          Rp {item.harga.toLocaleString("id-ID")}
                        </td>
                        <td className="p-2.5 text-right text-white font-bold font-mono">
                          {item.qty}
                        </td>
                        <td className="p-2.5 text-right text-sky-400 font-bold">
                          Rp {item.total.toLocaleString("id-ID")}
                        </td>
                        <td className="p-2.5 text-center pr-4">
                          <button
                            type="button"
                            onClick={() => handleHapusItemCart(item.sku)}
                            className="text-red-400 font-black text-xs px-1"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={handlePicuKonfirmasi}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-lg text-xs uppercase tracking-widest shadow-xl transition-all"
              >
                💾 Simpan & Validasi Nota POS
              </button>
            )}
          </div>

          {/* TABEL JURNAL ARSIP BERKAS SEJARAH TRANSAKSI POS */}
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                📋 Histori Jurnal POS (Sesi Berjalan)
              </h3>
              <input
                type="text"
                placeholder="Cari faktur / pelanggan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#15171c] border border-gray-800 rounded-lg px-3 py-1 text-xs text-gray-300 focus:outline-none w-44"
              />
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-800/60 max-h-40 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#15171c] text-gray-400 text-[10px] border-b border-gray-800">
                    <th className="p-2.5 pl-4">No. Invoice</th>
                    <th className="p-2.5">Tanggal</th>
                    <th className="p-2.5">Pelanggan Toko</th>
                    <th className="p-2.5 text-center">Metode</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5 text-right pr-4">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-xs font-medium">
                  {filteredArsip.map((pos) => (
                    <tr key={pos.id} className="hover:bg-[#1d2029]/30">
                      <td className="p-2.5 pl-4 font-mono text-amber-500 font-bold">
                        {pos.nomorInvoice}
                      </td>
                      <td className="p-2.5 text-gray-500 font-mono">
                        {pos.tanggal}
                      </td>
                      <td className="p-2.5 text-gray-200">{pos.pelanggan}</td>
                      <td className="p-2.5 text-center text-gray-400 text-[10px] font-mono">
                        {pos.metodeBayar}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wide border uppercase ${
                            pos.status === "Lunas"
                              ? "bg-emerald-950 text-emerald-400 border-emerald-900/60"
                              : "bg-amber-950 text-amber-400 border-amber-900/60"
                          }`}
                        >
                          {pos.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-black text-sky-400 font-mono pr-4">
                        Rp {pos.grandTotal.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {dataAkanDisimpan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-emerald-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-xl">📝</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Validasi Penjualan POS
              </h3>
            </div>
            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Apakah Anda ingin mengunci nota transaksi kasir{" "}
              <span className="font-mono font-bold text-emerald-400">
                "{dataAkanDisimpan.nomorInvoice}"
              </span>{" "}
              atas nama{" "}
              <span className="text-white font-bold">
                {dataAkanDisimpan.pelanggan}
              </span>
              ? Bundel data multi-item ini siap dikirim ke backend Django untuk
              memicu file FPDF.
            </div>
            <div className="bg-[#15171c] p-3 rounded-lg text-xs space-y-1.5 border border-gray-800 font-medium">
              <div className="flex justify-between">
                <span className="text-gray-500">Metode / Status:</span>
                <span className="text-white font-bold">
                  {dataAkanDisimpan.metodeBayar} ({dataAkanDisimpan.status})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Jumlah Macam Barang:</span>
                <span className="text-white font-bold">
                  {dataAkanDisimpan.items.length} Item
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-800/60 pt-1.5 mt-1">
                <span className="text-gray-500">Total Tagihan Kasir:</span>
                <span className="text-sky-400 font-black font-mono">
                  Rp {dataAkanDisimpan.grandTotal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <div className="flex gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDataAkanDisimpan(null)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-bold"
              >
                Batal / Cek Ulang
              </button>
              <button
                type="button"
                onClick={handleEksekusiSimpan}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-bold shadow-lg"
              >
                Ya, Amankan Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
