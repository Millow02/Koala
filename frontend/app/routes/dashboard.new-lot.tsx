import {
  Outlet,
  useLoaderData,
  useNavigate,
  useOutletContext,
} from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { useEffect, useState } from "react";
import { Database } from "~/types/supabase";

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

export default function New() {
  const { user, supabase } = useOutletContext<ContextType>();
  const [lotName, setLotName] = useState("");
  const [lotDescription, setLotDescription] = useState("");
  const [lotAddress, setLotAddress] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const createNewLot = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setMessage("");

    if (!lotName || !lotDescription || !lotAddress) {
      setMessage("All fields are required");
      return;
    }
    try {
      const { error } = await supabase.from("ParkingLot").insert([
        {
          name: lotName,
          description: lotDescription,
          address: lotAddress,
        },
      ]);

      if (error) {
        setMessage("Error creating parking lot: " + error.message);
      } else {
        navigate("/dashboard/lots");
      }
    } catch (error) {
      setMessage("Unexpected error has occured");
    }
  };

  const cancelAction = () => {
    navigate("/dashboard/lots");
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between px-6 mt-4">
        <h2 className="text-white text-3xl font-bold">Add New Lot :D</h2>
      </div>
      <hr className="bg-neutral-600 h-px border-0 my-4" />
      <div className="flex flex-col w-3/5 pl-6 mt-10 mb-8">
        <form onSubmit={createNewLot}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-white mb-1">
              Lot Name
            </label>
            <input
              type="text"
              value={lotName}
              onChange={(e) => setLotName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-white bg-neutral-600"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-white mb-1">
              Lot Description
            </label>
            <input
              type="text"
              value={lotDescription}
              onChange={(e) => setLotDescription(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-white bg-neutral-600"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-white mb-1">
              Lot Address
            </label>
            <input
              type="text"
              value={lotAddress}
              onChange={(e) => setLotAddress(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-white bg-neutral-600"
            />
          </div>
          <div className="flex space-x-8">
            <button
              type="button"
              onClick={cancelAction}
              className="text-base bg-neutral-600 rounded-lg p-2 active:bg-pink-700 active:text-white hover:scale-105 transition-transform duration-300 mt-8 w-1/4 font-bold"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="text-base bg-pink-500 rounded-lg p-2 active:bg-pink-700 active:text-white hover:scale-105 transition-transform duration-300 mt-8 w-1/4 font-bold"
            >
              Create
            </button>
          </div>
          {message}
        </form>
      </div>
    </div>
  );
}
