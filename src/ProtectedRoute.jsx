import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  if (!token || token.trim() === "") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
