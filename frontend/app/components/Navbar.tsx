// Nav.tsx
import { Link, useOutletContext, useRevalidator } from "@remix-run/react";
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { useEffect, useState } from "react";

interface NavbarProps {
  isSignedIn: boolean;
  user: User | null;
}

export default function Navbar({ isSignedIn, user }: NavbarProps) {
  return (
    <nav className="flex items-center justify-between p-4 bg-neutral-800 text-white shadow-md">
      <div className="flex items-center space-x-10">
        <Link
          to="/"
          className="text-2xl font-bold hover:text-neutral-300 transition-colors"
        >
          Koala
        </Link>
      </div>


      <div>
        {!user ? (
          <Link to="/sign-in">
            <button className="bg-pink-500 border-e-pink-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-pink-600 hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-pink-400">
              Sign In
            </button>
          </Link>
        ) : (
          <Link to="/dashboard/lots">
            <button className="text-base bg-pink-500 rounded-lg p-2 focus:outline-none">
              Dashboard
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
}
