import React, { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
} from "@remix-run/react";
import { SupabaseClient } from "@supabase/auth-helpers-remix";
import { Database } from "~/types/supabase";

interface SidebarSection {
  header: string;
  links: { label: string; path: string }[];
}

interface SidebarProps {
  sections: SidebarSection[];
}

const Sidebar: React.FC<SidebarProps> = ({ sections }) => {
  const location = useLocation();
  const { supabase } = useOutletContext<{
    supabase: SupabaseClient<Database>;
  }>();
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    <div className="w-1/4 h-screen bg-neutral-900 backdrop-blur-md border border-neutral-600 border-t-0 border-l-0 text-white">
      <h1 className="text-lg font-medium ml-6 mt-3 mb-3">Dashboard</h1>
      <div className="space-y-3">
        {sections.map((section) => (
          <div
            key={section.header}
            className="border border-neutral-600 border-l-0 border-r-0 border-b-0 pl-6 pt-6 pb-3 mt-0"
          >
            <h2 className="text-sm font-semibold text-neutral-500">
              {section.header}
            </h2>

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
        ))}

        <button
          className="w-full bg-transparent text-base text-left pl-6 py-5 text-neutral-300 px-0 focus:outline-none border border-l-0 border-r-0 border-b-neutral-600 border-t-neutral-600 hover:text-white transition duration-300"
          onClick={signOut}
        >
          Log out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
