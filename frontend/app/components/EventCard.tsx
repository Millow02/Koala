import React, {useEffect, useState} from "react";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { useOutletContext } from "@remix-run/react";
import { 
  ClockIcon, 
  UserIcon, 
  CameraIcon, 
  MapPinIcon, 
  IdentificationIcon,
  XMarkIcon, 
  InformationCircleIcon 
} from "@heroicons/react/24/outline";

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
  const [isFullscreenImage, setIsFullscreenImage] = useState(false);
  
  
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

  const toggleFullscreenImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullscreenImage(!isFullscreenImage);
  };


  if (!recordAttributes || !cameraDetails || !parkingLotDetails || !vehicleDetails || !profileDetails) {
    return null;
  }

  return (<>
    <div className="bg-slate-600 shadow-lg rounded-lg flex h-40 mx-8 my-6 hover:border-2 hover:border-white transition-transform duration-300"
      onClick={openDetailsModal}>
      <div 
        className="bg-sky-900 rounded-l-lg text-white border-slate-600 border-2 border-r-neutral-300 flex flex-col items-center justify-center" 
        style={{ flex: "3" }} 
      >         
        <h1 className="text-lg font-semibold text-center">
          {recordAttributes.date.split(' ')[1]} {recordAttributes.date.split(' ')[2]} {recordAttributes.date.split(' ')[3]}
        </h1>

        <h2 className="text-md font-medium mb-3 text-center bg-black/20 rounded-full px-3 py-1">
          {recordAttributes.time}
        </h2>
        
        <div className="mt-1 flex items-center px-3 text-center">

          <p className="text-sm text-center line-clamp-2">
            {parkingLotDetails.name}
          </p>
        </div>
        
        <div className="flex items-center justify-center text-xs text-gray-300 px-3">
          <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0 text-gray-300" />
          <p className="text-center line-clamp-1">
            {cameraDetails.position}
          </p>
        </div>
        
        
      </div>
      <div className="text-m text-gray-200 py-8 pl-6" style={{ flex: "8" }}>
        <div className="flex">

          <div className="flex-1 my-2">
            <div className="flex items-center">
              <h2 className="text-4xl font-semibold text-white">
                <IdentificationIcon className="h-8 w-8 inline-block mr-2 mb-1 text-gray-400" />
                {recordAttributes.license_plate}
              </h2>
              
              <div className={`ml-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                recordAttributes.status === "Attention-Required" 
                  ? "bg-red-500/30 text-red-300 border border-red-500" 
                  : recordAttributes.status === "Processed" 
                  ? "bg-green-500/30 text-green-400 border border-green-500"
                  : "bg-gray-500/30 text-gray-400 border border-gray-500"
              }`}>
                {recordAttributes.status}
              </div>
            </div>
            

            <div className="flex items-center mt-2">
              <p className="text-xl font-semibold text-white flex items-center w-64">
                <UserIcon className="h-6 w-6 mr-2 text-gray-400 flex-shrink-0" />
                <span className="truncate">{profileDetails.first_name} {profileDetails.last_name}</span>
              </p>
            
              <p className="text-xl font-semibold text-white flex items-center">
                <CameraIcon className="h-6 w-6 mr-2 text-gray-400 flex-shrink-0" />
                <span>{cameraDetails.name}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between items-end py-4 pr-6" style={{ flex: "2" }}>
        <div className="p-2 hover:bg-slate-700 rounded-full transition-colors">
          <XMarkIcon 
            className="h-6 w-6 text-neutral-400 hover:text-white cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleArchive(e);
            }} 
          />
        </div>
        
        <div className="mt-auto mb-4">
          {recordAttributes.status === "Attention-Required" && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleResolveClick();
              }} 
              className="bg-pink-500 text-white py-2 px-8 rounded-lg hover:bg-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm font-medium"
            >
              Resolve
            </button>
          )}
        </div>
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
                  onClick={toggleFullscreenImage}
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
                  <div className={`inline-flex items-center px-3 py-1 mt-1 rounded-full text-sm font-medium ${
                    recordAttributes.status === "Attention-Required" 
                      ? "bg-red-500/30 text-red-400 border border-red-500" 
                      : recordAttributes.status === "Processed" 
                      ? "bg-green-500/30 text-green-400 border border-green-500"
                      : "bg-gray-500/30 text-gray-400 border border-gray-500"
                  }`}>
                    {recordAttributes.status}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Owner</p>
                  <p className="text-xl">{profileDetails.first_name} {profileDetails.last_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Camera</p>
                  <p className="text-xl">{cameraDetails.name}</p>
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
    {isFullscreenImage && recordAttributes.image && (
      <div 
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
        onClick={toggleFullscreenImage}
      >
        <div className="relative w-full h-full p-4 md:p-8 flex items-center justify-center">
          <XMarkIcon 
            className="absolute top-4 right-4 h-8 w-8 text-white hover:text-gray-300 cursor-pointer" 
            onClick={toggleFullscreenImage} 
          />
          <img 
            src={recordAttributes.image} 
            alt="Vehicle capture fullscreen" 
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    )}
  </>);
};

export default EventCard;