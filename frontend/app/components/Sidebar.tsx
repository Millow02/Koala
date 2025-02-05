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

const Sidebar = () => {
  const { supabase } = useOutletContext<{
    supabase: SupabaseClient<Database>;
  }>();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
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
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setError("Failed to load profile");
      } else {
        setUserRole(profileData?.role || null);
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
  const isMembershipsActive = location.pathname.startsWith("/dashboard/admin-memberships");
  const isRecordsActive = location.pathname.startsWith("/dashboard/records");
  const isAnalyticsActive = location.pathname.startsWith("/dashboard/analytics");
  const isNotificationsActive = location.pathname.startsWith("/dashboard/notifications");
  const isFacilitiesActive = location.pathname.startsWith("/dashboard/facilities");
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
    <div className="w-1/6 bg-neutral-900 backdrop-blur-md border border-neutral-600 border-t-0 border-l-0 text-white top-0 sticky h-screen items-start">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <h1 className="text-lg font-medium ml-6 mt-3 mb-3">Dashboard</h1>
          <div className="space-y-3">
            {userRole == 'admin' && (
                <>
                <div className="border border-neutral-600 border-l-0 border-r-0 border-b-0 pl-6 pt-3">
                  <h2 className="text-base font-semibold text-neutral-500 mb-3">
                    Administration
                  </h2>
                  <Link
                    to={`/dashboard/lots`}
                    className={`
                    block transition duration-300 mb-2
                    ${
                      isLotsActive
                        ? "text-white"
                        : "text-neutral-400 hover:text-white"
                    }
                  `}
                  >
                    Parking Lots
                  </Link>
                  <Link
                    to={`/dashboard/admin-memberships`}
                    className={`
                    block transition duration-300 mb-2
                    ${
                      isMembershipsActive
                        ? "text-white"
                        : "text-neutral-400 hover:text-white"
                    }
                  `}
                  >
                    Memberships
                  </Link>
                  <Link
                    to={`/dashboard/records`}
                    className={`
                    block transition duration-300 mb-2
                    ${
                      isRecordsActive
                        ? "text-white"
                        : "text-neutral-400 hover:text-white"
                    }
                  `}
                  >
                    Records
                  </Link>
                  <Link
                    to={`/dashboard/analytics`}
                    className={`
                    block transition duration-300 mb-2
                    ${
                      isAnalyticsActive
                        ? "text-white"
                        : "text-neutral-400 hover:text-white"
                    }
                  `}
                  >
                    Analytics
                  </Link>
                  <Link
                    to={`/dashboard/notifications`}
                    className={`
                    block transition duration-300 mb-2
                    ${
                      isNotificationsActive
                        ? "text-white"
                        : "text-neutral-400 hover:text-white"
                    }
                  `}
                  >
                    Notifications
                  </Link>
                </div>
              </>
            )}
            {/* <div className="border border-neutral-600 border-l-0 border-r-0 border-b-0 pl-6 pt-3"> */}
            {/* <h2 className="text-base font-semibold text-neutral-500 mb-3">
                My organizations
              </h2>
              {organizations.length > 0 ? (
                organizations.map((org) => (
                  <Link
                    to={`/dashboard/organizations/${org.id}`}
                    key={org.id}
                    className={`block transition duration-300 mb-2 ${
                      isActiveLink(org.id)
                        ? "text-white"
                        : "text-neutral-400 hover:text-white"
                    }
                  `}
                  >
                    {org.name}
                  </Link>
                ))
              ) : (
                <div>No organizations found</div>
              )}
            </div> */}
            {userRole == 'client' && (
              <>
                <div className="border border-neutral-600 border-l-0 border-r-0 border-b-0 pl-6 pt-3">
                  <h2 className="text-base font-semibold text-neutral-500 mb-3">
                    Find Parking
                  </h2>
                  <Link
                    to={`/dashboard/facilities`}
                    className={`
                    block transition duration-300 mb-2
                    ${
                      isFacilitiesActive
                        ? "text-white"
                        : "text-neutral-400 hover:text-white"
                    }
                  `}
                  >
                    All Facilities
                  </Link>
                  <Link
                    to={`/dashboard/map`}
                    className={`
                    block transition duration-300 mb-2
                    ${
                      isMapActive
                        ? "text-white"
                        : "text-neutral-400 hover:text-white"
                    }
                  `}
                  >
                    Map
                  </Link>
                </div>
              </>
            )}
            <div className="border border-neutral-600 border-l-0 border-r-0 border-b-0 pl-6 pt-3">
              <h2 className="text-base font-semibold text-neutral-500 mb-3">
                Account
              </h2>
              <Link
                to={`/dashboard/preferences`}
                className={`
                block transition duration-300 mb-2
                ${
                  isPreferencesActive
                    ? "text-white"
                    : "text-neutral-400 hover:text-white"
                }
              `}
              >
                Preferences
              </Link>
              {userRole == 'client' && (
                <>
                  <Link
                    to={`/dashboard/vehicles`}
                    className={`block hover:text-white hover:bg-opacity-50 transition duration-300 mb-2 ${
                      isVehiclesActive
                        ? "text-white"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Vehicles
                  </Link>
                  <Link
                    to="#"
                    className={`block hover:text-white hover:bg-opacity-50 transition duration-300 mb-2 ${
                      isVehiclesActive
                        ? "text-white"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Memberships
                  </Link>
                </>
              )}
            </div>

            <button
              className="w-full bg-transparent text-base text-left pl-6 py-5 text-neutral-300 px-0 focus:outline-none border border-l-0 border-r-0 border-b-neutral-600 border-t-neutral-600 hover:text-white transition duration-300"
              onClick={signOut}
            >
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
