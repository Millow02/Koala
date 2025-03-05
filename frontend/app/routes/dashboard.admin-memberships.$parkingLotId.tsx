import { useParams, Link, useOutletContext } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { Database } from "~/types/supabase";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { EllipsisIcon } from "lucide-react";

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

type ParkingLot = Database["public"]["Tables"]["ParkingLot"]["Row"];

type MembershipWithRelations =
  Database["public"]["Tables"]["Membership"]["Row"] & {
    Profile: Database["public"]["Tables"]["Profile"]["Row"];
    Vehicle: Database["public"]["Tables"]["Vehicle"]["Row"];
  };

export default function AdminMemberships() {
  const { parkingLotId } = useParams();
  const { user, supabase } = useOutletContext<ContextType>();

  const [parkingLot, setParkingLot] = useState<ParkingLot>();
  const [memberships, setMemberships] = useState<MembershipWithRelations[]>([]);
  const [membershipId, setMembershipId] = useState<number | null>(null);
  const [actionPopup, setActionPopup] = useState(false);
  const [activeMembershipId, setActiveMembershipId] = useState<number | null>(
    null
  );

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchParkingLot = async () => {
      if (!parkingLotId) {
        setError("Parking lot ID is required");
        return;
      }

      setIsLoading(true);

      try {
        const { data: parkingLotData, error: parkingLotError } = await supabase
          .from("ParkingLot")
          .select("*")
          .eq("id", parkingLotId)
          .single();

        if (parkingLotError) throw parkingLotError;

        setParkingLot(parkingLotData);
      } catch (err) {
        console.error("Error fetching parking lot:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParkingLot();
  }, [parkingLotId, supabase]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!user) return;

      setIsLoading(true);

      try {
        const { data: memberData, error: memberError } = await supabase
          .from("Membership")
          .select(
            `
          id,
          parkingLotId,
          clientId,
          vehicle_id,
          status,
          created_at,
          Profile:clientId(
            id,
            first_name,
            last_name,
            email,
            phone_number
          ),
          Vehicle:vehicle_id(
            id,
            name,
            model,
            colour,
            license_plate_number
          )
        `
          )
          .eq("parkingLotId", parkingLotId);

        if (memberError) throw memberError;

        setMemberships(memberData as unknown as MembershipWithRelations[]);
      } catch (err) {
        console.error("Error fetching memberships", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembers();
  }, [parkingLotId, supabase, user]);

  const handleActionPopup = (
    membershipId: number | null,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current); // Clear any pending close action
    }

    if (actionPopup && activeMembershipId === membershipId) {
      // If clicking the same button, close the popup
      setActionPopup(false);
      setActiveMembershipId(null);
    } else {
      // If clicking a different button, close the previous popup first
      setActionPopup(false);
      setTimeout(() => {
        setActiveMembershipId(membershipId);
        setActionPopup(true);
      }, 10); // Tiny delay to allow state update
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        timeoutRef.current = setTimeout(() => {
          setActionPopup(false);
          setActiveMembershipId(null);
        }, 100);
      }
    };

    if (actionPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [actionPopup]);

  return (
    <div className="px-12 py-4">
      {parkingLot ? (
        <div>
          <div className="flex justify-between">
            <h1 className="text-3xl font-bold">Manage members</h1>
            <h1 className="text-3xl font-bold">{parkingLot.name}</h1>
          </div>
          <hr className="border-pink-500 border-1 my-6" />

          <div className="overflow-x-auto rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((membership, index) => (
                  <tr
                    key={membership.id || index}
                    className={
                      index % 2 === 0 ? "bg-neutral-800" : "bg-neutral-600"
                    }
                  >
                    <td className="p-2">
                      {membership.Profile?.first_name}{" "}
                      {membership.Profile?.last_name}
                    </td>
                    <td className="p-2">{membership.Profile?.email}</td>
                    <td className="p-2">{membership.status}</td>
                    <td className="p-2">
                      <button
                        ref={buttonRef}
                        onClick={(e) => handleActionPopup(membership.id, e)}
                        className="relative"
                      >
                        <EllipsisIcon></EllipsisIcon>
                      </button>
                      {actionPopup && activeMembershipId === membership.id && (
                        <div
                          ref={popupRef}
                          className="flex flex-col bg-neutral-600 absolute p-1 shadow-lg rounded text-white z-10"
                        >
                          <button className="cursor-pointer p-1 hover:bg-neutral-500 rounded-md">
                            Accept
                          </button>
                          <button className="cursor-pointer p-1 hover:bg-neutral-500 rounded-md">
                            Decline
                          </button>
                          <button className="cursor-pointer p-1 hover:bg-neutral-500 rounded-md">
                            Place on hold
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>{error}</div>
      )}
    </div>
  );
}

//   return (

//
//   );
// }
