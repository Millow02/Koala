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
        //fetch user info from Profile table
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
          setOriginalFirstName(profileData?.first_name || "");
          setOriginalLastName(profileData?.last_name || "");
          setOriginalPhoneNumber(profileData?.phone_number || "");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    loadPreferences();
  }, [supabase, user]);

    const handleSave = async () => {
    try {
      const { error } = await supabase.from("Profile").update(
        {
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
        })
        .eq("id", user.id);
      if (error) {
        console.error("Error updating profile:", error.message);
      } else {
        // update original values
        setOriginalFirstName(firstName);
        setOriginalLastName(lastName);
        setOriginalPhoneNumber(phoneNumber);
        setIsModified(false);
        console.log("Profile updated successfully");
        console.log("user id: " , user.id);
        console.log("user: " , user);
        console.log("first name: " , firstName);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const handleUndo = () => {
    //revert to original values
    setFirstName(originalFirstName);
    setLastName(originalLastName);
    setPhoneNumber(originalPhoneNumber);
    setIsModified(false);
  };

  //check if fields have been modified
  const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setIsModified(
      value !== originalFirstName ||
      value !== originalLastName ||
      value !== originalPhoneNumber
    );
  };
  
  return (
    <div className="ml-8">
      <h1 className="text-3xl font-bold mb-2">Preferences</h1>
      <p>Manage your preferences and contact information</p>
      <div className="flex flex-col w-3/5 pl-6 mt-8 bg-neutral-800 p-6 rounded-lg">
        <div className="mb-4">
          <label className="block text-m font-medium text-white mb-1">
            First Name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => handleChange(setFirstName, e.target.value)}
            className="w-full rounded-lg px-3 py-2  bg-neutral-600"
            placeholder="Enter first name"
          />
        </div>
        <div className="mb-4">
          <label className="block text-m font-medium text-white mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => handleChange(setLastName, e.target.value)}
            className="w-full rounded-lg px-3 py-2 bg-neutral-600"
            placeholder="Enter last name"
          />
        </div>
        <div className="mb-4">
          <label className="block text-m font-medium text-white mb-1">
            Email
          </label>
          <input
            type="text"
            className="w-full rounded-lg px-3 py-2 bg-neutral-600 placeholder-gray-400"
            placeholder="Enter email"
          />
        </div>
        <div className="mb-4">
          <label className="block text-m font-medium text-white mb-1">
            Phone Number
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => handleChange(setPhoneNumber, e.target.value)}
            className="w-full rounded-lg px-3 py-2 bg-neutral-600"
            placeholder="Enter phone number"
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
