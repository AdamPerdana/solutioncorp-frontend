import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const pesanWhatsApp = `Halo Admin PT Solution Corp Indonesia,

Saya tertarik dengan Sterno yang ada di katalog website. 
Mohon informasi lebih lanjut. Terima kasih.`;

  const nomorWhatsAppAdmin = "6212345678910";

  return (
    <footer className="bg-[#0b0c0e] border-t border-gray-900 py-16 px-6 font-sans text-gray-400">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* BAGIAN ATAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* TENTANG PERUSAHAAN  */}
          <div className="space-y-4 text-center md:text-left md:pl-8 flex flex-col items-center md:items-start">
            <h3 className="text-sm font-black tracking-widest text-white uppercase">
              SOLUTION <span className="text-emerald-500">CORP</span>
            </h3>
            <p className="text-[11px] text-gray-500 leading-relaxed max-w-sm">
              PT Solution Corp Indonesia adalah distributor resmi bahan bakar
              sterno (gel & kaleng) berkualitas tinggi untuk kebutuhan hotel,
              restoran, dan katering (horeka) di seluruh indonesia.
            </p>

            <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400 pt-1">
              <span>Kualitas Stabil</span>
              <span className="text-gray-700">•</span>
              <span>Aman & Bersih</span>
            </div>
          </div>

          {/*  HUBUNGI KAMI  */}
          <div className="space-y-4 text-center md:text-right md:pr-10 flex flex-col items-center md:items-end">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white w-full">
              Hubungi Kami
            </h4>
            <div className="text-[11px] text-gray-500 space-y-1 leading-relaxed w-full">
              <p>Kantor Operasional </p>
              <p>Jakarta, Indonesia</p>
            </div>
            <div className="pt-1 w-full">
              {/* Link WA  */}
              <a
                href={`https://wa.me/${nomorWhatsAppAdmin}?text=${encodeURIComponent(pesanWhatsApp)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#16171b] hover:bg-[#1f2026] border border-gray-800 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded transition-all active:scale-[0.98]"
              >
                Hubungi Admin
              </a>
            </div>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="border-t border-gray-900/60 pt-8 text-center">
          <p className="text-[10px] text-gray-600 tracking-wider">
            © 2020 - {new Date().getFullYear()} PT Solution Corp Indonesia. All
            Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
