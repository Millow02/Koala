import {
  Outlet,
  useLoaderData,
  useNavigate,
  useOutletContext,
  useParams,
} from "@remix-run/react";
import { LoaderFunction } from "@remix-run/server-runtime";
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { useEffect, useState } from "react";
import { Database } from "~/types/supabase";

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

type Profile = Database["public"]["Tables"]["Profile"]["Row"];

export const loader: LoaderFunction = async ({ params, request }) => {
  return null;
};

export default function NewLot() {
  const { user, supabase } = useOutletContext<ContextType>();
  const [orgName, setOrgName] = useState("");
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data, error } = await supabase
        .from("Profile")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user:", error.message);
      } else {
        setProfile(data || null);
      }
    };

    fetchUserProfile();
  }, [supabase]);
  const createNewOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!orgName) {
      setMessage("All fields are required");
      return;
    }
    try {
      const { data: orgData, error: orgError } = await supabase
        .from("Organization")
        .insert([
          {
            name: orgName,
            owner: user.id,
          },
        ])
        .select();

      if (orgError) {
        setMessage("Error creating organization: " + orgError.message);
      } else {
        const newOrganization = orgData[0];

        // Update the user's profile with the new organization ID
        const { error: profileUpdateError } = await supabase
          .from("Profile")
          .update({ organizationId: newOrganization.id })
          .eq("id", user.id);

        if (profileUpdateError) {
          setMessage("Error updating profile: " + profileUpdateError.message);
        } else {
          navigate("/dashboard/lots");
        }
      }
    } catch (error) {
      setMessage("Unexpected error has occured");
    }
  };

  const cancelAction = () => {
    navigate("/dashboard/lots");
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between px-6 mt-4">
        <h2 className="text-white text-3xl font-bold">
          Create a new organization ! ! :D
        </h2>
      </div>
      <hr className="bg-neutral-600 h-px border-0 my-4" />
      <div className="flex flex-col w-3/5 pl-6 mt-10 mb-8">
        <form onSubmit={createNewOrg}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-white mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-white bg-neutral-600"
            />
          </div>

          <div className="flex space-x-8">
            <button
              type="button"
              onClick={cancelAction}
              className="text-base bg-neutral-600 rounded-lg p-2 active:bg-pink-700 active:text-white hover:scale-105 transition-transform duration-300 mt-8 w-1/4 font-bold"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="text-base bg-pink-500 rounded-lg p-2 active:bg-pink-700 active:text-white hover:scale-105 transition-transform duration-300 mt-8 w-1/4 font-bold"
            >
              Create
            </button>
          </div>
          {message}
        </form>
      </div>
    </div>
  );
}
