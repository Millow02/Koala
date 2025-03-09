import React, { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
} from "@remix-run/react";
import { SupabaseClient } from "@supabase/auth-helpers-remix";
import { Database } from "~/types/supabase";
import { User } from "@supabase/supabase-js";
import { UserIcon, ArrowLeftOnRectangleIcon } from "@heroicons/react/24/solid";
import {
  Cog6ToothIcon,
  TruckIcon,
  IdentificationIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  PresentationChartLineIcon,
  BellIcon,
  MapIcon,
  ArrowLeftEndOnRectangleIcon,
} from "@heroicons/react/24/outline";

const Sidebar = () => {
  const { supabase } = useOutletContext<{
    supabase: SupabaseClient<Database>;
  }>();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [parkingLots, setParkingLots] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSidebarData = async () => {
    try {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No authenticated user found");
      }

      setCurrentUser(user);

      const { data: profileData, error: profileError } = await supabase
        .from("Profile")
        .select("role, first_name, last_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setError("Failed to load profile");
      } else {
        setUserRole(profileData?.role || null);
        setUserName(
          `${profileData?.first_name} ${profileData?.last_name}` || null
        );
        // Print user role to the console
        console.log("User role:", profileData?.role);
      }

      const { data: organizationData, error: organizationError } =
        await supabase
          .from("Organization")
          .select("id, name, owner")
          .eq("owner", user.id);

      if (organizationError) {
        console.error("Error fetching organizations:", organizationError);
        setError("Failed to load organizations");
      }

      setOrganizations(organizationData || []);
    } catch (err) {
      console.error("Unexpected error fetching sidebar data:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSidebarData();
  }, []);

  const location = useLocation();

  const isLotsActive = location.pathname.startsWith("/dashboard/lots");
  const isMembershipsActive = location.pathname.startsWith(
    "/dashboard/client-memberships"
  );
  const isRecordsActive = location.pathname.startsWith("/dashboard/records");
  const isAnalyticsActive = location.pathname.startsWith(
    "/dashboard/analytics"
  );
  const isNotificationsActive = location.pathname.startsWith(
    "/dashboard/notifications"
  );
  const isFacilitiesActive = location.pathname.startsWith(
    "/dashboard/facilities"
  );
  const isMapActive = location.pathname.startsWith("/dashboard/map");

  const isActiveLink = (orgId: string) => {
    return location.pathname.includes(`/dashboard/organizations/${orgId}`);
  };

  const isPreferencesActive = location.pathname.startsWith(
    "/dashboard/preferences"
  );

  const isVehiclesActive = location.pathname.startsWith("/dashboard/vehicles");

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error logging out");
      } else {
        console.log("Logout succesful");
        navigate("/");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Unexpected error:", err);
    }
  };

  return (
    <div
      className="w-1/6 min-w-20 backdrop-blur-md border border-neutral-600 border-t-0 border-l-0 text-white top-0 sticky h-screen items-start"
      style={{ backgroundColor: "#333842" }}
    >
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <h1 className="text-lg font-medium ml-6 mt-3 mb-3">Dashboard</h1>
          <div className="space-y-3">
            <div className="border border-neutral-600 border-l-0 border-r-0 border-b-0 pl-3 flex items-center pt-4 pb-1">
              <UserIcon className="h-7 w-7 text-neutral-500 mr-2 border rounded-full border-neutral-500" />
              <div>
                <h2 className="text-base font-semibold text-neutral-300 ">
                  {userName}
                </h2>
                <h2 className="text-sm font-semibold text-neutral-500 ">
                  {userRole}
                </h2>
              </div>
            </div>
            {userRole == "admin" && (
              <>
                <div className="border border-neutral-600 border-l-0 border-r-0 border-b-0 pl-4 pt-3">
                  <h2 className="text-base font-semibold text-neutral-500">
                    Administration
                  </h2>
                  <Link
                    to={`/dashboard/lots`}
                    className={`
                    block transition duration-300 mr-5 rounded hover:bg-neutral-500 px-1 py-2
                    ${
                      isLotsActive
                        ? "text-white border-l-4 border-pink-500 hover:rounded"
                        : "text-neutral-400 hover:text-white"
                    }
                  `}
                  >
                    <BuildingOffice2Icon className="h-6 w-6 inline-block mr-2" />
                    Parking Lots
                  </Link>
                  <Link
                    to={`/dashboard/records`}
                    className={`
                    block transition duration-300 mr-5 rounded hover:bg-neutral-500 px-1 py-2
                    ${
                      isRecordsActive
                        ? "text-white border-l-4 border-pink-500 hover:rounded"
                        : "text-neutral-400 hover:text-white"
                    }
                  `}
                  >
                    <CalendarIcon className="h-6 w-6 inline-block mr-2" />
                    Records
                  </Link>
                  <Link
                    to={`/dashboard/analytics`}
                    className={`
                    block transition duration-300 mr-5 rounded hover:bg-neutral-500 px-1 py-2
                    ${
                      isAnalyticsActive
                        ? "text-white border-l-4 border-pink-500 hover:rounded"
                        : "text-neutral-400 hover:text-white"
                    }
                  `}
                  >
                    <PresentationChartLineIcon className="h-6 w-6 inline-block mr-2" />
                    Analytics
                  </Link>
                  <Link
                    to={`/dashboard/notifications`}
                    className={`
                    block transition duration-300 mr-5 rounded hover:bg-neutral-500 px-1 py-2
                    ${
                      isNotificationsActive
                        ? "text-white border-l-4 border-pink-500 hover:rounded"
                        : "text-neutral-400 hover:text-white"
                    }
                  `}
                  >
                    <BellIcon className="h-6 w-6 inline-block mr-2" />
                    Notifications
                  </Link>
                </div>
              </>
            )}
            {userRole == "admin" && (
              <>
                <div className="border border-neutral-600 border-l-0 border-r-0 border-b-0 pl-4 pt-3">
                  <h2 className="text-base font-semibold text-neutral-500">
                    Find Parking
                  </h2>
                  <Link
                    to={`/dashboard/facilities`}
                    className={`
                    block transition duration-300 mr-5 rounded hover:bg-neutral-500 px-1 py-2
                    ${
                      isFacilitiesActive
                        ? "text-white border-l-4 border-pink-500 hover:rounded"
                        : "text-neutral-400 hover:text-white"
                    }
                  `}
                  >
                    <BuildingOffice2Icon className="h-6 w-6 inline-block mr-2" />
                    All Facilities
                  </Link>
                  <Link
                    to={`/dashboard/map`}
                    className={`
                    block transition duration-300 mr-5 rounded hover:bg-neutral-500 px-1 py-2
                    ${
                      isMapActive
                        ? "text-white border-l-4 border-pink-500 hover:rounded"
                        : "text-neutral-400 hover:text-white"
                    }
                  `}
                  >
                    <MapIcon className="h-6 w-6 inline-block mr-2" />
                    Map
                  </Link>
                </div>
              </>
            )}
            <div className="border border-neutral-600 border-l-0 border-r-0 border-b-0 pl-4 pt-3">
              <h2 className="text-base font-semibold text-neutral-500">
                Account
              </h2>
              <Link
                to={`/dashboard/preferences`}
                className={`
                block transition duration-300 mr-5 rounded hover:bg-neutral-500 px-1 py-2
                ${
                  isPreferencesActive
                    ? "text-white border-l-4 border-pink-500 hover:rounded"
                    : "text-neutral-400 hover:text-white"
                }
              `}
              >
                <Cog6ToothIcon className="h-6 w-6 inline-block mr-2" />
                Preferences
              </Link>
              {userRole == "admin" && (
                <>
                  <Link
                    to={`/dashboard/vehicles`}
                    className={`
                      block transition duration-300 mr-5 rounded hover:bg-neutral-500 px-1 py-2
                      ${
                        isVehiclesActive
                          ? "text-white border-l-4 border-pink-500 hover:rounded"
                          : "text-neutral-400 hover:text-white"
                      }`}
                  >
                    <TruckIcon className="h-6 w-6 inline-block mr-2" />
                    Vehicles
                  </Link>
                  <Link
                    to="/dashboard/client-memberships"
                    className={`
                      block transition duration-300 mr-5 rounded hover:bg-neutral-500 px-1 py-2
                      ${
                        isMembershipsActive
                          ? "text-white border-l-4 border-pink-500 hover:rounded"
                          : "text-neutral-400 hover:text-white"
                      }`}
                  >
                    <IdentificationIcon className="h-6 w-6 inline-block mr-2" />
                    Memberships
                  </Link>
                </>
              )}
            </div>
            <div className="bg-transparent pl-4 py-2 pr-5 focus:outline-none border border-l-0 border-r-0 border-b-neutral-600 border-t-neutral-600">
              <button
                className="w-full text-base text-left py-2 rounded text-neutral-400 hover:text-white transition duration-300 hover:bg-neutral-500"
                onClick={signOut}
              >
                <ArrowLeftEndOnRectangleIcon className="h-6 w-6 inline-block mr-2" />
                Log out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
