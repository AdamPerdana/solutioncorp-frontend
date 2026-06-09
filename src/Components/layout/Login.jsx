import React, { useState } from "react";

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(""); //

    // Mengambil kredensial dari .env (fallback ke nilai default kalo .env tidak ada)
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@admin.com";
    const adminPass = import.meta.env.VITE_ADMIN_PASS || "admin123";

    // Validasi
    if (email === adminEmail && password === adminPass) {
      onLoginSuccess(); // Masuk dashboard kalo login berhasil
    } else {
      setError("Email atau password salah! Sila periksa kembali.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#15171c] px-4 font-sans">
      <div className="w-full max-w-md rounded-xl bg-[#1a1c23] p-8 shadow-2xl border border-gray-800">
        {/* Judul Identitas Perusahaan */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white tracking-wide">
            PT. Solution Corporation Indonesia
          </h2>
          <p className="text-xs text-gray-400 mt-2 tracking-wider uppercase">
            Internal Admin Dashboard
          </p>
        </div>

        {/* Error kalo login gagal */}
        {error && (
          <div className="mb-5 rounded-lg bg-red-950/50 border border-red-800 p-3 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
            >
              Email Operator
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh: admin@solutioncorp.id"
              className="w-full rounded-lg bg-[#262932] border border-gray-700 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Input Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
            >
              Password Security
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password Anda"
              className="w-full rounded-lg bg-[#262932] border border-gray-700 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Tombol Submit*/}
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 active:bg-emerald-700 transition-all shadow-lg shadow-emerald-950/30 mt-2"
          >
            Masuk ke Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
