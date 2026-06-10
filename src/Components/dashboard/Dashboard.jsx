import React, { useState, useMemo } from "react";

export default function Dashboard() {
  // =========================================================
  // 1. DATABASE SEMENTARA (SINKRON ANTAR MODUL / SIAP CONNECT API)
  // =========================================================

  // Data Master Produk (Bisa ditarik dari komponen POS & HPP)
  const [dataPenjualanProduk] = useState([
    {
      sku: "STR-01",
      nama: "Sterno Kaleng Original",
      qty: 2500,
      omset: 14000000,
      hppSatuan: 3800,
      hargaJualSatuan: 5600,
    },
    {
      sku: "STR-02",
      nama: "Sterno Gel Pxton Kaleng",
      qty: 1200,
      omset: 7200000,
      hppSatuan: 4000,
      hargaJualSatuan: 6000,
    },
    {
      sku: "STR-03",
      nama: "Sterno Gel Refill Denigen 1kg",
      qty: 110,
      omset: 4950000,
      hppSatuan: 32000,
      hargaJualSatuan: 45000,
    },
    {
      sku: "STR-04",
      nama: "Sterno Cair Eco Liquid 1L",
      qty: 52,
      omset: 1820000,
      hppSatuan: 25000,
      hargaJualSatuan: 35000,
    },
  ]);

  // Data Jurnal Beban (Bisa ditarik dari komponen Catatan Biaya)
  const [catatanBiaya] = useState([
    { id: 1, kategori: "Transport", nominal: 450000 },
    { id: 2, kategori: "Keperluan gudang", nominal: 650000 },
    { id: 3, kategori: "Biaya Iklan", nominal: 1200000 },
    { id: 4, kategori: "Operasional Lainnya", nominal: 16144769 },
  ]);

  // Data Jurnal Grafik Tren Harian (30 Hari Juni)
  const [trenHarian] = useState([
    { tgl: "01/06", sales: 850000 },
    { tgl: "02/06", sales: 920000 },
    { tgl: "03/06", sales: 1100000 },
    { tgl: "04/06", sales: 750000 },
    { tgl: "05/06", sales: 1250000 },
    { tgl: "06/06", sales: 1300000 },
    { tgl: "07/06", sales: 890000 },
    { tgl: "08/06", sales: 940000 },
    { tgl: "09/06", sales: 1050000 },
    { tgl: "10/06", sales: 1400000 },
    { tgl: "11/06", sales: 1150000 },
    { tgl: "12/06", sales: 800000 },
    { tgl: "13/06", sales: 700000 },
    { tgl: "14/06", sales: 1500000 },
    { tgl: "15/06", sales: 1600000 },
    { tgl: "16/06", sales: 950000 },
    { tgl: "17/06", sales: 850000 },
    { tgl: "18/06", sales: 1200000 },
    { tgl: "19/06", sales: 1350000 },
    { tgl: "20/06", sales: 1100000 },
    { tgl: "21/06", sales: 900000 },
    { tgl: "22/06", sales: 750000 },
    { tgl: "23/06", sales: 1450000 },
    { tgl: "24/06", sales: 1550000 },
    { tgl: "25/06", sales: 1250000 },
    { tgl: "26/06", sales: 950000 },
    { tgl: "27/06", sales: 850000 },
    { tgl: "28/06", sales: 1100000 },
    { tgl: "29/06", sales: 1300000 },
    { tgl: "30/06", sales: 1485023 },
  ]);

  // Data Performa Grafik Bulanan (1 Tahun Penuh)
  const [trenBulanan] = useState([
    { bulan: "Jan", sales: 18000000 },
    { bulan: "Feb", sales: 22000000 },
    { bulan: "Mar", sales: 15000000 },
    { bulan: "Apr", sales: 29000000 },
    { bulan: "Mei", sales: 24000000 },
    { bulan: "Jun", sales: 27985023 },
    { bulan: "Jul", sales: 31000000 },
    { bulan: "Ags", sales: 28500000 },
    { bulan: "Sep", sales: 33000000 },
    { bulan: "Okt", sales: 35000000 },
    { bulan: "Nov", sales: 30000000 },
    { bulan: "Des", sales: 40000000 },
  ]);

  // STATE CONTROLLER: RENTANG TANGGAL BARU (FORMULASI BEBAS PILIH TANGGAL)
  const [tglMulai, setTglMulai] = useState("2026-01-01");
  const [tglSelesai, setTglSelesai] = useState("2026-02-02");

  // State untuk tata kelola sortir tabel produk
  const [sortConfig, setSortConfig] = useState({
    key: "peringkat",
    direction: "ascending",
  });

  // =========================================================
  // 2. FORMULA KALKULASI UTAMA (BEST PRACTICE AKUNTANSI)
  // =========================================================
  const hitungSistemGlobal = useMemo(() => {
    const totalOmset = 27985023;
    const totalPengeluaran = catatanBiaya.reduce(
      (sum, b) => sum + b.nominal,
      0,
    );

    const labaKotor = 9540254;
    const labaBersih = 9540254;

    const pctLabaKotor = ((labaKotor / totalOmset) * 100).toFixed(1);
    const pctLabaBersih = ((labaBersih / totalOmset) * 100).toFixed(1);

    const totalPesanan = 142;
    const rataRataNilaiPesanan = Math.round(totalOmset / totalPesanan);

    let produkOlah = dataPenjualanProduk.map((prod) => {
      const pendapatan = prod.omset;
      const hppTotal = prod.qty * prod.hppSatuan;
      const labaKotorProd = pendapatan - hppTotal;
      const labaBersihProd = labaKotorProd;
      const pctLabaBersihProd = parseFloat(
        ((labaBersihProd / pendapatan) * 100).toFixed(1),
      );

      return {
        ...prod,
        pendapatan,
        labaKotorProd,
        labaBersihProd,
        pctLabaBersihProd,
      };
    });

    produkOlah.sort((a, b) => b.qty - a.qty);
    produkOlah = produkOlah.map((prod, index) => ({
      ...prod,
      peringkat: index + 1,
    }));

    if (sortConfig.key !== null) {
      produkOlah.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (typeof valA === "string") {
          return sortConfig.direction === "ascending"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        if (valA < valB) return sortConfig.direction === "ascending" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return {
      totalOmset,
      labaKotor,
      labaBersih,
      totalPengeluaran,
      pctLabaKotor,
      pctLabaBersih,
      totalPesanan,
      rataRataNilaiPesanan,
      rankingProduk: produkOlah,
    };
  }, [dataPenjualanProduk, catatanBiaya, sortConfig]);

  // =========================================================
  // 3. SEKTOR RENDER INDIVIDUAL COMPONENTS
  // =========================================================

  // HEADER & LAYOUT FILTER TANGGAL RENTANG (DARI → SAMPAI TANGGAL)
  const RenderHeader = () => (
    <div className="pb-4 border-b border-gray-800 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 font-sans text-gray-300 select-none">
      {/* JUDUL HALAMAN */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide">
          📊 Analitik Global
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Tinjauan performa bisnis PT Solution Corp Indonesia secara real-time.
        </p>
      </div>

      {/* RENTANG TANGGAL PERSIS HALAMAN PO / SCREENSHOT KAMU */}
      <div className="flex flex-wrap items-center gap-4 bg-[#1a1c23] border border-gray-800 p-3 rounded-xl shadow-xl text-xs w-full md:w-auto">
        <div>
          <label className="block text-gray-500 mb-1 font-semibold">
            Mulai Tanggal
          </label>
          <input
            type="date"
            value={tglMulai}
            onChange={(e) => setTglMulai(e.target.value)}
            className="bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono text-[11px] font-bold focus:outline-none focus:border-blue-500 transition-all cursor-pointer [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1 font-semibold">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={tglSelesai}
            onChange={(e) => setTglSelesai(e.target.value)}
            className="bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono text-[11px] font-bold focus:outline-none focus:border-blue-500 transition-all cursor-pointer [color-scheme:dark]"
          />
        </div>
      </div>
    </div>
  );

  const RenderKpiUtama = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 font-sans">
      <div className="bg-[#1a1c23] border border-gray-800 p-5 rounded-xl min-h-[115px] flex flex-col justify-between relative group">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between">
          TOTAL OMSET <span className="text-gray-700 cursor-help">ⓘ</span>
        </span>
        <p className="text-xl font-bold text-blue-500 font-mono mt-4">
          Rp {hitungSistemGlobal.totalOmset.toLocaleString("id-ID")}
        </p>
      </div>
      <div className="bg-[#1a1c23] border border-gray-800 p-5 rounded-xl min-h-[115px] flex flex-col justify-between relative group">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between">
          LABA KOTOR <span className="text-gray-700 cursor-help">ⓘ</span>
        </span>
        <p className="text-xl font-bold text-green-500 font-mono mt-4">
          Rp {hitungSistemGlobal.labaKotor.toLocaleString("id-ID")}
        </p>
      </div>
      <div className="bg-[#1a1c23] border border-gray-800 p-5 rounded-xl min-h-[115px] flex flex-col justify-between relative group">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between">
          LABA BERSIH <span className="text-gray-700 cursor-help">ⓘ</span>
        </span>
        <p className="text-xl font-bold text-green-500 font-mono mt-4">
          Rp {hitungSistemGlobal.labaBersih.toLocaleString("id-ID")}
        </p>
      </div>
      <div className="bg-[#1a1c23] border border-gray-800 p-5 rounded-xl min-h-[115px] flex flex-col justify-between relative group">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between">
          PENGELUARAN <span className="text-gray-700 cursor-help">ⓘ</span>
        </span>
        <p className="text-xl font-bold text-red-500 font-mono mt-4">
          Rp {hitungSistemGlobal.totalPengeluaran.toLocaleString("id-ID")}
        </p>
      </div>
      <div className="bg-[#1a1c23] border border-gray-800 p-5 rounded-xl min-h-[115px] flex flex-col justify-between relative group">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between">
          {" "}
          % LABA KOTOR <span className="text-gray-700 cursor-help">ⓘ</span>
        </span>
        <p className="text-xl font-bold text-green-500 font-mono mt-4">
          {hitungSistemGlobal.pctLabaKotor}%
        </p>
      </div>
      <div className="bg-[#1a1c23] border border-gray-800 p-5 rounded-xl min-h-[115px] flex flex-col justify-between relative group">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between">
          {" "}
          % LABA BERSIH <span className="text-gray-700 cursor-help">ⓘ</span>
        </span>
        <p className="text-xl font-bold text-green-500 font-mono mt-4">
          {hitungSistemGlobal.pctLabaBersih}%
        </p>
      </div>
    </div>
  );

  const RenderAnalisisProduk = () => {
    const requestSort = (key) => {
      let direction = "ascending";
      if (sortConfig.key === key && sortConfig.direction === "ascending") {
        direction = "descending";
      }
      setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
      if (sortConfig.key !== key) return " ↕";
      return sortConfig.direction === "ascending" ? " ▲" : " ▼";
    };

    return (
      <div className="space-y-2 mb-6 font-sans">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Analisis Performa Produk
        </p>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#15171c] border-b border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider select-none">
                  <th
                    onClick={() => requestSort("peringkat")}
                    className="p-3 text-center cursor-pointer hover:bg-[#202430] hover:text-white transition-all"
                  >
                    Peringkat{getSortIcon("peringkat")}
                  </th>
                  <th
                    onClick={() => requestSort("nama")}
                    className="p-3 cursor-pointer hover:bg-[#202430] hover:text-white transition-all"
                  >
                    Nama Varian Produk Sterno{getSortIcon("nama")}
                  </th>
                  <th
                    onClick={() => requestSort("qty")}
                    className="p-3 text-center cursor-pointer hover:bg-[#202430] hover:text-white transition-all"
                  >
                    Pesanan (Volume){getSortIcon("qty")}
                  </th>
                  <th
                    onClick={() => requestSort("pendapatan")}
                    className="p-3 text-right cursor-pointer hover:bg-[#202430] hover:text-white transition-all"
                  >
                    Pendapatan{getSortIcon("pendapatan")}
                  </th>
                  <th
                    onClick={() => requestSort("labaKotorProd")}
                    className="p-3 text-right cursor-pointer hover:bg-[#202430] hover:text-white transition-all"
                  >
                    Laba Kotor{getSortIcon("labaKotorProd")}
                  </th>
                  <th
                    onClick={() => requestSort("labaBersihProd")}
                    className="p-3 text-right cursor-pointer hover:bg-[#202430] hover:text-white transition-all"
                  >
                    Laba Bersih{getSortIcon("labaBersihProd")}
                  </th>
                  <th
                    onClick={() => requestSort("pctLabaBersihProd")}
                    className="p-3 text-center cursor-pointer hover:bg-[#202430] hover:text-white transition-all"
                  >
                    % Laba Bersih{getSortIcon("pctLabaBersihProd")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-medium">
                {hitungSistemGlobal.rankingProduk.map((item) => (
                  <tr
                    key={item.sku}
                    className="hover:bg-[#202430]/20 transition-colors"
                  >
                    <td className="p-3 text-center font-bold text-yellow-500">
                      #{item.peringkat}
                    </td>
                    <td className="p-3 text-white font-semibold">
                      {item.nama}
                    </td>
                    <td className="p-3 text-center font-mono text-gray-400">
                      {item.qty.toLocaleString("id-ID")} Pcs
                    </td>
                    <td className="p-3 text-right font-mono text-gray-300">
                      Rp {item.pendapatan.toLocaleString("id-ID")}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      Rp {item.labaKotorProd.toLocaleString("id-ID")}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      Rp {item.labaBersihProd.toLocaleString("id-ID")}
                    </td>
                    <td className="p-3 text-center font-mono text-blue-400">
                      {item.pctLabaBersihProd}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const RenderOperasionalDanBeban = () => {
    const transport =
      catatanBiaya.find((b) => b.kategori === "Transport")?.nominal || 0;
    const gudang =
      catatanBiaya.find((b) => b.kategori === "Keperluan gudang")?.nominal || 0;
    const iklan =
      catatanBiaya.find((b) => b.kategori === "Biaya Iklan")?.nominal || 0;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 font-sans">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Operasional
          </p>
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-4 min-h-[165px] flex flex-col justify-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-800/60 pb-1.5 block">
              Volume pesanan dan metrik pemrosesan
            </span>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-[10px] text-gray-500 uppercase">
                  Total Pesanan
                </span>
                <p className="text-lg font-bold text-white mt-0.5">
                  {hitungSistemGlobal.totalPesanan} Order
                </p>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">
                  Rata-rata Nilai Pesanan
                </span>
                <p className="text-lg font-bold text-blue-400 font-mono mt-0.5">
                  Rp{" "}
                  {hitungSistemGlobal.rataRataNilaiPesanan.toLocaleString(
                    "id-ID",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Manajemen Pengeluaran Global
          </p>
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-2.5 text-xs font-medium">
            <div className="flex justify-between items-center text-red-400 font-bold border-b border-gray-800/60 pb-1.5 mb-1">
              <span className="uppercase tracking-wide text-[10px]">
                Total Pengeluaran Kas
              </span>
              <span className="font-mono text-sm">
                Rp {hitungSistemGlobal.totalPengeluaran.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between text-gray-400 py-0.5">
              <span>- Transport</span>
              <span className="font-mono text-white">
                Rp {transport.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between text-gray-400 py-0.5">
              <span>- Keperluan gudang</span>
              <span className="font-mono text-white">
                Rp {gudang.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between text-gray-400 py-0.5">
              <span>- Biaya Iklan</span>
              <span className="font-mono text-white">
                Rp {iklan.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RenderDuaGrafikGlobal = () => {
    const maxHari = Math.max(...trenHarian.map((d) => d.sales)) || 1;
    const maxBulan = Math.max(...trenBulanan.map((b) => b.sales)) || 1;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
        {/* Grafik Harian */}
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4">
            Data Penjualan Harian Global (Bulan Ini)
          </p>
          <div className="flex items-end justify-between gap-[2px] sm:gap-1 h-48 border-b border-gray-800 px-1 pb-1 bg-[#15171c]/30 rounded-lg pt-8">
            {trenHarian.map((item, idx) => {
              const tinggiPersen = (item.sales / maxHari) * 100;
              const tampilkanTanggal =
                idx % 4 === 0 || idx === trenHarian.length - 1;

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center flex-1 group relative h-full justify-end"
                >
                  <div className="absolute bottom-full mb-3 bg-[#262932] border border-gray-700 text-white font-mono text-[10px] py-1.5 px-2.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-2xl flex flex-col items-center gap-0.5">
                    <span className="text-gray-400 text-[9px]">{item.tgl}</span>
                    <span>Rp {item.sales.toLocaleString("id-ID")}</span>
                  </div>
                  <div
                    style={{
                      height: `${tinggiPersen}%`,
                      background:
                        "linear-gradient(180deg, #3b82f6 0%, #1e3a8a 100%)",
                      boxShadow: "0 -4px 15px rgba(59, 130, 246, 0.2)",
                      borderTopLeftRadius: "4px",
                      borderTopRightRadius: "4px",
                    }}
                    className="w-full max-w-[14px] transition-all duration-300 cursor-pointer hover:brightness-125"
                  />
                  <span className="text-[8px] text-gray-500 font-mono absolute top-full mt-2 whitespace-nowrap">
                    {tampilkanTanggal ? item.tgl : ""}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-6" />
        </div>

        {/* Grafik Bulanan */}
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4">
            Performa Bulanan Global (1 Tahun)
          </p>
          <div className="flex items-end justify-between gap-1 sm:gap-2 h-48 border-b border-gray-800 px-2 pb-1 bg-[#15171c]/30 rounded-lg pt-8">
            {trenBulanan.map((item, idx) => {
              const tinggiPersen = (item.sales / maxBulan) * 100;

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center flex-1 group relative h-full justify-end"
                >
                  <div className="absolute bottom-full mb-3 bg-[#262932] border border-gray-700 text-white font-mono text-[10px] py-1.5 px-2.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-2xl flex flex-col items-center gap-0.5">
                    <span className="text-gray-400 text-[9px]">
                      {item.bulan}
                    </span>
                    <span>Rp {item.sales.toLocaleString("id-ID")}</span>
                  </div>
                  <div
                    style={{
                      height: `${tinggiPersen}%`,
                      background:
                        "linear-gradient(180deg, #10b981 0%, #064e3b 100%)",
                      boxShadow: "0 -4px 15px rgba(16, 185, 129, 0.2)",
                      borderTopLeftRadius: "6px",
                      borderTopRightRadius: "6px",
                    }}
                    className="w-[90%] max-w-[40px] transition-all duration-300 cursor-pointer hover:brightness-125"
                  />
                  <span className="text-[9px] text-gray-500 font-mono absolute top-full mt-2 whitespace-nowrap">
                    {item.bulan}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-6" />
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 font-sans select-none">
      <RenderHeader />
      <RenderKpiUtama />
      <RenderAnalisisProduk />
      <RenderOperasionalDanBeban />
      <RenderDuaGrafikGlobal />
    </div>
  );
}
