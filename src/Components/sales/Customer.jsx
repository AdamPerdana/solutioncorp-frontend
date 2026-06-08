import React, { useState } from "react";

export default function Customer() {
  // 1. Mock Data (Data Tiruan untuk testing tampilan)
  const mockCustomers = [
    {
      id: 1,
      kode: "CUST-001",
      nama: "PT Indofood Sukses Makmur",
      kontak: "Budi Santoso",
      telepon: "08123456789",
      wilayah: "Jakarta Pusat",
    },
    {
      id: 2,
      kode: "CUST-002",
      nama: "Hotel Mercure Kemayoran",
      kontak: "Siti Rahma",
      telepon: "08198765432",
      wilayah: "Jakarta Utara",
    },
    {
      id: 3,
      kode: "CUST-003",
      nama: "Resto Dapur Sunda",
      kontak: "Asep Sunandar",
      telepon: "08561234567",
      wilayah: "Jakarta Selatan",
    },
  ];

  // State untuk pencarian (Biar mockup-nya terasa hidup)
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="p-6 min-h-screen bg-[#15171c]">
      {/* HEADER UTAMA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-gray-800 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Database Pelanggan
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Kelola data profil, kontak, dan wilayah distribusi pelanggan.
          </p>
        </div>

        {/* Tombol Tambah */}
        <button className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-md shadow-emerald-950/20 active:scale-95">
          <span className="mr-2 text-sm">➕</span> Tambah Pelanggan
        </button>
      </div>

      {/* FILTER & PENCARIAN BAR */}
      <div className="my-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari nama pelanggan atau kode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1c23] border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        <select className="bg-[#1a1c23] border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-emerald-500">
          <option>Semua Wilayah</option>
          <option>Jakarta Pusat</option>
          <option>Jakarta Utara</option>
          <option>Jakarta Selatan</option>
        </select>
      </div>

      {/* TABEL DATA MOCKUP */}
      <div className="w-full bg-[#1a1c23] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#15171c]/60 border-b border-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Kode</th>
                <th className="py-3.5 px-4">Nama Pelanggan</th>
                <th className="py-3.5 px-4">PIC / Kontak</th>
                <th className="py-3.5 px-4">No. Telepon</th>
                <th className="py-3.5 px-4">Wilayah</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-xs text-gray-300">
              {mockCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-[#22252e]/40 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-emerald-400">
                    {customer.kode}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">
                    {customer.nama}
                  </td>
                  <td className="py-3 px-4 text-gray-400">{customer.kontak}</td>
                  <td className="py-3 px-4 text-gray-400">
                    {customer.telepon}
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-[#15171c] border border-gray-800 px-2 py-0.5 rounded text-[10px]">
                      {customer.wilayah}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        className="text-sm gray-500 hover:text-emerald-400 transition-colors"
                        title="Edit"
                      >
                        📝
                      </button>
                      <button
                        className="text-sm text-gray-500 hover:text-red-400 transition-colors"
                        title="Hapus"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER NAVIGASI HALAMAN (PAGINATION MOCKUP) */}
        <div className="p-4 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
          <p>Menampilkan 1-3 dari 3 Pelanggan</p>
          <div className="flex space-x-1">
            <button
              className="px-2.5 py-1 bg-[#15171c] border border-gray-800 rounded hover:text-white disabled:opacity-40"
              disabled
            >
              Prev
            </button>
            <button className="px-2.5 py-1 bg-emerald-600 text-white rounded">
              1
            </button>
            <button
              className="px-2.5 py-1 bg-[#15171c] border border-gray-800 rounded hover:text-white disabled:opacity-40"
              disabled
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
