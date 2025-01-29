import { useNavigate, useOutletContext, Link } from "@remix-run/react";
import { SupabaseClient } from "@supabase/auth-helpers-remix";
import { useState } from "react";
import { Database } from "~/types/supabase";



export default function SignIn() {

    const { supabase } = useOutletContext<{ supabase: SupabaseClient<Database> }>()

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
  
    const signIn = async () => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
  
        if (error) {
          setError("Invalid email or password");
          console.error("Error signing in:", error.message);
        } else {
          console.log("Sign-in successful");
          navigate("/dashboard")
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
      <div className="w-2/6 h-3/5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-50 blur-2xl rounded-lg mt-16"></div>
    </div>
    
 
    <div className="relative flex flex-col items-center justify-center w-3/6 rounded-3xl bg-gray-950 h-3/5 mt-12 mx-60 px-16 py-8">
      <div className="flex flex-col items-center justify-center w-2/3">
        <h1 className="text-4xl font-bold mb-4 text-center">Welcome back to Koala</h1>
        <h3 className="text-lg mb-16 text-gray-300">Sign in to your account</h3>

  
        <h3 className="text-left w-full text-gray-300 mb-2">Email</h3>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 p-3 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
        />

    
        <h3 className="text-left w-full text-gray-300 mb-2">Password</h3>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-8 p-3 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
        />


        <button
          className="text-lg tracking-wide w-full bg-purple-700 text-white px-6 py-3 rounded-xl shadow-md hover:bg-purple-800 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={signIn}
        >
          Sign In
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}

        <Link to="/" className="text-lg text-gray-300 underline mt-8 mb-8">Forgot your password?</Link>
        <h3  className="text-lg text-gray-300 ">New to Koala?  <Link to="/sign-up" className="text-lg text-gray-300 underline">Sign up here</Link></h3>
      </div>
    </div>
  </main>
</div>



    );
}

