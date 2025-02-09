import React from "react";
import EventCard from "~/components/EventCard";


export default function Records() {
  return (
    <div className="relative">
      <div className="w-full px-12 py-4">
      <h1 className="text-3xl font-bold">Event Record</h1>
      <p className="pt-3">View all events of your facilities.</p>
      </div>
      <div className="flex justify-center">
        <div className="overflow-x-auto rounded-lg border-6 m-6 " style={{ height: "900px", width: "1100px" }}> 
          <div className="overflow-y-auto bg-slate-600 px-10 " >
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          </div>
        </div>
      </div>
    </div>
  );
};
