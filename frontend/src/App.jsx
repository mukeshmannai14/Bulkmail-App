import { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

import Login from "./Login";
import History from "./History";

function App() {
  // ==============================
  // Authentication
  // ==============================

  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const [page, setPage] = useState("dashboard");

  // ==============================
  // Email states
  // ==============================

  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState(false);

  const [emailList, setEmailList] = useState([]);
  const [fileName, setFileName] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // ==============================
  // Message
  // ==============================

  function handleMsg(evt) {
    setMsg(evt.target.value);
    setMessage("");
  }

  // ==============================
  // Excel File
  // ==============================

  function handleFile(evt) {
    const file = evt.target.files[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setMessage("");
    setMessageType("");

    const reader = new FileReader();

    reader.onload = function (event) {
      try {
        const data = event.target.result;

        const workbook = XLSX.read(data, {
          type: "binary",
        });

        const sheetName = workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];

        const dataList = XLSX.utils.sheet_to_json(worksheet, {
          header: "A",
        });

        const totalEmail = dataList
          .map(function (item) {
            return item.A;
          })
          .filter(function (email) {
            return (
              email &&
              typeof email === "string" &&
              email.toLowerCase() !== "email" &&
              email.includes("@")
            );
          });

        console.log("Email List:", totalEmail);

        setEmailList(totalEmail);

        if (totalEmail.length === 0) {
          setMessage(
            "No valid email addresses found in the file."
          );

          setMessageType("error");
        } else {
          setMessage(
            `${totalEmail.length} email addresses loaded successfully.`
          );

          setMessageType("success");
        }
      } catch (error) {
        console.error("Excel error:", error);

        setMessage(
          "Unable to read the Excel file."
        );

        setMessageType("error");
      }
    };

    reader.readAsBinaryString(file);
  }

  // ==============================
  // Send Email
  // ==============================

  async function send() {
    if (subject.trim() === "") {
      setMessage("Please enter an email subject.");
      setMessageType("error");
      return;
    }

    if (msg.trim() === "") {
      setMessage("Please enter your email message.");
      setMessageType("error");
      return;
    }

    if (emailList.length === 0) {
      setMessage(
        "Please upload an Excel file containing email addresses."
      );

      setMessageType("error");

      return;
    }

    try {
      setStatus(true);

      setMessage("Sending your emails...");
      setMessageType("sending");

      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:5000/sendemail",
        {
          subject: subject,
          msg: msg,
          emailList: emailList,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Backend response:",
        response.data
      );

      if (response.data.status === "success") {
        setMessage(
          `Successfully sent ${response.data.sent} emails.`
        );

        setMessageType("success");
      } else if (
        response.data.status === "partial"
      ) {
        setMessage(
          `Sent ${response.data.sent} emails. ${response.data.failed} failed.`
        );

        setMessageType("error");
      } else {
        setMessage(
          `Failed to send emails. ${response.data.failed || 0} failed.`
        );

        setMessageType("error");
      }

      setSubject("");
      setMsg("");
    } catch (error) {
      console.error("Error:", error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");

        setLoggedIn(false);

        return;
      }

      setMessage(
        error.response?.data?.message ||
          "Unable to send emails."
      );

      setMessageType("error");
    } finally {
      setStatus(false);
    }
  }

  // ==============================
  // Logout
  // ==============================

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");

    setLoggedIn(false);
    setPage("dashboard");
  }

  // ==============================
  // Login Screen
  // ==============================

  if (!loggedIn) {
    return (
      <Login
        onLogin={() => {
          setLoggedIn(true);
        }}
      />
    );
  }

  // ==============================
  // Main Application
  // ==============================

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">

      {/* ================= NAVBAR ================= */}

      <nav className="bg-white border-b border-slate-200">

        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              B
            </div>

            <div>
              <h1 className="text-xl font-bold">
                BulkMail
              </h1>

              <p className="text-xs text-slate-500">
                Email Campaign Manager
              </p>
            </div>

          </div>

          {/* Navigation */}

          <div className="flex items-center gap-5 text-sm">

            <button
              onClick={() => setPage("dashboard")}
              className={
                page === "dashboard"
                  ? "text-blue-600 font-semibold"
                  : "text-slate-600 hover:text-blue-600"
              }
            >
              Dashboard
            </button>

            <button
              onClick={() => setPage("history")}
              className={
                page === "history"
                  ? "text-blue-600 font-semibold"
                  : "text-slate-600 hover:text-blue-600"
              }
            >
              History
            </button>

            <div className="flex items-center gap-2">

              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-semibold">
                {(
                  localStorage.getItem("username") || "A"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <span className="hidden sm:block">
                {localStorage.getItem("username") ||
                  "Admin"}
              </span>

            </div>

            <button
              onClick={logout}
              className="text-red-500 hover:text-red-600 font-medium"
            >
              Logout
            </button>

          </div>

        </div>

      </nav>

      {/* ================= HISTORY ================= */}

      {page === "history" ? (

        <main className="max-w-6xl mx-auto px-6 py-10">

          <History />

        </main>

      ) : (

        <>
          {/* ================= HERO ================= */}

          <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">

            <div className="max-w-6xl mx-auto px-6 py-12">

              <div className="max-w-2xl">

                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm mb-5">

                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>

                  Ready to send

                </div>

                <h2 className="text-4xl md:text-5xl font-bold leading-tight">

                  Send emails to your{" "}

                  <span className="text-blue-200">
                    entire audience.
                  </span>

                </h2>

                <p className="mt-4 text-blue-100 text-lg">

                  Upload your recipient list, write your
                  message, and send your campaign in just
                  a few clicks.

                </p>

              </div>

            </div>

          </section>

          {/* ================= MAIN ================= */}

          <main className="max-w-6xl mx-auto px-6 py-10">

            <div className="grid lg:grid-cols-3 gap-8">

              {/* ================= COMPOSER ================= */}

              <div className="lg:col-span-2">

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200">

                  <div className="px-6 py-5 border-b border-slate-200">

                    <h3 className="text-xl font-semibold">
                      Compose Email
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      Create the message you want to send.
                    </p>

                  </div>

                  <div className="p-6 space-y-5">

                    {/* Subject */}

                    <div>

                      <label className="block text-sm font-medium mb-2">
                        Subject
                      </label>

                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => {
                          setSubject(e.target.value);
                          setMessage("");
                        }}
                        placeholder="Enter email subject..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      />

                    </div>

                    {/* Message */}

                    <div>

                      <div className="flex items-center justify-between mb-2">

                        <label className="text-sm font-medium">
                          Email Message
                        </label>

                        <span className="text-xs text-slate-400">
                          {msg.length} characters
                        </span>

                      </div>

                      <textarea
                        value={msg}
                        onChange={handleMsg}
                        placeholder="Write your email message here..."
                        className="w-full h-48 px-4 py-3 border border-slate-300 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-500"
                      />

                    </div>

                    {/* Excel */}

                    <div>

                      <label className="block text-sm font-medium mb-2">
                        Recipient List
                      </label>

                      <label
                        htmlFor="fileUpload"
                        className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                      >

                        <div className="flex flex-col items-center">

                          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl mb-3">
                            📊
                          </div>

                          <h4 className="font-semibold">
                            Upload Excel file
                          </h4>

                          <p className="text-sm text-slate-500 mt-1">
                            Click to browse
                          </p>

                          <p className="text-xs text-slate-400 mt-2">
                            Supported: .xlsx, .xls
                          </p>

                        </div>

                        <input
                          id="fileUpload"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFile}
                          className="hidden"
                        />

                      </label>

                    </div>

                    {/* Selected file */}

                    {fileName && (

                      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">

                        <div className="flex items-center gap-3">

                          <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                            📄
                          </div>

                          <div>

                            <p className="text-sm font-medium">
                              {fileName}
                            </p>

                            <p className="text-xs text-slate-500">
                              Excel recipient list
                            </p>

                          </div>

                        </div>

                        <span className="text-sm font-semibold text-green-600">
                          {emailList.length} emails
                        </span>

                      </div>

                    )}

                    {/* Status */}

                    {message && (

                      <div
                        className={`rounded-xl px-4 py-3 text-sm ${
                          messageType === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : messageType === "error"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {message}
                      </div>

                    )}

                    {/* Send */}

                    <button
                      onClick={send}
                      disabled={status}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition"
                    >

                      {status ? (
                        <span className="flex items-center justify-center gap-2">

                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>

                          Sending Emails...

                        </span>
                      ) : (
                        "✈️ Send Campaign"
                      )}

                    </button>

                  </div>

                </div>

              </div>

              {/* ================= SIDEBAR ================= */}

              <div className="space-y-6">

                {/* Campaign Overview */}

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

                  <h3 className="font-semibold text-lg">
                    Campaign Overview
                  </h3>

                  <div className="mt-5 space-y-4">

                    <div className="flex items-center justify-between">

                      <span className="text-sm text-slate-500">
                        Recipients
                      </span>

                      <span className="font-bold text-xl">
                        {emailList.length}
                      </span>

                    </div>

                    <div className="h-px bg-slate-200"></div>

                    <div className="flex items-center justify-between">

                      <span className="text-sm text-slate-500">
                        Subject
                      </span>

                      <span className="text-sm font-medium max-w-[150px] truncate">
                        {subject || "Not set"}
                      </span>

                    </div>

                    <div className="h-px bg-slate-200"></div>

                    <div className="flex items-center justify-between">

                      <span className="text-sm text-slate-500">
                        Message
                      </span>

                      <span className="text-sm font-medium">
                        {msg.length} chars
                      </span>

                    </div>

                  </div>

                </div>

                {/* How it works */}

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

                  <h3 className="font-semibold text-lg">
                    How it works
                  </h3>

                  <div className="mt-5 space-y-5">

                    <div className="flex gap-3">

                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                        1
                      </div>

                      <div>
                        <p className="font-medium text-sm">
                          Write your email
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          Add a subject and message.
                        </p>
                      </div>

                    </div>

                    <div className="flex gap-3">

                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                        2
                      </div>

                      <div>
                        <p className="font-medium text-sm">
                          Upload recipients
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          Upload an Excel file.
                        </p>
                      </div>

                    </div>

                    <div className="flex gap-3">

                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                        3
                      </div>

                      <div>
                        <p className="font-medium text-sm">
                          Send campaign
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          BulkMail sends your emails.
                        </p>
                      </div>

                    </div>

                  </div>

                </div>

                {/* System */}

                <div className="bg-slate-900 rounded-2xl p-5 text-white">

                  <div className="flex items-center gap-3">

                    <span className="w-3 h-3 bg-green-400 rounded-full"></span>

                    <div>

                      <p className="font-medium text-sm">
                        System Online
                      </p>

                      <p className="text-xs text-slate-400">
                        Email service connected
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </main>

          {/* ================= FOOTER ================= */}

          <footer className="bg-slate-900 text-white mt-10">

            <div className="max-w-6xl mx-auto px-6 py-8">

              <div className="flex flex-col md:flex-row justify-between gap-5">

                <div>

                  <h2 className="text-xl font-bold">
                    BulkMail
                  </h2>

                  <p className="text-sm text-slate-400 mt-2">
                    Simple and reliable bulk email management.
                  </p>

                </div>

                <div className="text-sm text-slate-400">
                  Built with React · Express · MongoDB
                </div>

              </div>

              <div className="border-t border-slate-800 mt-6 pt-5 text-xs text-slate-500">
                © 2026 BulkMail. All rights reserved.
              </div>

            </div>

          </footer>

        </>

      )}

    </div>
  );
}

export default App;