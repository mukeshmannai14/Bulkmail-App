import { useEffect, useState } from "react";
import axios from "axios";

function History() {

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  async function getHistory() {

    try {

      const API_URL = import.meta.env.VITE_API_URL;

const response = await axios.get(
  `${API_URL}/history`,
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  }
);

      setHistory(response.data);

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }

  }


  useEffect(() => {

    getHistory();

  }, []);


  function getStatusStyle(status) {

    if (status === "success") {

      return "bg-green-100 text-green-700";

    }

    if (status === "partial") {

      return "bg-yellow-100 text-yellow-700";

    }

    if (status === "failed") {

      return "bg-red-100 text-red-700";

    }

    return "bg-blue-100 text-blue-700";

  }


  if (loading) {

    return (
      <div className="text-center py-10">
        Loading history...
      </div>
    );

  }


  return (

    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

      <div className="px-6 py-5 border-b">

        <h2 className="text-xl font-semibold">
          Email History
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Previous email campaigns
        </p>

      </div>


      {history.length === 0 ? (

        <div className="p-10 text-center text-slate-500">

          No email campaigns found.

        </div>

      ) : (

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-slate-50">

              <tr>

                <th className="text-left px-6 py-4">
                  Subject
                </th>

                <th className="text-left px-6 py-4">
                  Recipients
                </th>

                <th className="text-left px-6 py-4">
                  Sent
                </th>

                <th className="text-left px-6 py-4">
                  Failed
                </th>

                <th className="text-left px-6 py-4">
                  Status
                </th>

                <th className="text-left px-6 py-4">
                  Date
                </th>

              </tr>

            </thead>


            <tbody>

              {history.map((campaign) => (

                <tr
                  key={campaign._id}
                  className="border-t hover:bg-slate-50"
                >

                  <td className="px-6 py-4 font-medium">
                    {campaign.subject}
                  </td>


                  <td className="px-6 py-4">
                    {campaign.recipients.length}
                  </td>


                  <td className="px-6 py-4 text-green-600 font-medium">
                    {campaign.sent}
                  </td>


                  <td className="px-6 py-4 text-red-600 font-medium">
                    {campaign.failed}
                  </td>


                  <td className="px-6 py-4">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                        campaign.status
                      )}`}
                    >
                      {campaign.status}
                    </span>

                  </td>


                  <td className="px-6 py-4 text-slate-500">

                    {new Date(
                      campaign.createdAt
                    ).toLocaleString()}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>

  );

}

export default History;