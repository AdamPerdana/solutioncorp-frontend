const BASE_URL = "http://127.0.0.1:8000";

export const apiRequest = async (endpoint, options = {}) => {
  let token = localStorage.getItem("accessToken");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: headers,
  });

  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");

    if (refreshToken) {
      console.log(
        "Access Token habis, diam-diam meminta kunci baru ke Django...",
      );

      try {
        const refreshResponse = await fetch(`${BASE_URL}/api/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();

          localStorage.setItem("accessToken", refreshData.access);

          if (refreshData.refresh) {
            localStorage.setItem("refreshToken", refreshData.refresh);
          }

          headers["Authorization"] = `Bearer ${refreshData.access}`;
          response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: headers,
          });

          return response.json();
        }
      } catch (error) {
        console.error("Gagal melakukan silent refresh:", error);
      }
    }

    console.log(
      "Sesi habis, menghapus storage & mengalihkan ke halaman login.",
    );
    localStorage.clear();
    window.location.href = "/login";
    return;
  }

  return response.json();
};
