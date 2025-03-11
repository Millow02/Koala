import { useParams, Link, useOutletContext } from "@remix-run/react";
import { useEffect, useState } from "react";
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { Database } from "~/types/supabase";
import { MagnifyingGlassIcon, XCircleIcon, CheckCircleIcon, AdjustmentsVerticalIcon, PresentationChartBarIcon, ArrowPathIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Chart, Doughnut } from "react-chartjs-2";

type ParkingLot = {
  name: string;
};

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};


const doughnutLabelPlugin = {
  id: 'doughnutLabel',
  afterDatasetsDraw(chart: any) {
    const { ctx, data } = chart;
    const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
    const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
    
    ctx.save();
    ctx.textAlign = 'center';
    
    const labels = chart.options.plugins.doughnutLabel.labels || [];
    
    labels.forEach((label: any, i: number) => {
      const fontStyle = label.font || {};
      ctx.font = `${fontStyle.weight || ''} ${fontStyle.size || '16px'} ${fontStyle.family || 'Arial'}`;
      ctx.fillStyle = label.color || '#fff';
      
      const lineHeight = parseInt(fontStyle.size || '16', 10) * 1.2;
      const offset = (labels.length - 1) * lineHeight / 2;
      
      // Add a significant vertical offset to move text lower
      const verticalOffset = 10; // Changed from 0 to 15 pixels
      const y = centerY + i * lineHeight - offset + verticalOffset;
      
      ctx.fillText(label.text, centerX, y);
    });
    
    ctx.restore();
  }
};

ChartJS.register(ArcElement, Tooltip, Legend, doughnutLabelPlugin);


export default function ParkingLotDetails() {
  const { parkingLotId } = useParams();
  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useOutletContext<ContextType>();
  const [occupancyRecords, setOccupancyRecords] = useState<Array<any>>([]);
  const [totalCapacity, setTotalCapacity] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [cameras, setCameras] = useState<Array<any>>([]);

  const openVehicleDetailsModal = (record: any) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };
  
  const closeVehicleDetailsModal = () => {
    setIsModalOpen(false);
  };


  useEffect(() => {
    const fetchParkingLot = async () => {
      if (!parkingLotId) {
        setError("Parking lot ID is required");
        return;
      }

      const { data, error } = await supabase
        .from("ParkingLot")
        .select("name, capacity")
        .eq("id", parkingLotId)
        .single();

      if (error) {
        setError("Parking lot not found");
        console.error("Error fetching parking lot:", error);
      } else {
        setParkingLot(data);
        setTotalCapacity(data.capacity || 0);
        console.log(data);

        const { data: occupancyData, error: occupancyError } = await supabase
          .from("Occupancy")
          .select("id, vehicleId, vehicleOwner, LicensePlate, isPermitted, entryTime")
          .eq("facilityId", parkingLotId)
          .eq("Status", "Active");

        if (occupancyError) {
          console.error("Error fetching occupancy records:", occupancyError);
        } else {
          setOccupancyRecords(occupancyData || []);
          console.log("Occupancy records:", occupancyData);
        }

        const { data: cameraData, error: cameraError } = await supabase
          .from("Camera")
          .select("id, name, position, status")
          .eq("parkingLotId", parkingLotId);

        if (cameraError) {
          console.error("Error fetching cameras:", cameraError);
        } else {
          setCameras(cameraData || []);
          console.log("Camera data:", cameraData);
        }


      }
    };

    fetchParkingLot();
  }, [parkingLotId, supabase]);

  const currentOccupancy = occupancyRecords.length;
  const currentAvailability = totalCapacity - currentOccupancy;

  const chartData = {
    labels: ["Occupied", "Available"],
    datasets: [
      {
        data: [currentOccupancy, currentAvailability],
        backgroundColor: [
          '#EC4899', 
          '#475569', 
        ],
        borderColor: [
          '#BE185D', 
          '#4B5563', 
        ],
        borderWidth: 1,
        hoverOffset: 4
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', // Makes the doughnut hole larger
    plugins: {
      legend: {
        display: false,
        position: 'bottom' as const,
        labels: {
          color: 'white', // White text for legend labels
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      doughnutLabel: {
        labels: [
          {
            text: `${currentOccupancy}`,
            font: {
              size: '36px',
              weight: 'bold'
            },
            color: '#EC4899'
          }
        ]
      }
    },
  };

  if (error) {
    return <div>{error}</div>;
  }

  if (!parkingLot) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative">
      <div className="w-full px-12 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{parkingLot.name}</h1>
          <div className="flex items-center">
            <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
            <span className="text-green-500 font-medium">Active</span>
          </div>
        </div>
        <hr className="border-pink-500 border-1 my-6" />
        <div className="flex">

        
          <div className="border-neutral-600 border-2 rounded-3xl width" style={{ backgroundColor: "#333842", width: "900px" }}>
            <div className="flex items-center py-4 px-6 relative">
              <h2 className="text-2xl font-semibold absolute left-1/2 transform -translate-x-1/2">Vehicles on Premise</h2>
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
                    <button 
                    className="mr-8 py-2 px-8 bg-pink-500 rounded-xl font-semibold hover:bg-pink-600 transition-colors"
                    onClick={() => openVehicleDetailsModal(record)}
                    >
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

          <div>

          
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

            <div className="rounded-3xl border-2 border-neutral-600 ml-6 p-4 mt-6" style={{height: "390px", width: "300px", backgroundColor: "#333842" }}>
              <div className="flex mb-6">
                <PresentationChartBarIcon className="h-8 w-8 inline-block" />
                <div className="text-2xl font-semibold">
                  Occupancy
                </div>
              </div>
              <div className="h-48 relative mb-4">
                <Doughnut data={chartData} options={chartOptions} />
              </div>
              <div className="flex justify-between text-center mt-6 mx-5">
                <div>
                  <p className="text-gray-400 text-lg">Available</p>
                  <p className="text-2xl font-bold">{currentAvailability}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-lg">Capacity</p>
                  <p className="text-2xl font-bold">{totalCapacity}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
        
        <div className="flex mt-12">
        <div className="border-neutral-600 border-2 rounded-3xl width" style={{ backgroundColor: "#333842", width: "900px" }}>
            <div className="flex items-center py-4 px-6 relative">
              <h2 className="text-2xl font-semibold absolute left-1/2 transform -translate-x-1/2">Camera Statuses</h2>
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
                placeholder="Search Camera"
                className="block w-full bg-slate-600 border-none rounded-xl py-4 pl-12 pr-4 text-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white"
              />
            </div>
            <div className="overflow-y-auto rounded-b-3xl custom-scrollbar scrollbar-padding-bottom" style={{ height: "600px" }}>
              {cameras.length > 0 ? (
                cameras.map((camera) => (
                  <div key={camera.id} className="flex h-28 bg-slate-700 m-5 items-center text-xl rounded-lg">
                    {/* Status indicator */}
                    <div className={`h-12 w-12 ml-8 mr-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      camera.status === 'Active' ? 'bg-green-500/20' : 'bg-yellow-500/20'
                    }`}>
                      <div className={`h-6 w-6 rounded-full ${
                        camera.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                    </div>
                    
                    {/* Camera details */}
                    <div className="flex flex-col">
                      <div className="font-semibold">{camera.name || "Unnamed Camera"}</div>
                      <div className="text-base text-gray-400">ID: {camera.id}</div>
                    </div>
                    
                    <div className="flex-grow"></div>
                    
                    {/* Position */}
                    <div className="mr-8 text-lg">
                      <span className="text-gray-400">Position: </span>
                      {camera.position || "Not specified"}
                    </div>
                    
                    {/* Status */}
                    <div className={`mr-8 py-2 px-6 rounded-lg font-medium ${
                      camera.status === 'Active' ? 'bg-green-500/20 text-green-400' : 
                      camera.status === 'Maintenance' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {camera.status || "Unknown"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-28 justify-center items-center text-xl text-gray-400">
                  No cameras registered for this parking lot
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full mx-4 overflow-hidden">
            {/* Modal header */}
            <div className="border-b border-slate-700 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Vehicle Details</h2>
              <button 
                className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                onClick={closeVehicleDetailsModal}
              >
                <XCircleIcon className="h-8 w-8" />
              </button>
            </div>
            
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 flex items-center mb-2">
                  {selectedRecord.isPermitted ? (
                    <div className="flex items-center text-green-500">
                      <CheckCircleIcon className="h-8 w-8 mr-2" />
                      <span className="text-xl font-semibold">Authorized Vehicle</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-500">
                      <XCircleIcon className="h-8 w-8 mr-2" />
                      <span className="text-xl font-semibold">Unauthorized Vehicle</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-gray-400 mb-1">License Plate</p>
                  <p className="text-2xl font-semibold">{selectedRecord.LicensePlate || "Unknown"}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 mb-1">Owner</p>
                  <p className="text-2xl font-semibold">{selectedRecord.vehicleOwner || "Unknown"}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 mb-1">Vehicle ID</p>
                  <p className="text-xl">{selectedRecord.vehicleId || "N/A"}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 mb-1">Entered At</p>
                  <p className="text-xl">
                    {selectedRecord.entryTime || "Unknown"}
                  </p>
                </div>
                
                
              </div>
              
              <div className="mt-8 space-y-4">
                <h3 className="text-xl font-semibold">Actions</h3>
                <div className="flex gap-4">
                  <button className="flex-1 py-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
                    Contact Owner
                  </button>
                  {!selectedRecord.isPermitted && (
                    <button className="flex-1 py-3 bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors">
                      Set to Authorized
                    </button>
                  )}
                </div>
                
                
                <button className="w-full py-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center mt-4">
                  <ArchiveBoxIcon className="h-5 w-5 mr-2" />
                  <span>Set Status to Archived</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
}