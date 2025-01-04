import { Outlet, useNavigate, useOutletContext } from "@remix-run/react";
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { useEffect, useState } from "react";

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

export default function Vehicles() {
  const { user, supabase } = useOutletContext<ContextType>();
  const [vehicleName, setVehicleName] = useState("");
  const [model, setModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const openCreateVehicleForm = () => {
    setIsModalOpen(true);
    setTimeout(() => setIsAnimating(true), 0);
  };

  const closeCreateVehicleForm = () => {
    setTimeout(() => setIsModalOpen(false), 300);
    setIsAnimating(false);
  };

  const [isMouseDown, setIsMouseDown] = useState(false);

  const handleMouseDown = () => {
    setIsMouseDown(true);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousedown", handleMouseDown);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isModalOpen]);

  const handleOverlayClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (!isMouseDown) {
      closeCreateVehicleForm();
    }
  };

  const createNewVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setMessage("");

    if (!vehicleName || !model || !licensePlate) {
      setMessage("All fields are required");
      return;
    }
    try {
      const { error } = await supabase.from("Vehicle").insert([
        {
          user_id: user.id,
          name: vehicleName,
          model,
          license_plate_number: licensePlate,
        },
      ]);

      if (error) {
        setMessage("Error creating vehicle: " + error.message);
      } else {
        setMessage("Vehicle created successfully!");
        setVehicleName("");
        setModel("");
        setLicensePlate("");
      }
    } catch (error) {
      setMessage("Unexpected error has occured");
    }
  };

  return (
    <div className="relative">
      <h1 className="text-xl font-bold">Vehicles</h1>
      <button
        className="text-base bg-pink-500 rounded-lg p-2"
        onClick={openCreateVehicleForm}
      >
        Create new vehicle
      </button>
      <h2>{user?.email}</h2>

      <div>
        {isModalOpen && (
          <div
            className={`fixed inset-0 bg-gray-800 bg-opacity-20 flex items-center justify-center z-50 transition-opacity duration-300 ${
              isAnimating ? "opacity-100" : "opacity-0"
            }`}
            onClick={handleOverlayClick}
          >
            <div
              className={`bg-neutral-800 rounded-lg shadow-2xl  w-1/3 transition-transform duration-300  ${
                isAnimating ? "scale-100" : "scale-95"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 mt-4">
                <h2 className="text-white text-2xl">Create new vehicle</h2>
                <button
                  className="flex items-center justify-center rounded-full p-2 hover:bg-neutral-900 hover:opacity-100 hover:duration-300"
                  onClick={closeCreateVehicleForm}
                >
                  <img
                    src="/x.svg"
                    alt="Close"
                    className="w-8 h-8 text-white"
                  />
                </button>
              </div>
              <hr className="bg-neutral-600 h-px border-0 my-4" />

              <div className="flex flex-col w-3/5 pl-6 mt-8">
                <form onSubmit={createNewVehicle}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white mb-1">
                      Vehicle Name
                    </label>
                    <input
                      type="text"
                      value={vehicleName}
                      onChange={(e) => setVehicleName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white mb-1">
                      License Plate Number
                    </label>
                    <input
                      type="text"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  {message && (
                    <p
                      className={`text-sm ${
                        message.startsWith("Error")
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {message}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="text-base bg-white text-black rounded-lg p-2 mt-8 mb-8"
                  >
                    Create vehicle
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
