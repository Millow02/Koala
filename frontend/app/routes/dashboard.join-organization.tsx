import { useNavigate, useOutletContext, useParams } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/server-runtime";
import {
  createServerClient,
  SupabaseClient,
  User,
} from "@supabase/auth-helpers-remix";
import { useEffect, useState } from "react";
import { Database } from "~/types/supabase";

type Profile = Database["public"]["Tables"]["Profile"]["Row"];
type Organization = Database["public"]["Tables"]["Organization"]["Row"];

export default function JoinOrganization() {
  const { supabase, user } = useOutletContext<{
    supabase: SupabaseClient;
    user: User;
  }>();

  const navigate = useNavigate();

  const { organizationId } = useParams();

  const [inviteCode, setInviteCode] = useState("");
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const joinOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      console.log("user:", user);

      const { data: inviteData, error: inviteError } = await supabase
        .from("organization_codes")
        .select("*")
        .eq("code", inviteCode.toUpperCase())
        .single();

      if (inviteError) throw inviteError;

      if (inviteData.is_expired) {
        throw new Error("Invite code has expired");
      }

      if (inviteData.is_used) {
        throw new Error("Invite code has already been used");
      }

      console.log("invite data:", inviteData);

      const { error: memberError } = await supabase
        .from("Profile")
        .update({ organizationId: inviteData.organization_id })
        .eq("id", user.id);

      if (memberError) throw memberError;

      const { error: codeError } = await supabase
        .from("organization_codes")
        .update({ is_used: true })
        .eq("code", inviteCode);

      if (codeError) throw codeError;
      setSuccess(true);
      // navigate("/dashboard/lots");
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
      navigate("/dashboard/lots");
    }
  };

  const returnToLots = () => {
    navigate("/dashboard/lots");
  };

  if (isLoading) {
    return <div>Loading organization details</div>; // you can replace me with a loading skeleton later
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <form onSubmit={joinOrganization}>
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className="text-black"
          placeholder="Insert code here !"
          disabled={isLoading}
        ></input>
        <button type="submit" disabled={isLoading || !inviteCode}>
          {isLoading ? "Joining..." : "Join Organization"}
        </button>
      </form>
    </div>
  );
}
