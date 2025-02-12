import React, {useEffect, useState} from "react";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { useOutletContext } from "@remix-run/react";

import { InformationCircleIcon } from "@heroicons/react/24/outline";

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

interface EventCardProps {
  occupancyRecordId: string;
}

const EventCard: React.FC<EventCardProps> = ({ occupancyRecordId }) => {
  
  const { supabase } = useOutletContext<ContextType>();
  const [recordAttributes, setRecordAttributes] = useState<any>(null);
  const [cameraDetails, setCameraDetails] = useState<any>(null);
  const [parkingLotDetails, setParkingLotDetails] = useState<any>(null);
  const [vehicleDetails, setVehicleDetails] = useState<any>(null);
  const [profileDetails, setProfileDetails] = useState<any>(null);

  useEffect(() => {
    const fetchRecordAttributes = async () => {
      try {
        console.log("Fetching record attributes for ID:", occupancyRecordId); 
        const { data: recordData, error: recordError } = await supabase
          .from("OccupancyRecord")
          .select("created_at, vehicleId, parkingLotId, license_plate, cameraId")
          .eq("id", occupancyRecordId)
          .single();

        if (recordError) {
          console.error("Error fetching record attributes:", recordError);
          return;
        }

        const CreatedAt = new Date(recordData.created_at);
        const optionsDate = { weekday: 'long' as const, year: 'numeric' as const, month: 'short' as const, day: 'numeric' as const };
        const optionsTime = { hour: '2-digit' as const, minute: '2-digit' as const, second: '2-digit' as const, hour12: true };
        const formattedDate = CreatedAt.toLocaleDateString('en-US', optionsDate);
        const formattedTime = CreatedAt.toLocaleTimeString('en-US', optionsTime);

        // Manually format the date string without commas
        const [weekday, month, day, year] = formattedDate.split(/,?\s+/);
        const customFormattedDate = `${weekday} ${month} ${day} ${year}`;



        setRecordAttributes({
          ...recordData,
          date: customFormattedDate,
          time: formattedTime,
        });

        console.log("Fetched record attributes:", recordData);
        

        // Fetch camera details using cameraId
        const { data: cameraData, error: cameraError } = await supabase
          .from("Camera")
          .select("parkingLotId, position, name")
          .eq("id", recordData.cameraId)
          .single();

        if (cameraError) {
          console.error("Error fetching camera details:", cameraError);
          return;
        }

        setCameraDetails(cameraData);
        console.log("Fetched camera details:", cameraData);

        // Fetch parking lot details using parkingLotId
        const { data: parkingLotData, error: parkingLotError } = await supabase
          .from("ParkingLot")
          .select("name, capacity, current_occupancy")
          .eq("id", recordData.parkingLotId)
          .single();

        if (parkingLotError) {
          console.error("Error fetching parking lot details:", parkingLotError);
          return;
        }

        setParkingLotDetails(parkingLotData);
        console.log("Fetched parking lot details:", parkingLotData);

        // Fetch vehicle details using vehicleId
        const { data: vehicleData, error: vehicleError } = await supabase
          .from("Vehicle")
          .select("profile_id")
          .eq("id", recordData.vehicleId)
          .single();

        if (vehicleError) {
          console.error("Error fetching vehicle details:", vehicleError);
          return;
        }

        setVehicleDetails(vehicleData);
        console.log("Fetched vehicle details:", vehicleData);

         // Debugging log for profile_id
         console.log("Profile ID:", vehicleData.profile_id);

        // Fetch profile details using profile_id
        const { data: profileData, error: profileError } = await supabase
          .from("Profile")
          .select(" first_name, last_name")
          .eq("id", "b8313bd9-da4a-482e-b7dc-88914abd3bc2")
          .single();

        if (profileError) {
          console.error("Error fetching profile details:", profileError);
          return;
        }

        setProfileDetails(profileData);
        console.log("Fetched profile details:", profileData);


      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    fetchRecordAttributes();
  }, [supabase, occupancyRecordId]);
  
  if (!recordAttributes || !cameraDetails || !parkingLotDetails || !vehicleDetails || !profileDetails) {
    return null;
  }

  return (
    <div className="bg-slate-600 shadow-lg rounded-lg flex h-40 mx-8 my-6 hover:border-2 hover:border-neutral-500 hover:scale-105 transition-transform duration-300">
      <div className="bg-sky-900 rounded-l-lg py-4 pl-4 text-white border-slate-600 border-2 border-r-neutral-300" style={{ flex: "2" }}>
        <h1 className="text-l font-semibold">
          {recordAttributes.date}
        </h1>
        <h1 className="text-m font-semibold">
          {recordAttributes.time}
        </h1>
        <p className="text-gray-400 font-semibold mt-8">4 min ago</p>
      </div>
      <div className="text-m text-gray-200 py-3 pl-6" style={{ flex: "8" }}>
        <p>{cameraDetails.position}: {parkingLotDetails.name}</p>
        <h2 className="text-2xl font-semibold text-white pb-3">License Plate: {recordAttributes.license_plate}</h2>
        <div className="flex">
          <div className="w-80">
            <p>Vehicle Owner: {profileDetails.first_name} {profileDetails.last_name}</p>
            <p>Vehicle Type: Car</p>
          </div>
          <div className="">
            <p>Camera Captured: {cameraDetails.name}</p>
            <p>Current Occupancy: {parkingLotDetails.current_occupancy}/{parkingLotDetails.capacity}</p>
          </div>
        </div>
      </div>
      <div className="" style={{ flex: "2" }}>
        <InformationCircleIcon className="h-8 w-8 ml-24 mt-8" />
        <button className="bg-pink-500 text-white w-32 py-2 px-1 rounded-lg mt-6 text-sm font-semibold">
          Mark as Resolved
        </button>
      </div>
    </div>
  );
};

export default EventCard;