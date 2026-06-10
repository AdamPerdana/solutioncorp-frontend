import React, { useState } from "react";

export default function Hutang() {
  const [daftarHutang, setDaftarHutang] = useState([
    {
      id: 1,
      nomorPO: "PO-20260601-004",
      supplier: "PT. Pakubumi Kimia Industri",
      tanggalPO: "2026-06-01",
      deskripsiBarang: "Bahan Baku Gel Methanol Pxton",
      totalTagihan: 45000000,
      sisaHutang: 45000000,
      statusHutang: "Belum Lunas",
    },
    {
      id: 2,
      nomorPO: "PO-20260525-001",
      supplier: "Pabrik Kaleng Kemasan Lestari",
      tanggalPO: "2026-05-25",
      deskripsiBarang: "10.000 Pcs Kaleng Sterno Kosong",
      totalTagihan: 18500000,
      sisaHutang: 18500000,
      statusHutang: "On Process",
    },
    {
      id: 3,
      nomorPO: "PO-20260420-015",
      supplier: "Distributor Karton Box Jakarta",
      tanggalPO: "2026-04-20",
      deskripsiBarang: "Kardus Packing Master Box",
      totalTagihan: 4200000,
      sisaHutang: 4200000,
      statusHutang: "Belum Lunas",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [hutangAkanDiproses, setHutangAkanDiproses] = useState(null);
  const [hutangAkanDilunasi, setHutangAkanDilunasi] = useState(null);

  const hitungHariCounter = (tanggalPO, statusHutang) => {
    if (statusHutang === "Lunas") return "-";
    const tglAwal = new Date(tanggalPO);
    const tglSekarang = new Date();

    const selisihWaktu = tglSekarang.getTime() - tglAwal.getTime();
    const selisihHari = Math.floor(selisihWaktu / (1000 * 3600 * 24));

    return selisihHari < 0 ? 0 : selisihHari;
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleEksekusiProcess = () => {
    if (!hutangAkanDiproses) return;
    setDaftarHutang((prevList) =>
      prevList.map((item) =>
        item.id === hutangAkanDiproses.id
          ? { ...item, statusHutang: "On Process" }
          : item,
      ),
    );
    setHutangAkanDiproses(null);
  };

  const handleEksekusiPelunasanFull = () => {
    if (!hutangAkanDilunasi) return;
    setDaftarHutang((prevList) =>
      prevList.map((item) =>
        item.id === hutangAkanDilunasi.id
          ? { ...item, sisaHutang: 0, statusHutang: "Lunas" }
          : item,
      ),
    );
    setHutangAkanDilunasi(null);
  };

  const processedData = React.useMemo(() => {
    let filteredResults = daftarHutang.filter(
      (item) =>
        item.nomorPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (filterStatus !== "Semua Status") {
      filteredResults = filteredResults.filter(
        (item) =>
          item.statusHutang.toUpperCase() === filterStatus.toUpperCase(),
      );
    }

    if (sortConfig.key !== null) {
      filteredResults.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key])
          return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key])
          return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filteredResults;
  }, [daftarHutang, searchTerm, filterStatus, sortConfig]);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return " ↕";
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };

  const totalHutangAktif = daftarHutang.reduce(
    (sum, item) => sum + (item.statusHutang !== "Lunas" ? item.sisaHutang : 0),
    0,
  );

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">Hutang</h2>
      </div>

      {/* PANELRINGKASAN UTAMA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Total Hutang Berjalan
          </p>
          <p className="text-xl font-black text-rose-400 mt-1">
            Rp {totalHutangAktif.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Total Invoice PO Pending
          </p>
          <p className="text-xl font-black text-white mt-1">
            {daftarHutang.filter((i) => i.statusHutang !== "Lunas").length} PO
            Supplier
          </p>
        </div>
      </div>

      {/* FILTER PENCARIAN DROPDOWN */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
        <div className="relative w-full flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari berdasarkan nomor PO atau nama supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1c23] border border-emerald-500/30 rounded-lg pl-9 pr-4 py-2.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full sm:w-44 bg-[#1a1c23] border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-amber-500/90 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="Semua Status">Semua Status</option>
          <option value="Belum Lunas">Belum Lunas</option>
          <option value="On Process">On Process</option>
          <option value="Lunas">Lunas</option>
        </select>
      </div>

      {/* TABEL DATA HUTANG */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-800/80 bg-[#15171c]/50 text-gray-400 select-none">
                <th
                  onClick={() => handleSort("nomorPO")}
                  className="p-4 font-bold text-blue-500 cursor-pointer hover:bg-[#1d2029]"
                >
                  Nomor PO{getSortIcon("nomorPO")}
                </th>
                <th
                  onClick={() => handleSort("supplier")}
                  className="p-4 font-bold text-blue-500 cursor-pointer hover:bg-[#1d2029]"
                >
                  Supplier{getSortIcon("supplier")}
                </th>
                <th
                  onClick={() => handleSort("tanggalPO")}
                  className="p-4 font-bold text-blue-500 cursor-pointer hover:bg-[#1d2029]"
                >
                  Tgl PO{getSortIcon("tanggalPO")}
                </th>
                <th className="p-4 font-bold text-blue-500">
                  Isi Deskripsi Barang
                </th>

                <th className="p-4 font-bold text-blue-500 text-center">
                  Umur Nota
                </th>

                <th className="p-4 font-bold text-blue-500 text-center">
                  Status
                </th>
                <th
                  onClick={() => handleSort("totalTagihan")}
                  className="p-4 font-bold text-blue-500 text-right cursor-pointer hover:bg-[#1d2029]"
                >
                  Total Tagihan
                </th>
                <th className="p-4 font-bold text-blue-500 text-center">
                  Aksi Kerja
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-medium text-gray-300">
              {processedData.map((item) => {
                const hariBerjalan = hitungHariCounter(
                  item.tanggalPO,
                  item.statusHutang,
                );

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-[#1d2029]/60 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-blue-400">
                      {item.nomorPO}
                    </td>
                    <td className="p-4 font-semibold text-gray-200">
                      {item.supplier}
                    </td>
                    <td className="p-4 text-gray-400 whitespace-nowrap">
                      {item.tanggalPO}
                    </td>
                    <td className="p-4 text-gray-400 max-w-xs truncate">
                      {item.deskripsiBarang}
                    </td>

                    {/* VISUALISASI WARNA TEXT COUNTER HARI (DI ATAS 30 HARI OTOMATIS MERAH) */}
                    <td className="p-4 text-center font-bold tracking-wide">
                      {item.statusHutang === "Lunas" ? (
                        <span className="text-gray-600">-</span>
                      ) : (
                        <span
                          className={
                            hariBerjalan > 30
                              ? "text-red-500 animate-pulse text-sm font-black"
                              : "text-amber-400"
                          }
                        >
                          {hariBerjalan} Hari
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.statusHutang === "Lunas"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                            : item.statusHutang === "On Process"
                              ? "bg-sky-950 text-sky-400 border border-sky-900"
                              : "bg-amber-950 text-amber-400 border border-amber-900"
                        }`}
                      >
                        {item.statusHutang === "Lunas"
                          ? "✅ LUNAS"
                          : item.statusHutang}
                      </span>
                    </td>

                    <td className="p-4 text-right font-black text-white">
                      Rp {item.totalTagihan.toLocaleString("id-ID")}
                    </td>

                    <td className="p-4 text-center">
                      {item.statusHutang === "Belum Lunas" ? (
                        <button
                          type="button"
                          onClick={() => setHutangAkanDiproses(item)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1 rounded text-[11px] transition-all active:scale-95"
                        >
                          ⚡ Process
                        </button>
                      ) : item.statusHutang === "On Process" ? (
                        <button
                          type="button"
                          onClick={() => setHutangAkanDilunasi(item)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-[11px] transition-all active:scale-95"
                        >
                          💸 Set Lunas
                        </button>
                      ) : (
                        <span className="text-gray-600 text-[11px] font-medium">
                          Selesai Terbayar
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAHAP 1: KONFIRMASI PINDAH KE ON PROCESS */}
      {hutangAkanDiproses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-blue-500/30 rounded-xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">
              Ubah Status ke On Process?
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Tagihan{" "}
              <span className="font-mono text-white">
                {hutangAkanDiproses.nomorPO}
              </span>{" "}
              akan ditandai sedang dalam antrean proses pengeluaran dana
              akunting perusahaan.
            </p>
            <div className="flex gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setHutangAkanDiproses(null)}
                className="flex-1 bg-gray-800 text-gray-300 py-2 rounded-lg font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleEksekusiProcess}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold"
              >
                Ya, Proses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAHAP 2: WARNING SEBELUM SAVE LUNAS */}
      {hutangAkanDilunasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-red-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-rose-500">
              <span className="text-xl">⚠️</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Perhatian Pembayaran Hutang!
              </h3>
            </div>
            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Anda akan mengunci transaksi{" "}
              <span className="font-mono font-bold text-white">
                {hutangAkanDilunasi.nomorPO}
              </span>{" "}
              kepada supplier
              <span className="text-white font-bold">
                {" "}
                {hutangAkanDilunasi.supplier}
              </span>{" "}
              menjadi{" "}
              <span className="text-emerald-400 font-bold">LUNAS MUTLAK</span>.
            </div>
            <div className="bg-[#15171c] p-3.5 rounded-lg space-y-2 text-xs border border-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Tagihan Supplier:</span>
                <span className="text-gray-300 font-bold">
                  Rp {hutangAkanDilunasi.totalTagihan.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-800/60 pt-2 font-bold">
                <span className="text-gray-500">Uang Keluar Terbayar:</span>
                <span className="text-emerald-400 text-sm">
                  Rp {hutangAkanDilunasi.totalTagihan.toLocaleString("id-ID")}{" "}
                  (Full)
                </span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 italic">
              * Pastikan bukti transfer bank atau pencatatan kas keluar
              perusahaan sudah sukses dilakukan ke pihak supplier sebelum
              menyimpan lunas.
            </p>
            <div className="flex gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setHutangAkanDilunasi(null)}
                className="flex-1 bg-[#242731] text-gray-300 py-2.5 rounded-lg font-bold"
              >
                Batal / Cek Kembali
              </button>
              <button
                type="button"
                onClick={handleEksekusiPelunasanFull}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-bold shadow-lg shadow-emerald-950/20"
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
