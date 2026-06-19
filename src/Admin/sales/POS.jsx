import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import { apiRequest } from "../../api";
import "react-toastify/dist/ReactToastify.css";

export default function Pos() {
  // ==========================================================
  // [STATE MANAGEMENT & INITIALIZATION ]
  // ==========================================================

  const [produkGudang, setProdukGudang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [daftarCustomer, setDaftarCustomer] = useState([]);
  const [isTambahCustomerBaru, setIsTambahCustomerBaru] = useState(false);
  const [namaCustomerBaru, setNamaCustomerBaru] = useState("");
  const [alamat, setAlamat] = useState("");
  const [arsipPOS, setArsipPOS] = useState([]);
  const [cart, setCart] = useState([]);

  const [formData, setFormData] = useState({
    nomorInvoice: "",
    pelanggan: "",
    tanggal: new Date().toISOString().split("T")[0],
    metodeBayar: "TUNAI",
    jatahTempoHari: 0,
    jatuhTempo: new Date().toISOString().split("T")[0],
    status: "Lunas",
    ongkir: 0,
  });

  const [itemInput, setItemInput] = useState({
    selectedIndexProduk: "",
    qty: "",
    hargaCustom: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [dataAkanDisimpan, setDataAkanDisimpan] = useState(null);
  const [invoiceDitinjau, setInvoiceDitinjau] = useState(null);

  // ==========================================================
  // [ SINKRONISASI DATABASE & INTEGRASI DJANGO API]
  // ==========================================================

  useEffect(() => {
    fetchCustomerMaster();
    fetchHistoriSertaUrutanInvoice();
    fetchKatalogProdukGudang();
  }, []);

  const fetchCustomerMaster = async () => {
    try {
      const data = await apiRequest("/api/sales/customers/");
      if (data) setDaftarCustomer(data);
    } catch (error) {
      console.error("Error Fetching Master Customers:", error);
    }
  };

  const fetchHistoriSertaUrutanInvoice = async () => {
    try {
      const data = await apiRequest("/api/sales/pos-transactions/");
      if (data) {
        const dataDipetakan = data.map((item) => ({
          id: item.id,
          nomorInvoice: item.nomor_invoice,
          tanggal: item.tanggal,
          pelanggan: item.pelanggan,
          metodeBayar: item.metode_bayar,
          status: item.status,
          grandTotal: item.grand_total,
          alamat: item.alamat || "Melalui Loket Kasir POS Proyek",
          ongkir: item.ongkir || 0,
          items: item.items.map((it) => ({
            sku: it.sku,
            nama_produk: it.nama_produk,
            qty: it.qty,
            harga: it.harga,
            total: it.total,
          })),
        }));
        setArsipPOS(dataDipetakan);
        generateNomorInvoiceOtomatis();
      }
    } catch (error) {
      console.error("Gagal memuat histori transaksi:", error);
      generateNomorInvoiceOtomatis();
    }
  };

  const fetchKatalogProdukGudang = async () => {
    try {
      const data = await apiRequest("/api/inventory/products/");
      if (data) {
        const dataDipetakan = data.map((item) => ({
          id: item.id,
          sku: item.sku,
          nama: item.nama,
          harga: item.harga || item.harga_jual || 0,
          stokAktual: item.stok_aktual ?? item.stokAktual ?? 0,
          satuan: item.satuan,
        }));
        setProdukGudang(dataDipetakan);
      }
    } catch (error) {
      console.error("Gagal sinkronisasi katalog produk POS:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelectChange = (namaSelected) => {
    setFormData({ ...formData, pelanggan: namaSelected });
    const dataCust = daftarCustomer.find((c) => c.nama === namaSelected);
    if (dataCust && dataCust.alamat) {
      setAlamat(dataCust.alamat);
    } else {
      setAlamat("");
    }
  };

  const generateNomorInvoiceOtomatis = async () => {
    const tglSekarang = new Date();
    const tahun = tglSekarang.getFullYear();
    const bulan = String(tglSekarang.getMonth() + 1).padStart(2, "0");
    let jumlahTransaksiBulanIni = 0;

    try {
      const resData = await apiRequest(
        "/api/sales/pos-transactions/last-counter/",
      );
      if (resData) {
        jumlahTransaksiBulanIni = resData.counter;
      }
    } catch (error) {
      console.error("Gagal mengambil counter invoice terakhir:", error);
    }

    const nomorMulai = 10;
    const nomorUrutFinal = nomorMulai + jumlahTransaksiBulanIni;
    const stringUrutan = String(nomorUrutFinal).padStart(4, "0");

    setFormData((prev) => ({
      ...prev,
      nomorInvoice: `INV/${tahun}/${bulan}/${stringUrutan}`,
    }));
  };

  const hitungTanggalJatuhTempo = (tglAwal, jumlahHari) => {
    const hari = parseInt(jumlahHari) || 0;
    const tglBase = new Date(tglAwal || new Date());
    tglBase.setDate(tglBase.getDate() + hari);
    const yyyy = tglBase.getFullYear();
    const mm = String(tglBase.getMonth() + 1).padStart(2, "0");
    const dd = String(tglBase.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // ==========================================================
  // [ HANDLER & KONTROL INPUT WORKSPACE (POS)]
  // ==========================================================

  const handleProdukSelectChange = (indexStr) => {
    if (indexStr === "") {
      setItemInput({ selectedIndexProduk: "", qty: "", hargaCustom: "" });
      return;
    }
    const prod = produkGudang[indexStr];
    setItemInput({
      selectedIndexProduk: indexStr,
      qty: itemInput.qty || "",
      hargaCustom: prod.harga ? prod.harga.toString() : "0",
    });
  };

  const handleTambahKeKeranjang = (e) => {
    e.preventDefault();
    if (
      itemInput.selectedIndexProduk === "" ||
      !itemInput.qty ||
      !itemInput.hargaCustom
    ) {
      return toast.warning("Silakan lengkapi pilihan produk and kuantitas!");
    }

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
                total: (item.qty + kuantitas) * hargaJual,
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
    toast.success("Produk berhasil dimuat ke draf POS.", { autoClose: 1500 });
  };

  const handleHapusItemCart = (sku) => {
    setCart((prev) => prev.filter((item) => item.sku !== sku));
    toast.info("Item dikeluarkan dari keranjang.", { autoClose: 1500 });
  };

  const handleMetodeBayarChangeDirect = (metode) => {
    if (metode === "TUNAI") {
      setFormData((prev) => ({
        ...prev,
        metodeBayar: "TUNAI",
        status: "Lunas",
        jatahTempoHari: 0,
        jatuhTempo: prev.tanggal,
      }));
    } else if (metode === "PENDING") {
      setFormData((prev) => ({
        ...prev,
        metodeBayar: "TEMPO/KREDIT",
        status: "Tempo",
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

  const handleJatahHariInput = (hari) => {
    if (hari === "") {
      setFormData((prev) => ({
        ...prev,
        jatahTempoHari: "",
        jatuhTempo: prev.tanggal,
      }));
      return;
    }

    const jumlahHari = parseInt(hari) || 0;
    setFormData((prev) => ({
      ...prev,
      jatahTempoHari: jumlahHari,
      jatuhTempo: hitungTanggalJatuhTempo(prev.tanggal, jumlahHari),
    }));
  };

  const handleSimpanCustomerBaru = () => {
    if (namaCustomerBaru.trim() !== "") {
      const customObj = { id: Date.now(), nama: namaCustomerBaru.trim() };
      setDaftarCustomer((prev) => [...prev, customObj]);
      setFormData((prev) => ({ ...prev, pelanggan: customObj.nama }));
      setAlamat("");
      setIsTambahCustomerBaru(false);
      setNamaCustomerBaru("");
      toast.success("Pelanggan sementara berhasil ditentukan.");
    }
  };

  // ==========================================================
  // [ REAL-TIME VALUASI SUB-TOTAL & GRAND TOTAL]
  // ==========================================================

  const subtotalCart = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const grandTotalCart = useMemo(() => {
    return subtotalCart + (parseInt(formData.ongkir) || 0);
  }, [subtotalCart, formData.ongkir]);

  // ==========================================================
  // [ PRE-SAVE VALIDATION & BUNDLING PAYLOAD]
  // ==========================================================

  const handlePicuKonfirmasi = () => {
    if (!formData.nomorInvoice || formData.nomorInvoice.trim() === "") {
      return toast.error("Gagal! Nomor Invoice POS wajib diisi.");
    }
    if (!formData.pelanggan || formData.pelanggan === "") {
      return toast.error("Gagal! Pelanggan belum ditentukan.");
    }
    if (cart.length === 0) {
      return toast.error("Gagal! Keranjang belanja kasir masih kosong.");
    }

    const finalHariTempo =
      formData.jatahTempoHari === "" ? 0 : formData.jatahTempoHari;

    setDataAkanDisimpan({
      id: Date.now(),
      nomorInvoice: formData.nomorInvoice.trim().toUpperCase(),
      pelanggan: formData.pelanggan,
      alamat: alamat.trim() || "Melalui Loket Kasir POS Proyek",
      tanggal: formData.tanggal,
      metodeBayar: formData.metodeBayar,
      status: formData.status,
      ongkir: parseInt(formData.ongkir) || 0,
      grandTotal: grandTotalCart,
      items: cart,
      jatah_tempo_hari: finalHariTempo,
    });
  };

  // ==========================================================
  // [ASYNCHRONOUS POST MUTATION & STREAM BINARY PDF]
  // ==========================================================

  const handleEksekusiSimpan = async () => {
    if (!dataAkanDisimpan) return;

    const idToastPOS = toast.loading(
      "Sedang merekam data kasir dan menggambar Invoice resmi...",
    );

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        "http://127.0.0.1:8000/api/sales/pos-transactions/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(dataAkanDisimpan),
        },
      );

      if (!response.ok) {
        const errRes = await response.json().catch(() => ({}));

        if (errRes.error) {
          throw new Error(errRes.error);
        }
        if (errRes.nomor_invoice) {
          throw new Error("Nomor Invoice POS ini sudah terkunci di database!");
        }
        throw new Error("Gagal mengamankan nota ke database server.");
      }

      const buffer = await response.arrayBuffer();
      const pdfBlob = new Blob([buffer], { type: "application/pdf" });

      if (pdfBlob.size === 0) {
        throw new Error(
          "Gagal mencetak. Berkas cetakan biner yang diterima berukuran 0 byte.",
        );
      }

      const fileUrl = window.URL.createObjectURL(pdfBlob);
      const linkDownload = document.createElement("a");
      linkDownload.href = fileUrl;

      const namaPelanggan = dataAkanDisimpan.pelanggan;
      const tanggalTerbit = dataAkanDisimpan.tanggal;
      const namaAman = namaPelanggan.replace(/[/\\?%*:|"<>]/g, "-");

      linkDownload.download = `Invoice ${namaAman} ${tanggalTerbit}.pdf`;
      linkDownload.style.display = "none";
      document.body.appendChild(linkDownload);
      linkDownload.click();

      linkDownload.parentNode.removeChild(linkDownload);
      window.URL.revokeObjectURL(fileUrl);

      toast.update(idToastPOS, {
        render:
          "Sukses! Nota terkunci di database and Invoice PDF berhasil diunduh.",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setCart([]);
      setAlamat("");
      setFormData({
        nomorInvoice: "",
        pelanggan: "",
        tanggal: new Date().toISOString().split("T")[0],
        metodeBayar: "TUNAI",
        jatahTempoHari: 0,
        jatuhTempo: new Date().toISOString().split("T")[0],
        status: "Lunas",
        ongkir: 0,
      });
      setDataAkanDisimpan(null);

      fetchHistoriSertaUrutanInvoice();
      fetchKatalogProdukGudang();
    } catch (error) {
      toast.update(idToastPOS, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  const filteredArsip = arsipPOS.filter(
    (item) =>
      item.nomorInvoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pelanggan.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      <ToastContainer theme="dark" />

      {/* TITEL UTAMA */}
      <div className="pb-4 border-b border-gray-800 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Point of Sales (POS)
          </h2>
        </div>
      </div>

      {/* GRID RESPONSIVE WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* PANEL KIRI: FORM ENTRI */}
        <div className="xl:col-span-3 space-y-4">
          {/* BAGIAN 1: INFORMASI CUSTOMER */}
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
                  value={formData.nomorInvoice}
                  placeholder="Format: INV/2026/06/0010"
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
                    {isTambahCustomerBaru
                      ? "← List Database"
                      : "➕ Pembeli Baru"}
                  </button>
                </div>

                {isTambahCustomerBaru ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Nama PT/Toko..."
                      value={namaCustomerBaru}
                      onChange={(e) => setNamaCustomerBaru(e.target.value)}
                      className="flex-1 bg-[#15171c] border border-emerald-500/50 rounded-lg p-2 text-white focus:outline-none text-[11px] font-bold"
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
                    onChange={(e) => handleCustomerSelectChange(e.target.value)}
                    className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold focus:border-blue-500 focus:outline-none cursor-pointer text-[11px]"
                  >
                    <option value="">-- Pilih Customer --</option>
                    {daftarCustomer.map((cust, index) => (
                      <option key={index} value={cust.nama}>
                        {cust.nama}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
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
                    className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:outline-none text-[11px] [color-scheme:dark] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">
                    Status Nota
                  </label>
                  <div
                    className={`w-full font-bold rounded-lg p-2 text-center border uppercase tracking-wider text-[10px] select-none ${
                      formData.status === "Lunas"
                        ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
                        : "bg-amber-950/40 border-amber-800 text-amber-400"
                    }`}
                  >
                    {formData.status}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-1.5 select-none">
                  <button
                    type="button"
                    onClick={() => handleMetodeBayarChangeDirect("TUNAI")}
                    className={`py-1.5 text-center rounded-lg font-bold border text-[10px] uppercase transition-all ${
                      formData.metodeBayar === "TUNAI"
                        ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                        : "bg-[#15171c] border-gray-800 text-gray-500"
                    }`}
                  >
                    Tunai
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMetodeBayarChangeDirect("PENDING")}
                    className={`py-1.5 text-center rounded-lg font-bold border text-[10px] uppercase transition-all ${
                      formData.status === "Tempo" &&
                      formData.jatahTempoHari === 0 &&
                      formData.jatahTempoHari !== ""
                        ? "bg-rose-950 text-rose-400 border-rose-500/40"
                        : "bg-[#15171c] border-gray-800 text-gray-500"
                    }`}
                  >
                    Pending
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleMetodeBayarChangeDirect("TEMPO/KREDIT")
                    }
                    className={`py-1.5 text-center rounded-lg font-bold border text-[10px] uppercase transition-all ${
                      formData.status === "Tempo" &&
                      (formData.jatahTempoHari > 0 ||
                        formData.jatahTempoHari === "")
                        ? "bg-amber-950 text-amber-400 border-amber-500/40"
                        : "bg-[#15171c] border-gray-800 text-gray-500"
                    }`}
                  >
                    Tempo
                  </button>
                </div>
              </div>

              {formData.status === "Tempo" &&
                (formData.jatahTempoHari > 0 ||
                  formData.jatahTempoHari === "") && (
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
                        className="w-full bg-[#15171c]/40 border border-gray-800 rounded-lg p-1 text-gray-500 text-[10px] cursor-not-allowed font-mono text-center"
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

          {/* BAGIAN 2: SELECT KOMODITAS PRODUK */}
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
                      [{prod.sku}] - {prod.nama} (Stok: {prod.stokAktual} Pcs)
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
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-[11px] uppercase tracking-wider transition-all shadow-md active:scale-95"
            >
              ➕ Tambahkan Produk
            </button>
          </form>
        </div>

        {/* PANEL KANAN: PREVIEW & HISTORI */}
        <div className="xl:col-span-9 space-y-5">
          {/* MONITOR A: LIVE DRAFCART MEJA KASIR */}
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider select-none">
                🛒 POS
              </h3>
              <div className="text-right text-xs font-mono select-none">
                <span className="text-gray-500 mr-4">
                  Subtotal: Rp {subtotalCart.toLocaleString("id-ID")}
                </span>
                <span className="text-xs font-black text-white">
                  Grand Total:{" "}
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
                    <th className="p-2.5">Nama Produk</th>
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
                        className="p-6 text-center text-gray-500 bg-[#1a1c23] italic"
                      >
                        Isi formulir muat artikel di panel kiri.
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
                        <td className="p-2.5 text-center pr-4 select-none">
                          <button
                            type="button"
                            onClick={() => handleHapusItemCart(item.sku)}
                            className="text-gray-500 hover:text-red-500 font-black text-xs px-1 p-0.5 transition-colors"
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

            {cart.length > 0 && (
              <button
                type="button"
                onClick={handlePicuKonfirmasi}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-lg text-xs uppercase tracking-widest shadow-xl transition-all active:scale-[0.98]"
              >
                💾 Simpan & Cetak Invoice Penjualan
              </button>
            )}
          </div>

          {/* MONITOR B: LOG AKTIVITAS JURNAL HISTORI POS */}
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider select-none">
                📋 Aktivitas POS (Hari Ini)
              </h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari faktur / pelanggan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#15171c] border border-gray-800 rounded-lg pl-3 pr-3 py-1 text-xs text-gray-300 focus:outline-none focus:border-emerald-500 w-44"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-800/60 max-h-40 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#15171c] text-gray-400 text-[10px] border-b border-gray-800 select-none">
                    <th className="p-2.5 pl-4">No. Invoice</th>
                    <th className="p-2.5">Tanggal</th>
                    <th className="p-2.5">Pelanggan Toko</th>
                    <th className="p-2.5 text-center">Metode</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5 text-right pr-5">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-xs font-medium">
                  {filteredArsip.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-4 text-center text-gray-500 bg-[#1a1c23] italic"
                      >
                        Belum ada riwayat transaksi di database untuk hari ini.
                      </td>
                    </tr>
                  ) : (
                    filteredArsip.map((pos) => (
                      <tr
                        key={pos.id || pos.nomorInvoice}
                        onClick={() => setInvoiceDitinjau(pos)}
                        className="hover:bg-[#1d2029]/80 transition-colors cursor-pointer group"
                        title="Klik baris transaksi untuk meninjau detail item"
                      >
                        <td className="p-2.5 pl-4 font-mono text-amber-500 font-bold group-hover:underline">
                          {pos.nomorInvoice}
                        </td>
                        <td className="p-2.5 text-gray-500 font-mono">
                          {pos.tanggal}
                        </td>
                        <td className="p-2.5 text-gray-200 font-bold">
                          {pos.pelanggan}
                        </td>
                        <td className="p-2.5 text-center text-gray-400 text-[10px] font-mono">
                          {pos.metodeBayar}
                        </td>
                        <td className="p-2.5 text-center select-none">
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
                        <td className="p-2.5 text-right font-black text-sky-400 font-mono pr-5">
                          Rp {pos.grandTotal.toLocaleString("id-ID")}
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

      {/* ==========================================================
          [ POP-UP DIALOG MODAL VALIDATION (SI EMERALD) ]
          ========================================================== */}
      {dataAkanDisimpan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-emerald-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
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
              memproses penyimpanan permanen dan mencetak berkas.
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
                <span className="text-gray-500">Total Tagihan:</span>
                <span className="text-sky-400 font-black font-mono text-[13px]">
                  Rp {dataAkanDisimpan.grandTotal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2 text-xs select-none">
              <button
                type="button"
                onClick={() => setDataAkanDisimpan(null)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-bold transition-all"
              >
                Batal / Cek Ulang
              </button>
              <button
                type="button"
                onClick={handleEksekusiSimpan}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-bold shadow-lg transition-all"
              >
                Ya, Simpan & Cetak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          🌟 [ POP-UP MODAL: TINJAUAN RINCIAN ITEM BARANG TRANSAKSI POS HARI INI ]
          ========================================================== */}
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
                Rincian Item POS
              </h3>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                No Faktur: {invoiceDitinjau.nomorInvoice} | Tanggal Terbit:{" "}
                {invoiceDitinjau.tanggal}
              </p>
            </div>

            <div className="bg-[#15171c]/60 border border-gray-800/80 rounded-xl p-3.5 text-xs space-y-2">
              <div>
                <p className="text-[10px] text-gray-500 font-medium">
                  Customer:
                </p>
                <p className="text-white font-black text-sm mt-0.5">
                  {invoiceDitinjau.pelanggan}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-800/40">
                <p className="text-[10px] text-gray-500 font-medium">
                  Alamat Pengiriman:
                </p>
                <p className="text-gray-300 font-bold mt-0.5">
                  {invoiceDitinjau.alamat}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-800/40 flex justify-between items-center text-[11px]">
                <div>
                  <span className="text-gray-500">Metode Bayar:</span>
                  <span className="text-amber-400 font-black ml-1.5">
                    {invoiceDitinjau.metodeBayar} ({invoiceDitinjau.status})
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Ongkos Kirim:</span>
                  <span className="text-emerald-400 font-mono font-bold ml-1.5">
                    Rp {invoiceDitinjau.ongkir.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-800/50 max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#15171c] text-gray-400 border-b border-gray-800 text-[10px] font-bold select-none">
                    <th className="p-3 pl-4 w-[15%]">SKU</th>
                    <th className="p-3 w-[45%]">Nama Deskripsi Produk</th>
                    <th className="p-3 text-right w-[15%]">Harga Satuan</th>
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
                          Rp {item.harga.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3 text-center font-bold text-white font-mono">
                          {item.qty}
                        </td>
                        <td className="p-3 text-right pr-4 text-sky-400 font-bold font-mono">
                          Rp {item.total.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-gray-500">
                        Item rincian belanja kosong.
                      </td>
                    </tr>
                  )}
                  <tr className="bg-[#15171c]/80 text-xs font-black text-white">
                    <td colSpan="4" className="p-2.5 text-right text-gray-400">
                      GRAND TOTAL FAKTUR:
                    </td>
                    <td className="p-2.5 text-right pr-4 font-mono text-sm text-sky-400">
                      Rp {invoiceDitinjau.grandTotal.toLocaleString("id-ID")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInvoiceDitinjau(null)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all shadow-sm"
              >
                Tutup Rincian Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
