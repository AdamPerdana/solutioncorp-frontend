import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";

export default function AboutUs() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#111215] text-gray-300 font-sans flex flex-col selection:bg-emerald-500/30">
        <Navbar />

        <main className="flex-1 w-full flex flex-col items-center">
          {/* =========================================
              HEADER & HERO SECTION TENTANG KAMI
              ========================================= */}
          <section className="w-full bg-[#16171b] border-b border-gray-900/80 pt-20 pb-16 px-6">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
                Profil Perusahaan
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase leading-tight">
                PT SOLUTION CORP <br className="hidden md:block" /> INDONESIA
              </h1>
              <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Distributor resmi dan penyuplai utama produk bahan bakar
                portabel (Sterno) berkualitas tinggi untuk kelancaran
                operasional industri Horeka di seluruh Indonesia.
              </p>
            </div>
          </section>

          {/* =========================================
              SEKILAS PERUSAHAAN (LAYOUT DUA KOLOM)
              ========================================= */}
          <section className="w-full max-w-5xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-emerald-500">
                  Siapa Kami
                </h2>
                <div className="h-px flex-1 bg-gray-800"></div>
              </div>
              <h3 className="text-2xl font-bold text-white leading-snug">
                Mitra Suplai Andal untuk Kebutuhan Dapur Profesional Anda.
              </h3>
              <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
                <p>
                  PT Solution Corp Indonesia hadir sebagai jalur distribusi
                  utama yang berdedikasi penuh dalam penyediaan produk{" "}
                  <strong className="text-gray-200 font-semibold">
                    Sterno Gel
                  </strong>{" "}
                  dan{" "}
                  <strong className="text-gray-200 font-semibold">
                    Sterno Kaleng
                  </strong>
                  . Kami memahami bahwa konsistensi dan efisiensi waktu adalah
                  nyawa dari setiap operasional Hotel, Restoran, maupun
                  Katering.
                </p>
                <p>
                  Sebagai distributor terkemuka, kami menjembatani kebutuhan
                  pasar dengan produk sterno bermutu tinggi yang dijamin aman,
                  memiliki durasi pembakaran yang stabil, serta ramah lingkungan
                  tanpa memicu asap dan bau menyengat di area prasmanan klien
                  Anda.
                </p>
              </div>
            </div>

            {/* Kotak Visi / Kutipan */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-emerald-600/20 to-[#111215] rounded-2xl blur-lg"></div>
              <div className="relative bg-[#16171b] border border-gray-800 rounded-2xl p-8 md:p-10 shadow-2xl flex flex-col justify-center h-full">
                <span className="text-4xl mb-4">🤝</span>
                <h4 className="text-lg font-bold text-white mb-3">Visi Kami</h4>
                <p className="text-sm text-gray-400 leading-relaxed italic">
                  "Menjadi tulang punggung rantai pasok (supply chain) sterno
                  nomor satu di Indonesia, dengan mengedepankan ketersediaan
                  stok skala besar, ketepatan waktu pengiriman, and kepercayaan
                  mitra bisnis jangka panjang."
                </p>
              </div>
            </div>
          </section>

          {/* =========================================
              NILAI UTAMA & KEUNGGULAN DISTRIBUTOR 
              ========================================= */}
          <section className="w-full bg-[#16171b] border-y border-gray-900/80 py-16 px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">
                  Mengapa Memilih Kami
                </h3>
                <div className="h-[2px] w-8 bg-emerald-500 mx-auto mt-4"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Keunggulan 1: Kapasitas Stok */}
                <div className="bg-[#111215] border border-gray-800 hover:border-emerald-500/50 rounded-xl p-6 transition-all duration-300 group flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-lg">📦</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Kapasitas Pasokan Besar
                    </h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Manajemen inventaris gudang yang mumpuni. Kami siap
                      melayani permintaan partai besar maupun kontrak suplai
                      rutin tanpa kendala kekosongan barang.
                    </p>
                  </div>
                </div>

                <div className="bg-[#111215] border border-gray-800 hover:border-emerald-500/50 rounded-xl p-6 transition-all duration-300 group flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-lg">🚚</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Layanan Pengiriman 24 Jam
                    </h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Operasional logistik kami bergerak fleksibel sepanjang
                      hari untuk memastikan pengiriman darurat malam hari
                      (emergency supply) tetap berjalan demi kelancaran event
                      Horeka Anda.
                    </p>
                  </div>
                </div>

                <div className="bg-[#111215] border border-gray-800 hover:border-emerald-500/50 rounded-xl p-6 transition-all duration-300 group flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-lg">💬</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Dukungan Admin 24 Jam
                    </h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Tim sales dan customer support kami siap melayani
                      koordinasi, konsultasi volume kuota sterno, maupun
                      pemesanan instan kapan pun Anda membutuhkannya tanpa
                      batasan waktu.
                    </p>
                  </div>
                </div>

                <div className="bg-[#111215] border border-gray-800 hover:border-emerald-500/50 rounded-xl p-6 transition-all duration-300 group flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-lg">🛡️</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Distribusi Resmi & Legal
                    </h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Integritas bisnis terjamin sah. Seluruh produk sterno yang
                      kami salurkan memiliki legalitas jelas dan melewati proses
                      inspeksi mutu ketat sebelum serah terima.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================
              KOMITMEN LAYANAN (BOTTOM SECTION)
              ========================================= */}
          <section className="w-full max-w-4xl mx-auto px-6 py-16 text-center">
            <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
              Mulai dari pemesanan kemasan eceran hingga pengadaan tonase untuk
              jaringan Perhotelan & Catering,{" "}
              <strong className="text-white">PT Solution Corp Indonesia</strong>{" "}
              berkomitmen untuk menjadi rekanan B2B yang solutif. Hubungi tim
              sales kami hari ini untuk kebutuhan sterno bisnis Anda.
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
}
