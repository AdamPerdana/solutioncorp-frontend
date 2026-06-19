import React, { useState, useMemo, useEffect } from "react";
import { apiRequest } from "../../api";

export default function Dashboard() {
  // =========================================================
  // 1. STATE MANAGEMENT
  // =========================================================
  const [dataSemuaTransaksi, setDataSemuaTransaksi] = useState([]);
  const [masterHpp, setMasterHpp] = useState({});
  const [catatanBiaya, setCatatanBiaya] = useState([]);
  const [trenHarian, setTrenHarian] = useState([]);
  const [trenBulanan, setTrenBulanan] = useState([]);

  // State kontrol loading, error, dan filter tanggal
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tglMulai, setTglMulai] = useState("2026-01-01");
  const [tglSelesai, setTglSelesai] = useState("2026-12-31");

  const [sortConfig, setSortConfig] = useState({
    key: "peringkat",
    direction: "ascending",
  });
  const [sortCustConfig, setSortCustConfig] = useState({
    key: "pendapatan",
    direction: "descending",
  });

  // =========================================================
  // FETCH DATA DARI DJANGO BACKEND WITH JWT TOKENS
  // =========================================================
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 🔒 2. GANTI fetch mentah dengan apiRequest (URL depan dihilangkan, sisa endpoint ujungnya saja)
        const resData = await apiRequest(
          `/api/dashboard/?start_date=${tglMulai}&end_date=${tglSelesai}`,
        );

        if (resData) {
          setDataSemuaTransaksi(resData.transaksi || []);
          setMasterHpp(resData.master_hpp || {});
          setCatatanBiaya(resData.catatan_biaya || []);
          setTrenHarian(resData.tren_harian || []);
          setTrenBulanan(resData.tren_bulanan || []);
          setError(null);
        }
      } catch (err) {
        console.error("Gagal mengambil data dari Django:", err);
        setError(
          "Koneksi gagal, sesi login habis, atau server backend Django belum aktif.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [tglMulai, tglSelesai]);

  // =========================================================
  // 2. DATA & BREAKDOWN DISTRIBUTION CHANNELS
  // =========================================================
  const hitungSistemGlobal = useMemo(() => {
    if (dataSemuaTransaksi.length === 0) {
      return {
        totalOmset: 0,
        labaKotor: 0,
        labaBersih: 0,
        totalPengeluaran: 0,
        pctLabaKotor: "0.0",
        pctLabaBersih: "0.0",
        totalPesanan: 0,
        rataRataNilaiPesanan: 0,
        rankingProduk: [],
        channelLogs: [],
        analitikPelanggan: [],
      };
    }

    const totalOmset = dataSemuaTransaksi.reduce(
      (sum, tx) => sum + ((tx.grand_total || 0) - (tx.ongkir || 0)),
      0,
    );

    const totalPengeluaran = catatanBiaya.reduce(
      (sum, b) => sum + b.nominal,
      0,
    );

    let channelMarketplace = {
      nama: "Marketplace",
      produkTerjual: 0,
      pesanan: 0,
      pendapatan: 0,
      hpp: 0,
      labaKotor: 0,
      labaBersih: 0,
    };
    let channelOffline = {
      nama: "Offline",
      produkTerjual: 0,
      pesanan: 0,
      pendapatan: 0,
      hpp: 0,
      labaKotor: 0,
      labaBersih: 0,
    };
    let petaPelanggan = {};
    let petaProduk = {};
    let totalHppGlobal = 0;

    dataSemuaTransaksi.forEach((tx) => {
      const isMarketplace = tx.nomorInvoice.toUpperCase().startsWith("SETTLE");
      const omsetBersihInvoice = (tx.grand_total || 0) - (tx.ongkir || 0);

      let hppInvoice = 0;
      let totalQtyInvoice = 0;

      tx.items.forEach((item) => {
        const qty = item.qty || 0;
        const modalSatuan = masterHpp[item.sku] || 0;
        const hppTotalItem = qty * modalSatuan;

        hppInvoice += hppTotalItem;
        totalQtyInvoice += qty;

        if (!petaProduk[item.sku]) {
          petaProduk[item.sku] = {
            sku: item.sku,
            nama: item.nama,
            qty: 0,
            omset: 0,
            hppSatuan: modalSatuan,
          };
        }
        petaProduk[item.sku].qty += qty;
        petaProduk[item.sku].omset += item.total || 0;
      });

      totalHppGlobal += hppInvoice;
      const labaKotorInvoice = omsetBersihInvoice - hppInvoice;

      if (isMarketplace) {
        channelMarketplace.pesanan += 1;
        channelMarketplace.produkTerjual += totalQtyInvoice;
        channelMarketplace.pendapatan += omsetBersihInvoice;
        channelMarketplace.hpp += hppInvoice;
        channelMarketplace.labaKotor += labaKotorInvoice;
        channelMarketplace.labaBersih += labaKotorInvoice;
      } else {
        channelOffline.pesanan += 1;
        channelOffline.produkTerjual += totalQtyInvoice;
        channelOffline.pendapatan += omsetBersihInvoice;
        channelOffline.hpp += hppInvoice;
        channelOffline.labaKotor += labaKotorInvoice;
        channelOffline.labaBersih += labaKotorInvoice;
      }

      const namaCust = tx.pelanggan || "Umum / Loket";
      if (!petaPelanggan[namaCust]) {
        petaPelanggan[namaCust] = {
          nama: namaCust,
          pendapatan: 0,
          labaKotor: 0,
          labaBersih: 0,
        };
      }
      petaPelanggan[namaCust].pendapatan += omsetBersihInvoice;
      petaPelanggan[namaCust].labaKotor += labaKotorInvoice;
      petaPelanggan[namaCust].labaBersih += labaKotorInvoice;
    });

    const labaKotor = totalOmset - totalHppGlobal;
    const labaBersih = labaKotor - totalPengeluaran;
    const pctLabaKotor =
      totalOmset > 0 ? ((labaKotor / totalOmset) * 100).toFixed(1) : "0.0";
    const pctLabaBersih =
      totalOmset > 0 ? ((labaBersih / totalOmset) * 100).toFixed(1) : "0.0";
    const totalPesanan = dataSemuaTransaksi.length;
    const rataRataNilaiPesanan =
      totalPesanan > 0 ? Math.round(totalOmset / totalPesanan) : 0;

    let produkOlah = Object.values(petaProduk).map((prod) => {
      const labaKotorProd = prod.omset - prod.qty * prod.hppSatuan;
      return {
        ...prod,
        pendapatan: prod.omset,
        labaKotorProd,
        labaBersihProd: labaKotorProd,
        pctLabaBersihProd:
          prod.omset > 0
            ? parseFloat(((labaKotorProd / prod.omset) * 100).toFixed(1))
            : 0,
      };
    });

    if (sortConfig.key !== null) {
      produkOlah.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (typeof valA === "string")
          return sortConfig.direction === "ascending"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        return sortConfig.direction === "ascending" ? valA - valB : valB - valA;
      });
    }
    produkOlah = produkOlah.map((prod, index) => ({
      ...prod,
      peringkat: index + 1,
    }));

    let pelangganOlah = Object.values(petaPelanggan);
    if (sortCustConfig.key !== null) {
      pelangganOlah.sort((a, b) => {
        let valA = a[sortCustConfig.key];
        let valB = b[sortCustConfig.key];
        if (typeof valA === "string")
          return sortCustConfig.direction === "ascending"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        return sortCustConfig.direction === "ascending"
          ? valA - valB
          : valB - valA;
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
      channelLogs: [channelMarketplace, channelOffline],
      analitikPelanggan: pelangganOlah,
    };
  }, [dataSemuaTransaksi, masterHpp, catatanBiaya, sortConfig, sortCustConfig]);

  // =========================================================
  // 3. RENDER COMPONENTS
  // =========================================================

  const RenderHeader = () => (
    <div className="pb-4 border-b border-gray-800 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 font-sans text-gray-300 select-none">
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide">
          📊 Analitik Global
        </h2>
      </div>
      <div className="flex flex-wrap items-center gap-4 bg-[#1a1c23] border border-gray-800 p-3 rounded-xl shadow-xl text-xs w-full md:w-auto">
        <div>
          <label className="block text-gray-500 mb-1 font-semibold">
            Mulai Tanggal
          </label>
          <input
            type="date"
            value={tglMulai}
            onChange={(e) => setTglMulai(e.target.value)}
            className="bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono text-[11px] font-bold focus:outline-none focus:border-blue-500 [color-scheme:dark]"
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
            className="bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono text-[11px] font-bold focus:outline-none focus:border-blue-500 [color-scheme:dark]"
          />
        </div>
      </div>
    </div>
  );

  const RenderKpiUtama = () => (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6 font-sans">
      <div className="bg-[#1a1c23] border border-gray-800 p-4 rounded-xl flex flex-col justify-between">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
          TOTAL OMSET
        </span>
        <p className="text-lg font-bold text-blue-500 font-mono mt-2">
          Rp {hitungSistemGlobal.totalOmset.toLocaleString("id-ID")}
        </p>
      </div>
      <div className="bg-[#1a1c23] border border-gray-800 p-4 rounded-xl flex flex-col justify-between">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
          LABA KOTOR
        </span>
        <p className="text-lg font-bold text-emerald-500 font-mono mt-2">
          Rp {hitungSistemGlobal.labaKotor.toLocaleString("id-ID")}
        </p>
      </div>
      <div className="bg-[#1a1c23] border border-gray-800 p-4 rounded-xl flex flex-col justify-between">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
          LABA BERSIH
        </span>
        <p className="text-lg font-bold text-emerald-500 font-mono mt-2">
          Rp {hitungSistemGlobal.labaBersih.toLocaleString("id-ID")}
        </p>
      </div>
      <div className="bg-[#1a1c23] border border-gray-800 p-4 rounded-xl flex flex-col justify-between">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
          PENGELUARAN
        </span>
        <p className="text-lg font-bold text-rose-500 font-mono mt-2">
          Rp {hitungSistemGlobal.totalPengeluaran.toLocaleString("id-ID")}
        </p>
      </div>
      <div className="bg-[#1a1c23] border border-gray-800 p-4 rounded-xl flex flex-col justify-between">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
          % LABA KOTOR
        </span>
        <p className="text-lg font-bold text-sky-400 font-mono mt-2">
          {hitungSistemGlobal.pctLabaKotor}%
        </p>
      </div>
      <div className="bg-[#1a1c23] border border-gray-800 p-4 rounded-xl flex flex-col justify-between">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
          % LABA BERSIH
        </span>
        <p className="text-lg font-bold text-sky-400 font-mono mt-2">
          {hitungSistemGlobal.pctLabaBersih}%
        </p>
      </div>
    </div>
  );

  const RenderAnalisisProduk = () => {
    const requestSort = (key) => {
      let direction = "ascending";
      if (sortConfig.key === key && sortConfig.direction === "ascending")
        direction = "descending";
      setSortConfig({ key, direction });
    };
    return (
      <div className="space-y-2 mb-6 font-sans">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Analisis Performa Produk
        </p>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#15171c] border-b border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider select-none">
                <th
                  onClick={() => requestSort("peringkat")}
                  className="p-3 text-center cursor-pointer hover:bg-[#202430]"
                >
                  Peringkat
                </th>
                <th
                  onClick={() => requestSort("nama")}
                  className="p-3 cursor-pointer hover:bg-[#202430]"
                >
                  Nama Produk
                </th>
                <th
                  onClick={() => requestSort("qty")}
                  className="p-3 text-center cursor-pointer hover:bg-[#202430]"
                >
                  Volume Terjual
                </th>
                <th
                  onClick={() => requestSort("pendapatan")}
                  className="p-3 text-right cursor-pointer hover:bg-[#202430]"
                >
                  Pendapatan
                </th>
                <th
                  onClick={() => requestSort("labaKotorProd")}
                  className="p-3 text-right cursor-pointer hover:bg-[#202430]"
                >
                  Laba Kotor
                </th>
                <th
                  onClick={() => requestSort("labaBersihProd")}
                  className="p-3 text-right cursor-pointer hover:bg-[#202430]"
                >
                  Laba Bersih
                </th>
                <th
                  onClick={() => requestSort("pctLabaBersihProd")}
                  className="p-3 text-center cursor-pointer hover:bg-[#202430]"
                >
                  % Margin
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
                  <td className="p-3 text-white font-semibold">{item.nama}</td>
                  <td className="p-3 text-center font-mono text-gray-400">
                    {item.qty.toLocaleString("id-ID")} Pcs
                  </td>
                  <td className="p-3 text-right font-mono text-gray-300">
                    Rp {item.pendapatan.toLocaleString("id-ID")}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-500">
                    Rp {item.labaKotorProd.toLocaleString("id-ID")}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-500">
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
    );
  };

  const RenderBreakdownChannel = () => (
    <div className="space-y-2 mb-6 font-sans">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
        ANALISIS PERFORMA TOKO
      </p>
      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#15171c] border-b border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider select-none">
              <th className="p-3 text-center">Toko</th>
              <th className="p-3 text-center">Jumlah Nota</th>
              <th className="p-3 text-center">Volume Produk</th>
              <th className="p-3 text-right">Pendapatan Bersih</th>
              <th className="p-3 text-right">Total HPP Modal</th>
              <th className="p-3 text-right">Laba Kotor Channel</th>
              <th className="p-3 text-right">Laba Bersih Channel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-medium">
            {hitungSistemGlobal.channelLogs.map((ch, idx) => (
              <tr key={idx} className="hover:bg-[#202430]/20 transition-colors">
                <td className="p-3 text-white font-bold">{ch.nama}</td>
                <td className="p-3 text-center font-mono text-gray-400">
                  {ch.pesanan} Invoice
                </td>
                <td className="p-3 text-center font-mono text-gray-400">
                  {ch.produkTerjual.toLocaleString("id-ID")} Pcs
                </td>
                <td className="p-3 text-right font-mono text-gray-300">
                  Rp {ch.pendapatan.toLocaleString("id-ID")}
                </td>
                <td className="p-3 text-right font-mono text-rose-400">
                  Rp {ch.hpp.toLocaleString("id-ID")}
                </td>
                <td className="p-3 text-right font-mono text-emerald-400 font-bold">
                  Rp {ch.labaKotor.toLocaleString("id-ID")}
                </td>
                <td className="p-3 text-right font-mono text-emerald-400 font-bold">
                  Rp {ch.labaBersih.toLocaleString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const RenderAnalitikPelanggan = () => {
    const requestCustSort = (key) => {
      let direction = "ascending";
      if (
        sortCustConfig.key === key &&
        sortCustConfig.direction === "ascending"
      )
        direction = "descending";
      setSortCustConfig({ key, direction });
    };
    return (
      <div className="space-y-2 mb-6 font-sans">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Analitik Pelanggan
        </p>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#15171c] border-b border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider select-none">
                <th
                  onClick={() => requestCustSort("nama")}
                  className="p-3 cursor-pointer hover:bg-[#202430]"
                >
                  Nama Pelanggan
                </th>
                <th
                  onClick={() => requestCustSort("pendapatan")}
                  className="p-3 text-right cursor-pointer hover:bg-[#202430]"
                >
                  Kontribusi Pendapatan
                </th>
                <th
                  onClick={() => requestCustSort("labaKotor")}
                  className="p-3 text-right cursor-pointer hover:bg-[#202430]"
                >
                  Laba Kotor Margin
                </th>
                <th
                  onClick={() => requestCustSort("labaBersih")}
                  className="p-3 text-right cursor-pointer hover:bg-[#202430]"
                >
                  Laba Bersih Kontribusi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-medium">
              {hitungSistemGlobal.analitikPelanggan.map((cust, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-[#202430]/20 transition-colors"
                >
                  <td className="p-3 text-white font-bold">{cust.nama}</td>
                  <td className="p-3 text-right font-mono text-gray-300">
                    Rp {cust.pendapatan.toLocaleString("id-ID")}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-500">
                    Rp {cust.labaKotor.toLocaleString("id-ID")}
                  </td>
                  <td className="p-3 text-right font-mono text-sky-400 font-black">
                    Rp {cust.labaBersih.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-4 min-h-[140px] flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-gray-500 uppercase">
                  Total Pesanan
                </span>
                <p className="text-base font-bold text-white mt-0.5">
                  {hitungSistemGlobal.totalPesanan} Order
                </p>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">
                  Rata-rata Nilai Pesanan
                </span>
                <p className="text-base font-bold text-blue-400 font-mono mt-0.5">
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
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-2 text-xs font-medium min-h-[140px] flex flex-col justify-center">
            <div className="flex justify-between items-center text-rose-400 font-bold border-b border-gray-800 pb-1 mb-1">
              <span className="uppercase text-[10px]">
                Total Pengeluaran Kas
              </span>
              <span className="font-mono">
                Rp {hitungSistemGlobal.totalPengeluaran.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Transport</span>
              <span className="font-mono text-white">
                Rp {transport.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Keperluan gudang</span>
              <span className="font-mono text-white">
                Rp {gudang.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Biaya Iklan</span>
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
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4">
            Data Penjualan Harian Global (Bulan Ini)
          </p>
          <div className="flex items-end justify-between gap-[2px] h-40 border-b border-gray-800 px-1 pb-1 bg-[#15171c]/30 rounded-lg">
            {trenHarian.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center flex-1 group relative h-full justify-end"
              >
                <div className="absolute bottom-full mb-2 bg-[#262932] border border-gray-700 text-white font-mono text-[9px] py-1 px-2 rounded dynamic-tooltip opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  Rp {item.sales.toLocaleString("id-ID")}
                </div>
                <div
                  style={{
                    height: `${(item.sales / maxHari) * 100}%`,
                    background:
                      "linear-gradient(180deg, #3b82f6 0%, #1e3a8a 100%)",
                  }}
                  className="w-full max-w-[12px] rounded-t cursor-pointer"
                />
                <span className="text-[8px] text-gray-500 font-mono absolute top-full mt-1">
                  {idx % 2 === 0 ? item.tgl : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4">
            Performa Bulanan Global (1 Tahun)
          </p>
          <div className="flex items-end justify-between gap-1 h-40 border-b border-gray-800 px-2 pb-1 bg-[#15171c]/30 rounded-lg">
            {trenBulanan.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center flex-1 group relative h-full justify-end"
              >
                <div className="absolute bottom-full mb-2 bg-[#262932] border border-gray-700 text-white font-mono text-[9px] py-1 px-2 rounded dynamic-tooltip opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  Rp {item.sales.toLocaleString("id-ID")}
                </div>
                <div
                  style={{
                    height: `${(item.sales / maxBulan) * 100}%`,
                    background:
                      "linear-gradient(180deg, #10b981 0%, #064e3b 100%)",
                  }}
                  className="w-full max-w-[30px] rounded-t cursor-pointer"
                />
                <span className="text-[9px] text-gray-500 font-mono absolute top-full mt-1">
                  {item.bulan}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // LAYAR PROTEKSI KONDISI ASINKRONUS (LOADING & ERROR HANDLER)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#15171c] text-white font-sans">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-gray-500 animate-pulse">
            Memuat data analitik dari server Django...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#15171c] text-rose-400 font-sans p-6">
        <div className="bg-[#1a1c23] border border-rose-900/50 p-6 rounded-xl max-w-md text-center shadow-2xl space-y-3">
          <p className="text-2xl">⚠️</p>
          <h3 className="text-sm font-bold text-white">
            Terjadi Kendala Koneksi
          </h3>
          <p className="text-xs text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-[11px] bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Coba Muat Ulang Halaman
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 font-sans select-none space-y-6">
      <RenderHeader />
      <RenderKpiUtama />
      <RenderAnalisisProduk />
      <RenderBreakdownChannel />
      <RenderAnalitikPelanggan />
      <RenderOperasionalDanBeban />
      <RenderDuaGrafikGlobal />
    </div>
  );
}
