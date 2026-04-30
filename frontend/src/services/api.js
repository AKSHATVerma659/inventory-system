import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api"
});

/* Attach JWT token to every request */
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* Auto logout on 401 */
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* Helper: download blob using same auth rules */
export async function downloadBlob(url, options = {}) {
  const res = await api.get(url, { responseType: "blob", ...options });
  return res;
}

export default api;
