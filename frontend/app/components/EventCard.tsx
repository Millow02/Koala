import React, {useEffect, useState} from "react";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { useOutletContext } from "@remix-run/react";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

interface EventCardProps {
  occupancyRecordId: string;
  onRecordUpdate?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ occupancyRecordId, onRecordUpdate }) => {
  
  const { supabase } = useOutletContext<ContextType>();
  const [recordAttributes, setRecordAttributes] = useState<any>(null);
  const [cameraDetails, setCameraDetails] = useState<any>(null);
  const [parkingLotDetails, setParkingLotDetails] = useState<any>(null);
  const [vehicleDetails, setVehicleDetails] = useState<any>(null);
  const [profileDetails, setProfileDetails] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Define fetchRecordAttributes outside the useEffect
  const fetchRecordAttributes = async () => {
    try {
      console.log("Fetching record attributes for ID:", occupancyRecordId); 
      const { data: recordData, error: recordError } = await supabase
        .from("OccupancyEvent")
        .select("created_at, vehicleId, license_plate, cameraId, status, image")
        .eq("id", occupancyRecordId)
        .single();

      if (recordError) {
        console.error("Error fetching record attributes:", recordError);
        return;
      }

      const CreatedAt = new Date(recordData.created_at);
      const optionsDate = { weekday: 'short' as const, year: 'numeric' as const, month: 'short' as const, day: 'numeric' as const };
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
        .eq("id", cameraData.parkingLotId)
        .single();

      if (parkingLotError) {
        console.error("Error fetching parking lot details:", parkingLotError);
        return;
      }
      setParkingLotDetails(parkingLotData);
      
      // Fetch vehicle details and profile details only if status is "Processed"
      if (recordData.status === "Processed") {
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
        
        // Fetch profile details using profile_id
        const { data: profileData, error: profileError } = await supabase
          .from("Profile")
          .select(" first_name, last_name")
          .eq("id", vehicleData.profile_id)
          .single();
      
        if (profileError) {
          console.error("Error fetching profile details:", profileError);
          return;
        }
        setProfileDetails(profileData);
      } else if (recordData.status === "Attention-Required") {
        // For Attention-Required status, set default values
        setVehicleDetails({ profile_id: null });
        setProfileDetails({ first_name: "Unknown", last_name: "Driver" });
        console.log("Attention required for license plate:", recordData.license_plate);
      }
    } catch (err) {
      console.error("OccupancyID:", occupancyRecordId," Unexpected error:", err);
    }
  };

  // Single useEffect to fetch data when component mounts
  useEffect(() => {
    fetchRecordAttributes();
  }, [supabase, occupancyRecordId]);

  const handleResolveClick = () => {
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openDetailsModal = () => {
    setShowDetailsModal(true);
  };
  
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
  };
  
  const handleResolve = async () => {
    try {
      // Update the record status to "Processed"
      const { error } = await supabase
        .from("OccupancyEvent")
        .update({ status: "Processed" })
        .eq("id", occupancyRecordId);
        
      if (error) {
        console.error("Error updating record status:", error);
      } else {
        console.log("Record marked as resolved successfully");
        // Refresh the record data
        fetchRecordAttributes();
      }
    } catch (err) {
      console.error("Error in resolve operation:", err);
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from("OccupancyEvent")
        .update({ status: "Archived" })
        .eq("id", occupancyRecordId);
        
      if (error) {
        console.error("Error archiving record:", error);
      } else {
        console.log("Record archived successfully");

        console.log("onRecordUpdate callback exists:", !!onRecordUpdate);
        
        if (onRecordUpdate) {
          onRecordUpdate();
        }
      }
    } catch (err) {
      console.error("Error in archive operation:", err);
    }
  };

  if (!recordAttributes || !cameraDetails || !parkingLotDetails || !vehicleDetails || !profileDetails) {
    return null;
  }

  return (
    <>
      <div className="bg-slate-600 shadow-lg rounded-lg flex h-40 mx-8 my-6 hover:border-4 hover:border-neutral-500 transition-transform duration-300"
        onClick={openDetailsModal}>
        <div className={`${recordAttributes.status === "Attention-Required" ? "bg-red-700" : "bg-sky-900"} rounded-l-lg py-4 pl-4 text-white border-slate-600 border-2 border-r-neutral-300`} style={{ flex: "2" }}>
          <h1 className="text-l font-semibold">
            {recordAttributes.date}
          </h1>
          <h1 className="text-m font-semibold">
            {recordAttributes.time}
          </h1>
          <p className="text-gray-400 font-semibold mt-8">X min ago</p>
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
          <XMarkIcon className="h-6 w-6 ml-24 mt-8 rounded-full text-neutral-400 hover:text-white hover:cursor-pointer"
          onClick={handleArchive} />
          {recordAttributes.status === "Attention-Required" && (
            <button 
              onClick={(e) => {
                e.stopPropagation(); // This prevents the click from bubbling up to the card
                handleResolveClick();
              }} 
              className="bg-pink-500 text-white w-32 py-2 px-1 rounded-lg mt-6 text-sm font-semibold">
              Mark as Resolved
            </button>
          )}
        </div>
      </div>
      


      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-700 p-8 rounded-xl shadow-xl w-3/4 max-w-5xl relative">
            <button 
              onClick={closeDetailsModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            <h2 className="text-2xl font-semibold text-white mb-6">Event Details</h2>
            
            <div className="flex flex-col md:flex-row gap-8">

              <div className="md:w-2/5 bg-slate-800 rounded-lg overflow-hidden h-72">
                {recordAttributes.image ? (
                  <img 
                    src={recordAttributes.image} 
                    alt="Vehicle capture"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const noImageDiv = document.createElement('div');
                        noImageDiv.className = "h-full w-full flex items-center justify-center";
                        
                        const textSpan = document.createElement('span');
                        textSpan.className = "text-gray-400 text-xl";
                        textSpan.innerText = "No image available";
                        
                        noImageDiv.appendChild(textSpan);
                        parent.replaceChild(noImageDiv, e.currentTarget);
                      }
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-gray-400 text-xl">No image available</span>
                  </div>
                )}
              </div>
              
              {/* Details section */}
              <div className="md:w-3/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-200">
                  <div>
                    <p className="text-gray-400 text-sm">Date & Time</p>
                    <p className="text-xl">{recordAttributes.date} at {recordAttributes.time}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Location</p>
                    <p className="text-xl">{cameraDetails.position}: {parkingLotDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">License Plate</p>
                    <p className="text-xl font-semibold">{recordAttributes.license_plate}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className={`text-xl font-semibold ${recordAttributes.status === "Attention-Required" ? "text-red-500" : "text-green-500"}`}>
                      {recordAttributes.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Owner</p>
                    <p className="text-xl">{profileDetails.first_name} {profileDetails.last_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Camera</p>
                    <p className="text-xl">{cameraDetails.name}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400 text-sm">Occupancy</p>
                    <p className="text-xl">{parkingLotDetails.current_occupancy} of {parkingLotDetails.capacity} spaces filled</p>
                  </div>
                </div>
                
                {recordAttributes.status === "Attention-Required" && (
                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={handleResolveClick}
                      className="bg-pink-500 text-white py-2 px-6 rounded-lg hover:bg-pink-600">
                      Mark as Resolved
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-700 p-6 rounded-xl shadow-xl w-96">
            <h2 className="text-xl font-bold text-white mb-4">Resolve Record</h2>
            <p className="text-gray-200 mb-6">
              Are you sure you want to change the status to "Processed"?
            </p>
            <div className="flex justify-end gap-4">
              <button 
                onClick={closeModal}
                className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600">
                Cancel
              </button>
              <button 
                onClick={handleResolve}
                className="bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 ">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventCard;