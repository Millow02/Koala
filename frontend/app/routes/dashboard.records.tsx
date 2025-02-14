import React, { useEffect, useState } from "react";
import EventCard from "~/components/EventCard";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { useOutletContext } from "@remix-run/react";

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
        .from("OccupancyRecord")
        .select("id")
        .in("cameraId", cameraIds)
        .eq("status", "Processed");
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
    setLoading(true);
    const occupancyRecordIds = await queryEventRecordIds();
    setOccupancyRecordIds(occupancyRecordIds);

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
        <p className="pt-3">View all events of your facilities.</p>
      </div>
      <div className="flex justify-center">
        <div className="overflow-x-auto rounded-lg m-6 border-neutral-600" style={{ height: "900px", width: "1100px", borderWidth: "2px", backgroundColor: "#333842" }}>
          <div className="overflow-y-auto rounded-lg" style={{ backgroundColor: "#333842" }}>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="loader"></div>
              </div>
            ) : (
              occupancyRecordIds.map((record) => (
                <EventCard key={record} occupancyRecordId={record} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}