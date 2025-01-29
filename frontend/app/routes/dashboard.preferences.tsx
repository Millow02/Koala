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
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [originalLastName, setOriginalLastName] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState("");
  const [isModified, setIsModified] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        return;
      }

      try {
        //fetch user info from Profile table
        const { data: profileData, error: profileError } = await supabase
          .from("Profile")
          .select("first_name, last_name, email, phone_number")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
        } else {
          setFirstName(profileData?.first_name || "");
          setLastName(profileData?.last_name || "");
          setEmail(profileData?.email || "");
          setPhoneNumber(profileData?.phone_number || "");
          setOriginalFirstName(profileData?.first_name || "");
          setOriginalLastName(profileData?.last_name || "");
          setOriginalEmail(profileData?.email || "");
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
          email: email,
          phone_number: phoneNumber,
        })
        .eq("id", user.id);
      if (error) {
        console.error("Error updating profile:", error.message);
      } else {
        // update original values
        setOriginalFirstName(firstName);
        setOriginalLastName(lastName);
        setOriginalEmail(email);
        setOriginalPhoneNumber(phoneNumber);
        setIsModified(false);
        setPopupVisible(true);
        setTimeout(() => setPopupVisible(false), 3000);
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
      value !== originalEmail ||
      value !== originalPhoneNumber
    );
  };
  
  return (
    <div className="relative">
      <div className="w-full px-12 py-4">
        <div className=" items-center mb-8">
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
                value={email}
                onChange={(e) => handleChange(setEmail, e.target.value)}
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
                  onClick={handleUndo}
                  className="text-base bg-gray-500 py-2 rounded-lg p-2 hover:text-gray-600 active:bg-gray-700 active:text-white hover:scale-105 transition-transform duration-300 px-4  mr-2 font-bold"
                >
                  Undo
                </button>
                <button
                  className="text-base bg-pink-500 rounded-lg p-2 hover:text-gray-600 active:bg-pink-700 active:text-white hover:scale-105 transition-transform duration-300 px-4 font-bold"
                  onClick={() => {handleSave();
                    setPopupVisible(false);}}
                >
                  Save
                </button>
                
              </div>
            )}
        </div>
      </div>
    </div>
    {popupVisible && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-600 p-8 rounded-lg shadow-lg">
            <p className="text-white">Profile updated successfully!</p>
            <div className="flex justify-end mt-4">
              <button
                className="bg-pink-500 text-white px-4 py-2 rounded-lg"
                onClick={() => setPopupVisible(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
  </div>
  );
}
