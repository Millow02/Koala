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

type Vehicle = Database["public"]["Tables"]["Vehicle"]["Row"];

export default function Vehicles() {
  const { user, supabase } = useOutletContext<ContextType>();
  const [vehicleName, setVehicleName] = useState("");
  const [model, setModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formVisible, setFormVisible] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [messageVisible, setMessageVisible] = useState(false);

  useEffect(() => {
    const loadVehicles = async () => {
      if (!user) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from("Vehicle")
          .select("*")
          .eq("profile_id", user.id);

        if (error) {
          console.error("Error fetching vehicles:", error);
        } else {
          setVehicles(data || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    loadVehicles();
  }, [supabase, user]);

  const openCreateVehicleForm = () => {
    setIsModalOpen(true);
    setTimeout(() => setIsAnimating(true), 0);
  };

  const closeCreateVehicleForm = () => {
    setTimeout(() => setIsModalOpen(false), 300);
    setIsAnimating(false);
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
          profile_id: user.id,
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

  const toggleForm = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleName(vehicle.name);
    setModel(vehicle.model);
    setLicensePlate(vehicle.license_plate_number);
    setFormVisible(vehicle.id);
  };
  const closeForm = () => {
    setFormVisible(null);
    setSelectedVehicle(null);
    setVehicleName("");
    setModel("");
    setLicensePlate("");
  };

  const updateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!vehicleName || !model || !licensePlate) {
      setMessage("All fields are required");
      setMessageVisible(true);
      return;
    }
    try {
      const { error } = await supabase
        .from("Vehicle")
        .update({
          name: vehicleName,
          model,
          license_plate_number: licensePlate,
        })
        .eq("id", selectedVehicle?.id);

      if (error) {
        setMessage("Error updating vehicle: " + error.message);
        setMessageVisible(true);
      } else {
        setMessage("Vehicle updated successfully!");
        setMessageVisible(true);
        setVehicles((prevVehicles) =>
          prevVehicles.map((v) =>
            v.id === selectedVehicle?.id
              ? {
                  ...v,
                  name: vehicleName,
                  model,
                  license_plate_number: licensePlate,
                }
              : v
          )
        );
        closeForm();
      }
    } catch (error) {
      setMessage("Unexpected error has occurred");
      setMessageVisible(true);
    }
  };

  const closeMessage = () => {
    setMessageVisible(false);
    setMessage("");
  };

  return (
    <div className="relative">
      <div className="w-full px-12 py-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold ">My Vehicles</h1>
          <button
            className="text-base bg-pink-500 rounded-lg p-2 hover:text-gray-600 hover:scale-105 transition-transform duration-300 active:bg-pink-600 active:text-gray-600"
            onClick={openCreateVehicleForm}
          >
            Add Vehicle
          </button>
        </div>
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="w-full">
            <thead
              className=" text-white"
              style={{ backgroundColor: "#333842" }}
            >
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Vehicle Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  License Plate
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Model
                </th>
                <th className="px-1 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle, index) => (
                <tr
                  key={vehicle.id}
                  className={`
                  ${index % 2 === 0 ? "bg-slate-600" : "bg-neutral-800"}
                  text-white hover:bg-neutral-600 transition-colors duration-200
                `}
                >
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {vehicle.name}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {vehicle.license_plate_number}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {vehicle.model}
                  </td>
                  <td className="px-1 py-4 text-sm whitespace-nowrap text-center">
                    <button
                      className="text-white hover:text-gray-400"
                      onClick={() => toggleForm(vehicle)}
                    >
                      &#x22EE;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        {isModalOpen && (
          <div
            className={`fixed inset-0 bg-gray-800 bg-opacity-20 flex items-center justify-center z-50 transition-opacity duration-300 ${
              isAnimating ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeCreateVehicleForm}
          >
            <div
              className={`bg-neutral-800 rounded-lg shadow-2xl  w-3/6 transition-transform duration-300  ${
                isAnimating ? "scale-100" : "scale-95"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 mt-4">
                <h2 className="text-white text-3xl font-bold">
                  Add New Vehicle 🚗
                </h2>
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

              <div className="flex flex-col w-3/5 pl-6 mt-10 mb-8">
                <form onSubmit={createNewVehicle}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white mb-1">
                      Vehicle Name
                    </label>
                    <input
                      type="text"
                      value={vehicleName}
                      onChange={(e) => setVehicleName(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-white bg-neutral-600"
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
                      className="w-full rounded-lg px-3 py-2 text-white bg-neutral-600"
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
                      className="w-full rounded-lg px-3 py-2 text-white bg-neutral-600"
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
                    className="text-base bg-pink-500 rounded-lg p-2 hover:text-gray-600 active:bg-pink-700 active:text-white hover:scale-105 transition-transform duration-300 mt-8 w-1/4 font-bold"
                  >
                    Create
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        {formVisible && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-neutral-800 rounded-lg shadow-lg w-1/2">
              <div className="ml-6 mt-6 mb-6">
                <h2 className="text-3xl font-bold mb-3">Edit Vehicle</h2>
              </div>
              <hr className="bg-neutral-600 h-px border-0 my-4" />
              <div className="m-6">
                <form onSubmit={updateVehicle}>
                  <div className="w-3/5">
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-white mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={vehicleName}
                        onChange={(e) => setVehicleName(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-white bg-neutral-600"
                      />
                    </div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-white mb-1">
                        License Plate
                      </label>
                      <input
                        type="text"
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-white bg-neutral-600"
                      />
                    </div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-white mb-1">
                        Model
                      </label>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-white bg-neutral-600"
                      />
                    </div>
                  </div>
                  <div className="flex mt-12">
                    <button
                      type="button"
                      className="text-base bg-gray-500 py-2 rounded-lg p-2 hover:text-gray-600 active:bg-gray-700 active:text-white hover:scale-105 transition-transform duration-300 px-4  mr-2 font-bold"
                      onClick={closeForm}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="text-base bg-pink-500 rounded-lg p-2 hover:text-gray-600 active:bg-pink-700 active:text-white hover:scale-105 transition-transform duration-300 px-4 font-bold"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>

              {message && <p className="mt-4 text-Black-500">{message}</p>}
            </div>
          </div>
        )}
        {messageVisible && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <p className="text-Black-500">{message}</p>
              <div className="flex justify-end mt-4">
                <button
                  className="bg-pink-500 text-white px-4 py-2 rounded-lg"
                  onClick={closeMessage}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
