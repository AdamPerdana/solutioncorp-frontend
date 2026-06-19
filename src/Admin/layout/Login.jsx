import React, { useState } from "react";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [triggerFadeOut, setTriggerFadeOut] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Kredensial salah! Periksa kembali username & password.",
        );
      }

      // Simpan Token Autentikasi
      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);

      if (data.user) {
        localStorage.setItem("userProfile", JSON.stringify(data.user));
      }

      setIsSuccess(true);

      setTimeout(() => {
        setTriggerFadeOut(true);
      }, 600);

      setTimeout(() => {
        onLoginSuccess();
      }, 1100);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center px-4 font-sans select-none transition-colors duration-500 ${triggerFadeOut ? "bg-black" : "bg-[#15171c]"}`}
    >
      <div
        className={`w-full max-w-md rounded-2xl bg-[#1a1c23] p-8 shadow-2xl border border-gray-800/80 transition-all duration-500 ease-out ${isSuccess ? "opacity-0 scale-90 blur-sm" : "opacity-100 scale-100"}`}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xl mb-3 shadow-inner font-mono font-bold">
            SCI
          </div>
          <h2 className="text-xl font-black text-white tracking-wide">
            PT. Solution Corporation Indonesia
          </h2>
          <p className="text-[10px] text-gray-500 font-bold mt-1.5 tracking-widest uppercase">
            Sistem Autentikasi Internal
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-950/40 border border-red-500/20 p-3.5 text-xs font-semibold text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2"
            >
              Username Operator
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username admin"
              className="w-full rounded-xl bg-[#15171c] border border-gray-800 px-4 py-3 text-xs text-white placeholder-gray-600 focus:border-emerald-500/80 focus:outline-none transition-all font-medium disabled:opacity-50"
              disabled={isSubmitting || isSuccess}
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2"
            >
              Password Security
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-[#15171c] border border-gray-800 pl-4 pr-14 py-3 text-xs text-white placeholder-gray-600 focus:border-emerald-500/80 focus:outline-none transition-all font-mono tracking-wider disabled:opacity-50"
                disabled={isSubmitting || isSuccess}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-300 transition-colors text-[10px] font-bold tracking-wider uppercase"
                disabled={isSubmitting || isSuccess}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isSuccess}
            className={`w-full rounded-xl py-3 text-xs font-black text-white active:scale-95 transition-all shadow-lg mt-4 uppercase tracking-wider flex items-center justify-center min-h-[42px] ${
              isSuccess
                ? "bg-emerald-500 scale-100"
                : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20 disabled:bg-emerald-800 disabled:scale-100"
            }`}
          >
            {isSuccess ? (
              <span className="flex items-center gap-2">
                Menyiapkan Dashboard...
              </span>
            ) : isSubmitting ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
            ) : (
              "Otorisasi Masuk ➔"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
