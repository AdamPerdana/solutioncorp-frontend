import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { apiRequest } from "../../api";
import "react-toastify/dist/ReactToastify.css";

export default function Customer() {
  // ==========================================================
  // [STATE MANAGEMENT & INITIALIZATION ]
  // ==========================================================

  const [daftarCustomer, setDaftarCustomer] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formCustomer, setFormCustomer] = useState({
    nama: "",
    kontak: "",
    telepon: "",
    alamat: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [dataAkanDisimpan, setDataAkanDisimpan] = useState(null);
  const [dataAkanDihapus, setDataAkanDihapus] = useState(null);

  // ==========================================================
  // [DATA FETCHING WITH JWT AUTHORIZATION]
  // ==========================================================

  useEffect(() => {
    fetchCustomerDariBackend();
  }, []);

  const fetchCustomerDariBackend = async () => {
    try {
      const data = await apiRequest("/api/sales/customers/");
      if (data) {
        setDaftarCustomer(data);
      }
    } catch (error) {
      console.error("Error Fetching:", error);
      toast.error("Koneksi ke server backend Django terputus!");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // [FORM CONTROL & VALIDATION]
  // ==========================================================

  const handleEditClick = (item) => {
    setFormCustomer({
      nama: item.nama,
      kontak: item.kontak === "-" ? "" : item.kontak,
      telepon: item.telepon === "-" ? "" : item.telepon,
      alamat: item.alamat === "-" ? "" : item.alamat,
    });
    toast.info("Profil pelanggan dimuat ke form input.", { autoClose: 1500 });
  };

  const handlePicuKonfirmasi = (e) => {
    e.preventDefault();
    if (formCustomer.nama.trim() === "") {
      return toast.warning("Nama perusahaan / toko wajib diisi!");
    }

    const targetNama = formCustomer.nama.trim();
    const customerLama = daftarCustomer.find(
      (item) => item.nama.toLowerCase() === targetNama.toLowerCase(),
    );

    setDataAkanDisimpan({
      isUpdate: !!customerLama,
      id: customerLama ? customerLama.id : null,
      nama: targetNama,
      kontak: formCustomer.kontak.trim() || "-",
      telepon: formCustomer.telepon.trim() || "-",
      alamat: formCustomer.alamat.trim() || "-",
    });
  };

  // ==========================================================
  // [DATABASE MUTATION WITH JWT AUTHORIZATION]
  // ==========================================================

  const handleEksekusiSimpan = async () => {
    if (!dataAkanDisimpan) return;

    const idToastCust = toast.loading("Sedang mengamankan data rekanan...");

    const payload = {
      nama: dataAkanDisimpan.nama,
      kontak: dataAkanDisimpan.kontak,
      telepon: dataAkanDisimpan.telepon,
      alamat: dataAkanDisimpan.alamat,
    };

    try {
      if (dataAkanDisimpan.isUpdate) {
        const updatedData = await apiRequest(
          `/api/sales/customers/${dataAkanDisimpan.id}/`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );

        if (updatedData) {
          setDaftarCustomer((prev) =>
            prev.map((item) =>
              item.id === dataAkanDisimpan.id ? updatedData : item,
            ),
          );

          toast.update(idToastCust, {
            render: `Sukses memperbarui profil toko "${dataAkanDisimpan.nama}".`,
            type: "success",
            isLoading: false,
            autoClose: 3000,
          });
        }
      } else {
        const customerBaru = await apiRequest("/api/sales/customers/", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (customerBaru) {
          setDaftarCustomer((prev) => [customerBaru, ...prev]);

          toast.update(idToastCust, {
            render: `Sukses mendaftarkan customer "${dataAkanDisimpan.nama}".`,
            type: "success",
            isLoading: false,
            autoClose: 3000,
          });
        }
      }

      setFormCustomer({ nama: "", kontak: "", telepon: "", alamat: "" });
      setDataAkanDisimpan(null);
    } catch (error) {
      console.error("Error Saving:", error);
      toast.update(idToastCust, {
        render: "Gagal menyimpan data pelanggan ke server.",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  const handleEksekusiHapus = async () => {
    if (!dataAkanDihapus) return;

    const idToastHapus = toast.loading("Menghapus data pelanggan...");

    try {
      await apiRequest(`/api/sales/customers/${dataAkanDihapus.id}/`, {
        method: "DELETE",
      });

      setDaftarCustomer((prev) =>
        prev.filter((item) => item.id !== dataAkanDihapus.id),
      );

      toast.update(idToastHapus, {
        render: "Profil pelanggan berhasil dihapus secara permanen.",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setDataAkanDihapus(null);
    } catch (error) {
      console.error("Error Deleting:", error);
      toast.update(idToastHapus, {
        render: "Gagal menghapus data pelanggan dari server.",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  const filteredData = daftarCustomer.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kontak.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.alamat.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      <ToastContainer theme="dark" />

      {/* HEADER MODUL */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Database Pelanggan
        </h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handlePicuKonfirmasi}
          className="xl:col-span-3 bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3.5"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
            ➕ Registrasi Pelanggan
          </h3>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">
                Nama Perusahaan / Toko <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Hotel Mercure Grogol"
                value={formCustomer.nama}
                onChange={(e) =>
                  setFormCustomer({ ...formCustomer, nama: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none text-[11px] font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                Nama PIC / Kontak
              </label>
              <input
                type="text"
                placeholder="Contoh: Andi Wijaya"
                value={formCustomer.kontak}
                onChange={(e) =>
                  setFormCustomer({ ...formCustomer, kontak: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none text-[11px]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                No. Telepon / WhatsApp
              </label>
              <input
                type="text"
                placeholder="Contoh: 0812xxxxxxxx"
                value={formCustomer.telepon}
                onChange={(e) =>
                  setFormCustomer({ ...formCustomer, telepon: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none text-[11px]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                Alamat / Lokasi Tujuan
              </label>
              <input
                type="text"
                placeholder="Contoh: Jakarta"
                value={formCustomer.alamat}
                onChange={(e) =>
                  setFormCustomer({ ...formCustomer, alamat: e.target.value })
                }
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-emerald-500 focus:outline-none text-[11px]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-[11px] transition-all uppercase tracking-wider shadow-lg shadow-emerald-950/20 active:scale-95"
          >
            💾 Simpan Data Pelanggan
          </button>
        </form>

        <div className="xl:col-span-9 bg-[#1a1c23] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider self-start sm:self-center">
              📋 Daftar Pelanggan
            </h3>

            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Cari nama, kontak, atau lokasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#15171c] border border-gray-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-800/60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#15171c] text-gray-400 border-b border-gray-800 font-semibold select-none text-[11px]">
                  <th className="p-3.5 pl-5 w-[35%]">Nama Perusahaan / Toko</th>
                  <th className="p-3.5 w-[20%]">PIC Kontak</th>
                  <th className="p-3.5 w-[15%]">No. Telepon</th>
                  <th className="p-3.5 text-center w-[15%]">Alamat</th>
                  <th className="p-3.5 text-center pr-5 w-[15%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-xs font-medium">
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-8 text-center text-emerald-400 font-semibold bg-[#1a1c23] animate-pulse"
                    >
                      🔄 Menghubungkan ke server Django...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-8 text-center text-gray-500 font-semibold bg-[#1a1c23]"
                    >
                      ❌ Data pelanggan tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#1d2029]/60 transition-colors"
                    >
                      <td className="p-3.5 pl-5 text-white font-bold">
                        {item.nama}
                      </td>
                      <td className="p-3.5 text-gray-400">{item.kontak}</td>
                      <td className="p-3.5 text-gray-400 font-mono">
                        {item.telepon}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="text-gray-300 font-semibold">
                          {item.alamat}
                        </span>
                      </td>
                      <td className="p-3.5 text-center pr-5 select-none">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            type="button"
                            onClick={() => handleEditClick(item)}
                            className="text-gray-500 hover:text-emerald-400 transition-colors text-xs"
                            title="Edit profil"
                          >
                            📝
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDataAkanDihapus({
                                id: item.id,
                                nama: item.nama,
                              })
                            }
                            className="text-gray-500 hover:text-red-400 transition-colors text-xs"
                            title="Hapus permanen"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* POP-UP : PERINGATAN SEBELUM SAVE DATA CUSTOMER */}
      {dataAkanDisimpan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className={`bg-[#1a1c23] border rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn ${
              dataAkanDisimpan.isUpdate
                ? "border-amber-500/30"
                : "border-blue-500/30"
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-xl">
                {dataAkanDisimpan.isUpdate ? "⚠️" : "📝"}
              </span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                {dataAkanDisimpan.isUpdate
                  ? "Konfirmasi Perubahan Profil"
                  : "Konfirmasi Pelanggan Baru"}
              </h3>
            </div>

            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              {dataAkanDisimpan.isUpdate ? (
                <span>
                  Nama Perusahaan{" "}
                  <span className="text-amber-400 font-bold">
                    "{dataAkanDisimpan.nama}"
                  </span>{" "}
                  sudah terdaftar. Melanjutkan tindakan ini akan{" "}
                  <span className="text-amber-400 font-bold">
                    memperbarui informasi kontak dan alamat
                  </span>{" "}
                  rekanan tersebut.
                </span>
              ) : (
                <span>
                  Anda akan mendaftarkan pelanggan baru bernama{" "}
                  <span className="text-blue-400 font-bold">
                    "{dataAkanDisimpan.nama}"
                  </span>{" "}
                  ke dalam database utama.
                </span>
              )}
            </div>

            <div className="bg-[#15171c] p-3.5 rounded-lg space-y-2 text-xs border border-gray-800 font-medium">
              <div className="flex justify-between">
                <span className="text-gray-500">PIC Kontak:</span>
                <span className="text-white font-bold">
                  {dataAkanDisimpan.kontak}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lokasi / Alamat:</span>
                <span className="text-gray-300 font-bold">
                  {dataAkanDisimpan.alamat}
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
                className={`flex-1 text-white py-2.5 rounded-lg font-bold transition-all shadow-lg ${
                  dataAkanDisimpan.isUpdate
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                Ya, Simpan Pelanggan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP : PERINGATAN SEBELUM HAPUS DATA CUSTOMER */}
      {dataAkanDihapus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-red-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🚨</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Hapus Data Pelanggan?
              </h3>
            </div>

            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Apakah Anda benar-benar yakin ingin menghapus profil pelanggan{" "}
              <span className="text-red-400 font-bold">
                "{dataAkanDihapus.nama}"
              </span>{" "}
              ? Tindakan ini akan menghapusnya secara permanen dari sistem
              database.
            </div>

            <div className="flex gap-3 pt-2 text-xs select-none">
              <button
                type="button"
                onClick={() => setDataAkanDihapus(null)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-bold transition-all"
              >
                Batal / Jangan Hapus
              </button>
              <button
                type="button"
                onClick={handleEksekusiHapus}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-bold transition-all shadow-lg"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
