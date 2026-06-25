import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  // 1. Cek token ada dan tidak kosong
  if (!token || token.trim() === "") {
    return <Navigate to="/login" replace />;
  }

  // 2. Validasi Struktur JWT
  const jwtPattern = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+$/;
  if (!jwtPattern.test(token)) {
    // Jika formatnya bukan JWT valid, tendang ke login
    localStorage.removeItem("accessToken");
    return <Navigate to="/login" replace />;
  }

  // Jika lolos semua pemeriksaan, render komponen dashboard
  return children;
}
