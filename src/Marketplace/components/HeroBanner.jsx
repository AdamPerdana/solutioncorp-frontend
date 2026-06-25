import React from "react";
import { Link } from "react-router-dom";

export default function HeroBanner() {
  return (
    <section className="relative w-full bg-[#0b0c0e] py-24 md:py-32 px-6 md:px-12 border-b border-gray-900 overflow-hidden font-sans select-none">
      {/* ==========================================================
          [ AMBIENT GLOW BACKGROUND - HIGH CONTRAST VERSION ]
          ========================================================== */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -right-12 -top-24 w-[300px] h-[300px] md:w-[650px] md:h-[650px] rounded-full bg-emerald-500/15 blur-[100px] md:blur-[140px]" />
        <div className="absolute right-[10%] -bottom-20 w-[200px] h-[200px] md:w-[450px] md:h-[450px] rounded-full bg-cyan-500/10 blur-[80px] md:blur-[120px]" />
      </div>

      {/* ==========================================================
          [ KONTEN UTAMA
          ========================================================== */}
      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-10 space-y-6 text-left flex flex-col justify-center items-start">
          <div className="space-y-3">
            {/* Tagline Atas */}
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
              Premium Quality Fuel
            </p>

            {/* Judul Utama */}
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase leading-none">
              STERNO GEL
            </h1>
          </div>

          <div className="h-px w-24 bg-gradient-to-r from-emerald-500 to-transparent" />

          {/* Deskripsi */}
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed tracking-wide font-medium">
            Solusi pembakaran bersih, konstan, and tanpa asap. Dirancang khusus
            memenuhi standar efisiensi operasional dapur Hotel, Restoran, and
            bisnis Katering (Horeka)
          </p>

          <div className="pt-4">
            <Link
              to="/about"
              className="inline-block bg-[#16171b] hover:bg-white text-white hover:text-black border border-gray-800 hover:border-white px-8 py-3 rounded text-[10px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-[0.98] shadow-2xl"
            >
              Tentang Kami
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
