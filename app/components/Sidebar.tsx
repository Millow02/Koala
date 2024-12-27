import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext } from '@remix-run/react';
import { SupabaseClient } from '@supabase/auth-helpers-remix';
import { Database } from '~/types/supabase';




interface SidebarSection {
  header: string;
  links: { label: string; path: string }[];
}

interface SidebarProps {
  sections: SidebarSection[];
}



const Sidebar: React.FC<SidebarProps> = ({ sections }) => {
  const location = useLocation();
  const { supabase } = useOutletContext<{ supabase: SupabaseClient<Database> }>()
  const [error, setError] = useState("");
  const navigate = useNavigate();


  
  const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
         console.error("Error logging out");
        }
        else {
            console.log("Logout succesful");
            navigate("/")
        }
    } catch (err) {
  setError("An unexpected error occurred");
  console.error("Unexpected error:", err);
}
}

    return (
        <div id='sidebar' className="w-64 bg-neutral-900 text-white h-screen p-4">
            <nav>
            {sections.map((section) => (
                <div key={section.header}>
                    <h2 className='text-base text-white font-semibold uppercase'>
                        {section.header}
                    </h2>

                    <ul className='space-y-2'>
                        {section.links.map((link) => (
                            <li key={link.path}>
                                <Link to={link.path} className={`block p-2 rounded ${
                                   location.pathname === link.path ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
                                   {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                </div>
            ))}
               <button className='bg-black text-white px-6 py-3 rounded-full shadow-md hover:bg-purple-600 hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-400' onClick={signOut}>Sign out</button>
            </nav>
        </div>  
    );
};

export default Sidebar;                 