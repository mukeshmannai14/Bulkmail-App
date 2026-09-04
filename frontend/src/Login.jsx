
import { useState } from "react";
import axios from "axios";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    // Validate inputs
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Get backend URL from Vite environment variable
      const API_URL = import.meta.env.VITE_API_URL;

      if (!API_URL) {
        setError("Backend API URL is not configured.");
        return;
      }

      console.log("API URL:", API_URL);

      // Send login request
      const response = await axios.post(`${API_URL}/login`, {
        username: username.trim(),
        password,
      });

      console.log("Login response:", response.data);

      // Make sure token exists
      if (!response.data?.token) {
        setError("Login failed: No token received from server.");
        return;
      }

      // Save authentication information
      localStorage.setItem("token", response.data.token);

      if (response.data.username) {
        localStorage.setItem("username", response.data.username);
      }

      // Notify parent component
      onLogin();

    } catch (error) {
      console.error("========== LOGIN ERROR ==========");
      console.error("Message:", error.message);
      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);
      console.error("URL:", error.config?.url);
      console.error("================================");

      if (error.response) {
        setError(
          error.response.data?.message ||
          `Login failed (${error.response.status})`
        );
      } else if (error.request) {
        setError(
          "Unable to connect to the server. Please check your backend."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-5">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg border border-slate-200 p-8">

        {/* Logo / Header */}

        <div className="text-center mb-8">

          <div className="w-14 h-14 bg-blue-600 rounded-xl mx-auto flex items-center justify-center text-white text-2xl font-bold">
            B
          </div>

          <h1 className="text-2xl font-bold mt-4">
            BulkMail
          </h1>

          <p className="text-slate-500 text-sm mt-1">
            Admin Login
          </p>

        </div>

        <div className="space-y-5">

          {/* Username */}

          <div>
            <label className="block text-sm font-medium mb-2">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  login();
                }
              }}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>

          {/* Password */}

          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  login();
                }
              }}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {/* Error Message */}

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Login Button */}

          <button
            type="button"
            onClick={login}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default Login;
