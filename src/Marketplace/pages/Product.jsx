import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"; // 🎯 Import komponen Footer global
import PageTransition from "../components/PageTransition"; // 🎯 Import pembungkus animasi transisi halaman
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  // 🎯 1. Tangkap parameter URL dengan nama slug, bukan id lagi
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [typedQty, setTypedQty] = useState("1");
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk mengatur foto besar yang sedang aktif
  const [activeImage, setActiveImage] = useState("");

  useEffect(() => {
    // Proteksi awal jika slug tidak terbaca atau bermasalah
    if (!slug || slug === "null" || slug === "undefined") {
      setLoading(false);
      setProduct(null);
      return;
    }

    setLoading(true);

    // 🎯 2. Tembak API Django dengan parameter slug produk
    fetch(`http://127.0.0.1:8000/api/home/products/${slug}/`)
      .then((response) => {
        if (!response.ok) throw new Error("Produk tidak ditemukan");
        return response.json();
      })
      .then((data) => {
        setProduct(data);
        // Set foto utama sebagai foto aktif pertama kali
        setActiveImage(data.image);
        setQuantity(1);
        setTypedQty("1");

        return fetch("http://127.0.0.1:8000/api/home/products/");
      })
      .then((response) => response.json())
      .then((allProducts) => {
        // 🎯 3. Filter rekomendasi agar mengecek slug, bukan ID angka lagi
        const filtered = allProducts
          .filter((item) => item.slug !== slug)
          .slice(0, 4);
        setRecommendations(filtered);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Gagal mengambil data dari Django:", error);
        setLoading(false);
      });
  }, [slug]); // 🎯 4. Jadikan slug sebagai pemicu (dependency) render ulang data halaman

  const getWhatsAppLink = () => {
    if (!product) return "#";
    const text = `Halo PT Solution Corp Indonesia, saya ingin memesan produk:\n\n- Nama: ${product.name}\n- Jumlah: ${quantity} pcs\n- Total Estimasi: Rp ${(product.price * quantity).toLocaleString("id-ID")}\n\nMohon informasi ketersediaan stock dan kelanjutan pengirimannya, terima kasih.`;
    return `https://wa.me/628882234566?text=${encodeURIComponent(text)}`;
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111215] text-gray-300 flex items-center justify-center font-sans">
        <p className="text-xs uppercase tracking-widest animate-pulse">
          Memuat spesifikasi sterno...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#111215] text-gray-300 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <p className="text-xs uppercase tracking-widest text-red-400">
            Produk sterno tidak ditemukan
          </p>
          <Link to="/" className="text-xs text-emerald-400 underline block">
            Kembali ke Home
          </Link>
        </div>
      </div>
    );
  }

  // Gabungkan foto utama dengan array foto tambahan dari backend
  const allImages = [
    product.image,
    ...(product.images || []).map((imgObj) => imgObj.image),
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#111215] text-gray-300 font-sans flex flex-col selection:bg-emerald-500/30">
        <Navbar />

        <div className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
          {/* Breadcrumb */}
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-8">
            <Link to="/" className="hover:text-emerald-400 transition-colors">
              Home
            </Link>{" "}
            / <span>Produk</span> /{" "}
            <span className="text-gray-400">Sterno</span> / {product.name}
          </div>

          {/* DISPLAY LAYOUT UTAMA */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start mb-16">
            {/* KIRI: THUMBNAILS DINAMIS */}
            <div className="md:col-span-1 flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 order-2 md:order-1">
              {allImages.map((imgUrl, index) => (
                <div
                  key={index}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`w-14 h-14 bg-white border ${
                    activeImage === imgUrl
                      ? "border-emerald-500"
                      : "border-gray-800"
                  } flex items-center justify-center overflow-hidden cursor-pointer transition-all`}
                >
                  <img
                    src={imgUrl}
                    alt={`thumbnail-${index}`}
                    className={`w-full h-full object-cover ${
                      activeImage === imgUrl
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* TENGAH: GAMBAR UTAMA DINAMIS */}
            <div className="md:col-span-5 bg-white aspect-square flex items-center justify-center border border-gray-200 relative order-1 md:order-2 overflow-hidden">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>

            {/* KANAN: INFORMASI & CHECKOUT */}
            <div className="md:col-span-6 space-y-5 md:pl-2 order-3">
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-tight">
                {product.name}
              </h2>
              <p className="text-2xl font-black text-emerald-400 tracking-wide border-b border-gray-900 pb-4">
                Rp {product.price.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Sterno berkualitas dari PT Solution untuk menjaga kehangatan
                makanan Anda dengan aman, konstan, dan higienis.
              </p>

              {/* BARIS KONTROL KUANTITAS & KERANJANG */}
              <div className="flex items-center space-x-3 pt-4">
                <div className="flex items-center bg-[#16171b] border border-gray-700 h-11 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      const nextQty = Math.max(1, quantity - 1);
                      setQuantity(nextQty);
                      setTypedQty(String(nextQty));
                    }}
                    className="px-4 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    -
                  </button>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={typedQty}
                    onChange={(e) => {
                      const text = e.target.value.replace(/[^0-9]/g, "");
                      setTypedQty(text);

                      if (text !== "") {
                        const val = parseInt(text, 10);
                        if (val > 0) {
                          setQuantity(val);
                        }
                      }
                    }}
                    onBlur={() => {
                      if (typedQty === "" || parseInt(typedQty, 10) === 0) {
                        setQuantity(1);
                        setTypedQty("1");
                      }
                    }}
                    className="w-12 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const nextQty = quantity + 1;
                      setQuantity(nextQty);
                      setTypedQty(String(nextQty));
                    }}
                    className="px-4 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-transparent hover:bg-[#16171b] border border-gray-700 text-white text-[10px] font-bold uppercase tracking-widest h-11 rounded-lg transition-all active:scale-[0.98]"
                >
                  Tambahkan Ke Keranjang
                </button>
              </div>

              {/* TOMBOL WHATSAPP */}
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25d366] hover:bg-[#20ba56] text-gray-900 text-[10px] font-black uppercase tracking-widest py-3.5 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-2 mt-2"
              >
                <span>💬</span> <span>Hubungi Admin</span>
              </a>

              {/* ALASAN BELANJA */}
              <div className="pt-4 space-y-2 text-[11px] text-gray-400">
                <p className="font-bold text-white uppercase tracking-wider text-[10px]">
                  Alasan Berbelanja di PT Solution Corp Indonesia:
                </p>
                <ul className="space-y-1">
                  <li>
                    ✓ Terakreditasi resmi oleh KAN (Komite Akreditasi Nasional)
                  </li>
                  <li>
                    ✓ Bersertifikasi Standar Mutu Internasional ISO 9001:2015
                  </li>
                  <li>✓ Pengiriman cepat berskala tonase</li>
                  <li>✓ Layanan Admin 24Jam</li>
                </ul>
              </div>
            </div>
          </div>

          {/* DESKRIPSI */}
          <div className="border-t border-gray-900 pt-8 mb-16">
            <div className="flex space-x-6 border-b border-gray-900 pb-3 text-xs uppercase tracking-widest font-black">
              <span className="text-white border-b-2 border-emerald-500 pb-3">
                Deskripsi
              </span>
            </div>

            <div className="pt-6 text-[11px] text-gray-400 space-y-6">
              <p className="leading-relaxed max-w-4xl whitespace-pre-line">
                {product.description ||
                  "Tidak ada deskripsi teknis untuk produk ini."}
              </p>
            </div>
          </div>

          {/* REKOMENDASI PRODUK */}
          <div className="border-t border-gray-900 pt-12">
            <h3 className="text-center text-xs font-black uppercase tracking-[0.2em] text-white mb-8">
              Anda mungkin juga suka
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recommendations.map((item) => (
                <Link
                  to={`/product/${item.slug}`} // 🎯 5. Ubah rute rekomendasi agar mengarah ke slug produk alternatif
                  key={item.id}
                  className="flex flex-col group cursor-pointer"
                >
                  <div className="w-full aspect-square bg-white flex items-center justify-center border border-gray-200 transition-all duration-300 group-hover:shadow-lg relative overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
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
          </div>
        </div>

        {/* 🎯 Komponen Footer global terstandarisasi */}
        <Footer />
      </div>
    </PageTransition>
  );
}
