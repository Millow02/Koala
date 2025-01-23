// Nav.tsx
import { Link, useOutletContext, useRevalidator } from "@remix-run/react";
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { useEffect, useState } from "react";
import { Database } from "~/types/supabase";

export default function Navbar() {
    const { supabase } = useOutletContext<{ supabase: SupabaseClient<Database> }>()
    const revalidator = useRevalidator();

    const [user, setUser] = useState<User | null>(null);
    
    useEffect(() => {
        const fetchUser = async () => {
        const { data, error } = await supabase.auth.getUser();
    
        if (error) {
            console.error("Error fetching user:", error.message);
        } else {
            setUser(data?.user || null);
        }
        };
    
        fetchUser();
    }, []);


    useEffect(() => {
        const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
            setUser(session.user); 
            } else {
            setUser(null); 
            }
            revalidator.revalidate(); 
        });
    
        return () => {
            subscription.subscription.unsubscribe(); 
        };
        }, [supabase, revalidator]);

  const signOut = () => {
    supabase.auth.signOut();
  };


  return (
    <nav className="flex items-center justify-between p-4 bg-gray-800 text-white shadow-md">
      <div className="flex items-center space-x-10">
        <Link
          to="/"
          className="text-2xl font-bold hover:text-gray-300 transition-colors"
        >
          Koala
        </Link>
      </div>

      <div>
        {!user ? (
          <Link to="/sign-in">
            <button className="bg-blue-500 text-white px-6 py-3 rounded-full shadow-md hover:bg-blue-600 hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-400">
        Sign In
      </button>
          </Link>
        ) : (
        <button className='bg-blue-500 text-white px-6 py-3 rounded-full shadow-md hover:bg-blue-600 hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-400' onClick={signOut}>Sign out</button>
            
        )}
      </div>
    </nav>
  );
}

