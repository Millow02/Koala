import { useParams, Link, useOutletContext } from "@remix-run/react";
import { useEffect, useState } from "react";
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { Database } from "~/types/supabase";
import { MagnifyingGlassIcon, XCircleIcon, CheckCircleIcon, AdjustmentsVerticalIcon } from "@heroicons/react/24/outline";

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
  const [occupancyRecords, setOccupancyRecords] = useState<Array<any>>([]);


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

        const { data: occupancyData, error: occupancyError } = await supabase
          .from("Occupancy")
          .select("id, vehicleId, vehicleOwner, LicensePlate, isPermitted")
          .eq("facilityId", parkingLotId)
          .eq("Status", "Active");

        if (occupancyError) {
          console.error("Error fetching occupancy records:", occupancyError);
        } else {
          setOccupancyRecords(occupancyData || []);
          console.log("Occupancy records:", occupancyData);
        }
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
        <div className="flex">

        
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
              
              {occupancyRecords.length > 0 ? (
                occupancyRecords.map((record) => (
                  <div key={record.id} className="flex h-28 bg-slate-700 m-5 items-center text-xl rounded-lg">
                    {record.isPermitted ? (
                      <CheckCircleIcon className="h-12 w-12 ml-8 mr-10 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircleIcon className="h-12 w-12 ml-8 mr-10 text-red-500 flex-shrink-0" />
                    )}
                    <div className="w-64 font-semibold">{record.LicensePlate || "Unknown"}</div>
                    <div className="w-48 font-semibold">{record.vehicleOwner || "Unknown"}</div>
                    <div className="flex-grow"></div>
                    <button className="mr-8 py-2 px-8 bg-pink-500 rounded-xl font-semibold hover:bg-pink-600 transition-colors">
                      View
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex h-28 justify-center items-center text-xl text-gray-400">
                  No vehicles currently in this parking lot
                </div>
              )}
              
              
            </div>
          </div>

          <div className="rounded-3xl border-2 border-neutral-600 ml-6 p-4" style={{height: "350px", width: "300px", backgroundColor: "#333842" }}>
            <div className="flex mb-6">
              <AdjustmentsVerticalIcon className="h-8 w-8 inline-block" />
              <div className="text-2xl font-semibold">
                Filters
              </div>
            </div>
            <div className="text-xl font-semibold">
              Sort By:
            </div>
            <div className="mt-2 mb-4">
              <select className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg">
                <option value="all">Latest First</option>
                <option value="recent">Oldest First</option>
                <option value="recent"> Name Alphabetical A-Z</option>
              </select>
            </div>
            <div className="text-xl font-semibold">
              Type:
            </div>
            <div className="mt-2 mb-4">
              <select className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg">
                <option value="all">All</option>
                <option value="Only Intruders">Only Intruders</option>
                <option value="Only Intruders">Only Admins</option>
              </select>
            </div>
            

            <div className="flex">
              <button className="bg-slate-500 text-white px-4 py-2 mt-4 rounded-lg mr-4">
                Reset
              </button>
              <button className="bg-pink-500 text-white px-4 py-2 mt-4 rounded-lg">
                Apply
              </button>
            </div>
            

          </div>
        </div>
      </div>
    </div>
  );
}