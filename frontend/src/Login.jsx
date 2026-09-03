import { useState } from "react";
import axios from "axios";

function Login({ onLogin }) {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login() {

    if (!username || !password) {

      setError(
        "Please enter username and password."
      );

      return;
    }

    try {

      setLoading(true);
      setError("");

      const response = await axios.post(
        "http://localhost:5000/login",
        {
          username,
          password,
        }
      );

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "username",
        response.data.username
      );

      onLogin();

    } catch (error) {

      console.log(error);

      setError(
        error.response?.data?.message ||
        "Login failed."
      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-5">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg border border-slate-200 p-8">

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

          <div>

            <label className="block text-sm font-medium mb-2">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
            />

          </div>


          <div>

            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
            />

          </div>


          {error && (

            <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>

          )}


          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-xl"
          >

            {loading
              ? "Logging in..."
              : "Login"}

          </button>

        </div>

      </div>

    </div>

  );

}

export default Login;