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
import { UserIcon } from "@heroicons/react/24/solid";
import { PencilIcon } from "@heroicons/react/24/outline";
import { Pen } from "lucide-react";

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
          <hr className="border-pink-500 border-1 my-6" />

          <div className="mb-14">
            <h2 className="text-2xl font-semibold text-white">Profile Picture</h2>
              <div className="flex flex-col w-3/5 pl-6 mt-5 p-6 rounded-lg border-neutral-600 border-2" style={{ backgroundColor: "#333842" }}>
                <div className="flex">
                  <UserIcon className="h-20 w-20 text-white border rounded-full bg-slate-600" />
                  <button className="flex items-center text-white bg-pink-500 px-4 rounded-lg my-4 mx-8 font-semibold hover:scale-105 transition-transform duration-300 hover:text-gray-600">
                    Upload Picture
                    <Pen className="h-6 w-6 ml-4" />
                  </button>
                  <div className="mt-7 ml-20">Must be JPEG or PNG and cannot exceed 10MB.</div>
                </div>
              </div>
          </div>

          <div className="mb-14"> 
            <h2 className="text-2xl font-semibold text-white">Profile Settings</h2>
            <div className="flex flex-col w-3/5 pl-6 mt-5 p-6 rounded-lg border-neutral-600 border-2" style={{ backgroundColor: "#333842" }}>
              <div className="mb-10 flex">
                  <label className="min-w-40 text-lg font-medium text-white mt-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => handleChange(setFirstName, e.target.value)}
                    className="w-full rounded-lg px-3 py-2  bg-slate-600 font-medium"
                    placeholder="Enter first name"
                  />
                </div>
                <div className="flex">
                  <label className="min-w-40 text-lg font-medium text-white mt-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => handleChange(setLastName, e.target.value)}
                    className="w-full rounded-lg px-3 py-2 bg-slate-600 font-medium"
                    placeholder="Enter last name"
                  />
                </div>
            </div>
          </div>



          <div className="mb-14">
            <h2 className="text-2xl font-semibold text-white">Contact Information</h2>
            <div className="flex flex-col w-3/5 pl-6 mt-5 p-6 rounded-lg border-neutral-600 border-2" style={{ backgroundColor: "#333842" }}>
              <div className="mb-10 flex">
                <label className="min-w-40 text-lg font-medium text-white mt-2">
                  Email
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => handleChange(setEmail, e.target.value)}
                  className="w-full rounded-lg px-3 py-2 bg-slate-600 font-medium"
                  placeholder="Enter email"
                />
              </div>
              <div className="flex">
                <label className="min-w-40 text-lg font-medium text-white mt-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => handleChange(setPhoneNumber, e.target.value)}
                  className="w-full rounded-lg px-3 py-2 bg-slate-600 font-medium"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleUndo}
              className={`text-base py-2 rounded-lg p-2 transition-transform duration-300 px-4 mr-2 font-bold ${
                isModified
                  ? "bg-slate-500 hover:text-gray-600 active:bg-gray-700 active:text-white hover:scale-105"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!isModified}
            >
              Undo
            </button>
            <button
              className={`text-base rounded-lg p-2 transition-transform duration-300 px-4 font-bold ${
                isModified
                  ? "bg-pink-500 hover:text-gray-600 active:bg-pink-700 active:text-white hover:scale-105"
                  : "bg-pink-300 cursor-not-allowed"
              }`}
              onClick={() => {
                handleSave();
                setPopupVisible(false);
              }}
              disabled={!isModified}
            >
              Save
            </button>
          </div>
      </div>
    </div>
    {popupVisible && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="p-8 rounded-lg shadow-lg border-neutral-600 border-2" style={{ backgroundColor: "#333842" }}>
            <p className="text-white font-semibold text-lg">Profile updated successfully!</p>
            <div className="flex justify-end mt-8">
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
