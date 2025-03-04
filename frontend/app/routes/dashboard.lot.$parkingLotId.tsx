import { useParams, Link, useOutletContext } from "@remix-run/react";
import { useEffect, useState } from "react";
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { Database } from "~/types/supabase";
import { MagnifyingGlassIcon, XCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

type ParkingLot = {
  name: string;
};

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

export default function ParkingLotDetails() {
  const { parkingLotId } = useParams();
  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useOutletContext<ContextType>();

  useEffect(() => {
    const fetchParkingLot = async () => {
      if (!parkingLotId) {
        setError("Parking lot ID is required");
        return;
      }

      const { data, error } = await supabase
        .from("ParkingLot")
        .select("name")
        .eq("id", parkingLotId)
        .single();

      if (error) {
        setError("Parking lot not found");
        console.error("Error fetching parking lot:", error);
      } else {
        setParkingLot(data);
        console.log(data);
      }
    };

    fetchParkingLot();
  }, [parkingLotId, supabase]);

  if (error) {
    return <div>{error}</div>;
  }

  if (!parkingLot) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative">
      <div className="w-full px-12 py-4">
        <h1 className="text-3xl font-bold">{parkingLot.name}</h1>
        <hr className="border-pink-500 border-1 my-6" />
        <div className="border-neutral-600 border-2 rounded-3xl width" style={{ backgroundColor: "#333842", width: "900px" }}>
          <div className="flex justify-center py-4">
            <h2 className="text-2xl font-semibold">Vehicles on Premise</h2>
          </div>
          <hr className="border-neutral-600 border-2" />
          <div className="relative mx-10 my-4">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search vehicle"
              className="block w-full bg-slate-600 border-none rounded-xl py-4 pl-12 pr-4 text-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>
          <div className="overflow-y-auto rounded-b-3xl custom-scrollbar scrollbar-padding-bottom" style={{ height: "600px" }}>
            {Array(10).fill(0).map((_, index) => (
              <div key={index} className="flex h-28 bg-slate-700 m-5 items-center text-xl rounded-lg">
                <CheckCircleIcon className="h-12 w-12 ml-8 mr-10 text-green-500 flex-shrink-0" />
                <div className="w-64 font-semibold">NAYNAY</div>
                <div className="w-48 font-semibold">Bob Mcboberson</div>
                <div className="flex-grow"></div>
                <button className="mr-8 py-2 px-8 bg-pink-500 rounded-xl font-semibold hover:bg-pink-600 transition-colors">
                  View
                </button>
              </div>
            ))}
            
          </div>
        </div>
      </div>
    </div>
  );
}