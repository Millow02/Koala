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
  // next up display organization data for the current user !!
  return (
    <div className="w-1/6 h-screen bg-neutral-900 backdrop-blur-md border border-neutral-600 border-t-0 border-l-0 text-white">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <h1 className="text-lg font-medium ml-6 mt-3 mb-3">Dashboard</h1>
          <div className="space-y-3">
            <div className="border border-neutral-600 border-l-0 border-r-0 border-b-0 pl-6 pt-6 pb-3 mt-0">
              <h2 className="text-base font-semibold text-neutral-500">
                My organizations
              </h2>
              {organizations.length > 0 ? (
                organizations.map((org) => (
                  <Link
                    to={`/dashboard/organizations/${org.id}`}
                    key={org.id}
                    className="block text-neutral-300 hover:text-white hover:bg-opacity-50 transition duration-300"
                  >
                    {org.name}
                  </Link>
                ))
              ) : (
                <div>No organizations found</div>
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

{
  /* {sections.map((section) => (
            <ul className="space-y-3 mt-3">
              {section.links.map((link) => (
                <li key={link.path} className="text-base text-neutral-300">
                  <Link
                    to={link.path}
                    className={`block p-0 rounded  ${
                      location.pathname === link.path
                        ? "text-white"
                        : "hover:text-white hover:bg-opacity-50 transition duration-300"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))} */
}
