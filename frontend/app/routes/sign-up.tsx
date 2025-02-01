import { useNavigate, useOutletContext, Link } from "@remix-run/react";
import { SupabaseClient } from "@supabase/auth-helpers-remix";
import { useState } from "react";
import { Database } from "~/types/supabase";

export default function SignUp() {
  const { supabase } = useOutletContext<{
    supabase: SupabaseClient<Database>;
  }>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const signUp = async () => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        setError("Error");
        console.error("Error signing up:", error.message);
      } else {
        console.log("Sign-up successful");
        navigate("/");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Unexpected error:", err);
    }
  };

  return (
    <div className="flex flex-row h-screen">
      <main className="flex flex-col items-center w-full bg-gray-950 relative">
        <div className="absolute inset-0 flex items-start justify-center">
          <div className="w-2/6 h-3/5 bg-gradient-to-r from-blue-500 via-pink-500 to-purple-500 opacity-50 blur-2xl rounded-lg mt-16"></div>
        </div>

        <div className="relative flex flex-col items-center justify-center w-2/6 rounded-3xl bg-gray-950 h-3/5 mt-12 mx-60 px-16 py-8">
          <div className="flex flex-col items-center justify-center w-2/3">
            <h1 className="text-4xl font-bold mb-4 text-center">
              Get started with Koala
            </h1>
            <h3 className="text-lg mb-16 text-gray-300">
              Create a new account
            </h3>

            <h3 className="text-left w-full text-gray-300 mb-2">First name</h3>
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mb-4 p-3 border rounded w-full focus:outline-none focus:ring-1 focus:ring-white text-black"
            />

            <h3 className="text-left w-full text-gray-300 mb-2">Last name</h3>
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mb-4 p-3 border rounded w-full focus:outline-none focus:ring-1 focus:ring-white text-black"
            />

            <h3 className="text-left w-full text-gray-300 mb-2">Email</h3>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4 p-3 border rounded w-full focus:outline-none focus:ring-1 focus:ring-white text-black"
            />

            <h3 className="text-left w-full text-gray-300 mb-2">Password</h3>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-8 p-3 border rounded w-full focus:outline-none focus:ring-1 focus:ring-white text-black"
            />

            <button
              className="text-lg tracking-wide w-full bg-purple-700 text-white px-6 py-3 rounded-xl shadow-md hover:bg-purple-800 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={signUp}
            >
              Sign Up
            </button>
            {error && <p className="text-red-500 mt-4">{error}</p>}

            <h3 className="text-lg text-gray-400  mt-12">
              New to Koala?{" "}
              <Link to="/sign-in" className="text-lg text-white underline">
                Sign in here
              </Link>
            </h3>
          </div>
        </div>
      </main>
    </div>
  );
}
