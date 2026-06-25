import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import HeroBanner from "../components/HeroBanner";
import PageTransition from "../components/PageTransition";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/home/products/")
      .then((response) => response.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Gagal mengambil data produk sterno:", error);
        setLoading(false);
      });
  }, []);

  const getGridColsClass = (totalItems) => {
    if (totalItems <= 4) {
      return "md:grid-cols-2";
    }
    if (totalItems === 6) {
      return "md:grid-cols-3";
    }
    if (totalItems === 10) {
      return "md:grid-cols-5";
    }
    return "md:grid-cols-4";
  };

  const featuredProduct = products && products.length > 0 ? products[0] : null;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#111215] text-gray-300 font-sans flex flex-col selection:bg-emerald-500/30">
        <Navbar />
        <HeroBanner featuredProduct={featuredProduct} />

        {/*Katalog Produk */}
        <main className="max-w-6xl mx-auto px-6 py-16 w-full flex-1">
          <div className="text-center mb-12">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">
              Produk
            </h3>
            <div className="h-[2px] w-8 bg-emerald-500 mx-auto mt-3"></div>
          </div>

          {/* State Loading API Django merespon */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-xs tracking-widest text-gray-500 uppercase animate-pulse">
                Menghubungkan ke database sterno...
              </p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-2 ${getGridColsClass(products.length)} gap-x-6 gap-y-10 max-w-5xl mx-auto`}
            >
              {products.map((item) => (
                <Link
                  to={`/product/${item.slug}`}
                  key={item.id}
                  className="flex flex-col group cursor-pointer"
                >
                  <div className="w-full aspect-square bg-white rounded-none flex items-center justify-center border border-gray-200 transition-all duration-300 group-hover:shadow-xl relative overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Detail Teks Asli Database */}
                  <div className="mt-4 text-center space-y-1">
                    <h4 className="text-[11px] font-bold text-gray-300 group-hover:text-emerald-400 transition-colors uppercase tracking-wide truncate px-1">
                      {item.name}
                    </h4>
                    <p className="text-[11px] font-semibold text-gray-500 tracking-wider">
                      Rp {item.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
}
