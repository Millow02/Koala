import {
  Outlet,
  useLoaderData,
  useNavigate,
  useOutletContext,
} from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { useEffect, useState } from "react";
import { Database } from "~/types/supabase";

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

export default function Preferences() {
  const { user, supabase } = useOutletContext<ContextType>();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [originalLastName, setOriginalLastName] = useState("");
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState("");
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        return;
      }

      try {
        // Fetch user's first name
        const { data: profileData, error: profileError } = await supabase
          .from("Profile")
          .select("first_name, last_name, phone_number")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
        } else {
          setFirstName(profileData?.first_name || "");
          setLastName(profileData?.last_name || "");
          setPhoneNumber(profileData?.phone_number || "");
          console.log("User's first name:", profileData?.first_name);
          console.log("User's last name:", profileData?.last_name);
          console.log("User's phone number:", profileData?.phone_number);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    loadPreferences();
  }, [supabase, user]);

  const handleSave = () => {
    // Save the changes to the database
    setOriginalFirstName(firstName);
    setOriginalLastName(lastName);
    setOriginalPhoneNumber(phoneNumber);
    setIsModified(false);
  };

  const handleUndo = () => {
    // Revert the changes
    setFirstName(originalFirstName);
    setLastName(originalLastName);
    setPhoneNumber(originalPhoneNumber);
    setIsModified(false);
  };

  const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setIsModified(
      value !== originalFirstName ||
      value !== originalLastName ||
      value !== originalPhoneNumber
    );
  };
  
  return (
    <div>
      <h1 className="text-xl font-bold">Preferences</h1>
      <p>Manage your preferences and contact information</p>
      <div className="flex flex-col w-3/5 pl-6 mt-8 bg-gray-200 p-6 rounded-lg">
        <div className="mb-4">
          <label className="block text-sm font-medium text-black mb-1">
            First Name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => handleChange(setFirstName, e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder={firstName}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-black mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => handleChange(setLastName, e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder={lastName}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-black mb-1">
            Email
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-black mb-1">
            Phone Number
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => handleChange(setPhoneNumber, e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder={phoneNumber}
          />
        </div>
        {isModified && (
          <div className="flex space-x-4">
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              Save
            </button>
            <button
              onClick={handleUndo}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg"
            >
              Undo
            </button>
          </div>
        )}
    </div>

  </div>
  );
}
