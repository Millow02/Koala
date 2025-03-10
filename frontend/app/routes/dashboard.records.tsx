import React, { useEffect, useState } from "react";
import EventCard from "~/components/EventCard";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { useOutletContext } from "@remix-run/react";
import { AdjustmentsVerticalIcon, ArrowPathIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

export default function Records() {
  const { user, supabase } = useOutletContext<ContextType>();
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [parkingLotIds, setParkingLotIds] = useState<string[]>([]);
  const [cameraIds, setCameraIds] = useState<string[]>([]);
  const [occupancyRecordIds, setOccupancyRecordIds] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const arraysEqual = (a: any[], b: any[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  const queryEventRecordIds = async () => {
    if (!user) {
      return [];
    }

    try {
      // Fetch organization ID
      const { data: profileData, error: profileError } = await supabase
        .from("Profile")
        .select("organizationId")
        .eq("id", user.id)
        .single();
      if (profileError) {
        console.error("Error fetching organization ID:", profileError);
        return [];
      }
      const orgId = profileData?.organizationId || "no id found";
      setOrganizationId(orgId);
      //console.log("Fetched organization ID:", orgId);


      // Fetch parking lot IDs using organization ID
      const { data: parkingLotData, error: parkingLotError } = await supabase
        .from("ParkingLot")
        .select("id")
        .eq("organizationId", orgId);
      if (parkingLotError) {
        console.error("Error fetching parking lot IDs:", parkingLotError);
        return [];
      }
      const lotsIds = parkingLotData?.map((lot: { id: string }) => lot.id) || [];
      setParkingLotIds(lotsIds);
      //console.log("Fetched parking lot IDs:", lotsIds);


      // Fetch camera IDs using parking lot IDs
      const { data: cameraData, error: cameraError } = await supabase
        .from("Camera")
        .select("id")
        .in("parkingLotId", lotsIds);
      if (cameraError) {
        console.error("Error fetching camera IDs:", cameraError);
        return [];
      }
      const cameraIds = cameraData?.map((camera: { id: string }) => camera.id) || [];
      setCameraIds(cameraIds);
      //console.log("Fetched camera IDs:", cameraIds);


      // Fetch occupancy records using camera IDs
      const { data: occupancyData, error: occupancyError } = await supabase
        .from("OccupancyEvent")
        .select("id")
        .in("cameraId", cameraIds)
        .in("status", ["Processed", "Attention-Required"]);
      if (occupancyError) {
        console.error("Error fetching occupancy records:", occupancyError);
        return [];
      }
      const newOccupancyRecordIds = occupancyData?.map((record: { id: string }) => record.id) || [];
      console.log("Fetched occupancy record IDs:", newOccupancyRecordIds);

      return newOccupancyRecordIds;

    } catch (err) {
      console.error("Unexpected error:", err);
      return [];
    }
  };






  const updateEventRecordIds = async () => {
    console.log("updateEventRecordIds called");
    setLoading(true);
    const newOccupancyRecordIds = await queryEventRecordIds();
    console.log("Previous records:", occupancyRecordIds);
    console.log("New records:", newOccupancyRecordIds);
    setOccupancyRecordIds(newOccupancyRecordIds);

    setLoading(false);

  };





  useEffect(() => {
    updateEventRecordIds();

    const interval = setInterval( async () => {
      console.log("Checking for new occupancy records");
      const newOccupancyRecordIds =  await queryEventRecordIds();
      if (!arraysEqual(newOccupancyRecordIds, occupancyRecordIds)) {
        setOccupancyRecordIds(newOccupancyRecordIds);
      } else {
        console.log("No new occupancy records found.");
      }
      


    }, 5000);


    return () => clearInterval(interval);
  }, [supabase, user]);


  






  return (
    <div className="relative">
      <div className="w-full px-12 py-4">
        <h1 className="text-3xl font-bold">Event Record</h1>
        <hr className="border-pink-500 border-1 mt-6" />
      </div>
      <div className="flex justify-center" style={{minWidth: "1200px"}}>
        <div className="rounded-lg m-6 border-neutral-600" style={{ height: "800px", width: "1000px", borderWidth: "2px", backgroundColor: "#333842" }}>
          <div className="flex items-center py-4 px-6 relative">
            <h2 className="text-2xl font-semibold absolute left-1/2 transform -translate-x-1/2">All Facility Events</h2>
            <div className="ml-auto flex items-center text-gray-400 cursor-pointer p-1 rounded-lg hover:text-pink-400 hover:bg-gray-500 transition-colors">
              <span className="mr-1">Refresh</span>
              <ArrowPathIcon className="h-5 w-5" />
            </div>
          </div>
          <hr className="border-neutral-600 border-2" />
          <div className="relative mx-10 my-4">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search Event"
              className="block w-full bg-slate-600 border-none rounded-xl py-4 pl-12 pr-4 text-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>
          <div className="overflow-x-auto" >
            <div className="overflow-y-auto rounded-lg" style={{ backgroundColor: "#333842" }}>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="loader"></div>
                </div>
              ) : (
                occupancyRecordIds.map((record) => (
                  <EventCard 
                    key={record} 
                    occupancyRecordId={record}
                    onRecordUpdate={updateEventRecordIds} 
                  />
                ))
              )}
            </div>
          </div>
        </div>
        

        <div className="rounded-lg border-2 border-neutral-600 mt-6 p-4" style={{height: "450px", width: "250px", backgroundColor: "#333842" }}>
          <div className="flex mb-6">
            <AdjustmentsVerticalIcon className="h-8 w-8 inline-block" />
            <div className="text-2xl font-semibold">
              Filters
            </div>
          </div>
          <div className="text-xl font-semibold">
            By Date:
          </div>
          <div className="mt-2 mb-4">
            <select className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg">
              <option value="all">All</option>
              <option value="recent">Recent</option>
            </select>
          </div>
          <div className="text-xl font-semibold">
            By Type:
          </div>
          <div className="mt-2 mb-4">
            <select className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg">
              <option value="all">All</option>
              <option value="Only Intruders">Only Intruders</option>
            </select>
          </div>
          <div className="text-xl font-semibold">
            By Location:
          </div>
          <div className="mt-2 mb-4">
            <select className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg">
              <option value="all">All</option>
              <option>Camera 1</option>
              <option>Camera 2</option>
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
  );
}