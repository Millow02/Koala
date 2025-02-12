import React, { useEffect,useState } from "react";
import EventCard from "~/components/EventCard";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { useOutletContext } from "@remix-run/react";

const mockOccupancyRecordIds = [
  { id: "1" },
  { id: "2" },
  { id: "3" },
  // Add more mock records as needed
];


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


  useEffect(() => {
    const fetchEventRecordIds = async () => {
      if (!user) {
        return;
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
          return;
        }

        const orgId = profileData?.organizationId || "no id found";
        setOrganizationId(orgId);
        console.log("Fetched organization ID:", orgId);

        // Fetch parking lot IDs using organization ID
        const { data: parkingLotData, error: parkingLotError } = await supabase
          .from("ParkingLot")
          .select("id")
          .eq("organizationId", orgId);

        if (parkingLotError) {
          console.error("Error fetching parking lot IDs:", parkingLotError);
          return;
        }

        const lotsIds = parkingLotData?.map((lot: { id: string }) => lot.id) || [];
        setParkingLotIds(lotsIds);
        console.log("Fetched parking lot IDs:", lotsIds);

        // Fetch camera IDs using parking lot IDs
        const { data: cameraData, error: cameraError } = await supabase
          .from("Camera")
          .select("id")
          .in("parkingLotId", lotsIds);

        if (cameraError) {
          console.error("Error fetching camera IDs:", cameraError);
          return;
        }

        const cameraIds = cameraData?.map((camera: { id: string }) => camera.id) || [];
        setCameraIds(cameraIds);
        console.log("Fetched camera IDs:", cameraIds);

        // Fetch occupancy records using camera IDs
        const { data: occupancyData, error: occupancyError } = await supabase
          .from("OccupancyRecord")
          .select("id")
          .in("cameraId", cameraIds);
      
        if (occupancyError) {
          console.error("Error fetching occupancy records:", occupancyError);
          return;
        }

        const occupancyRecordIds = occupancyData?.map((record: { id: string }) => record.id) || [];
        setOccupancyRecordIds(occupancyRecordIds);
        console.log("Fetched occupancy record IDs:", occupancyRecordIds);


      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };
    fetchEventRecordIds();
  }, [supabase, user]);

  

  







  return (
    <div className="relative">
      <div className="w-full px-12 py-4">
      <h1 className="text-3xl font-bold">Event Record</h1>
      <p className="pt-3">View all events of your facilities.</p>
      </div>
      <div className="flex justify-center">
        <div className="overflow-x-auto rounded-lg m-6 border-neutral-600 " style={{ height: "900px", width: "1100px", borderWidth: "2px", backgroundColor: "#333842"  }}> 
          <div className="overflow-y-auto rounded-lg " style={{ backgroundColor: "#333842" }} >
            {occupancyRecordIds.map((record) => (
              <EventCard occupancyRecordId={record} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
