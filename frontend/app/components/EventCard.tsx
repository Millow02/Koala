import React from "react";

export default function EventCard() {
  return (
    <div className="bg-white shadow-lg rounded-lg m-5 flex h-40">
        <div className="bg-pink-200 rounded-l-lg py-4 pl-4" style={{ flex: "2" }}>
            <h1 className="text-l font-semibold text-black">
                Monday Feb 3rd 2025
            </h1>
            <h1 className="text-m font-semibold text-black">
                2:00:00 PM
            </h1>
            <p className="text-neutral-500 font-semibold mt-8">1 min ago</p>
        </div>
        <div className="text-black py-3 pl-6" style={{ flex: "8" }}>
            <p className="text-m text-gray-500">Entry: Concordia LB Parking Lot</p>
            <h2 className="text-xl font-semibold text-black pb-3">License Plate: LE3 S68</h2>
            <div className="flex">
                <div className="w-80">
                    <p className="text-m text-gray-500">Vehicle Owner: Ronald McDonald</p>
                    <p className="text-m text-gray-500">Vehicle Type: Car</p>
                </div>
                <div className="">
                <p className="text-m text-gray-500">Vehicle Color: Red</p>
                    <p className="text-m text-gray-500">Current Occupancy: 60/100</p>
                </div>
            </div>
            
            
        </div>
      
        <div className="" style={{ flex: "2" }}>
            <button className="bg-blue-500 text-white w-32 py-3 rounded-lg mt-6">
            Mark as Resolved
            </button>
            <button className="bg-blue-500 text-white w-32 py-3 rounded-lg mt-2">
            View Details
            </button>
        </div>
    </div>
  );
};