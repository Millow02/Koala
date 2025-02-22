import { useNavigate, useOutletContext, useParams } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/server-runtime";
import {
  createServerClient,
  SupabaseClient,
} from "@supabase/auth-helpers-remix";
import { Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Database } from "~/types/supabase";

export const loader: LoaderFunction = async ({ params, request }) => {
  return null;
};

type Profile = Database["public"]["Tables"]["Profile"]["Row"];
type Organization = Database["public"]["Tables"]["Organization"]["Row"];

export default function OrganizationDetailPage() {
  const { supabase } = useOutletContext<{
    supabase: SupabaseClient;
  }>();

  const navigate = useNavigate();

  const { organizationId } = useParams();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [inviteCode, setInviteCode] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [loadingCode, setLoadingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const returnToLots = () => {
    navigate("/dashboard/lots");
  };

  const generateInviteCode = async () => {
    try {
      setLoadingCode(true);
      setError(null);
      setCopied(false);

      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      const { data: codeData, error: codeError } = await supabase
        .from("organization_codes")
        .insert([
          {
            code,
            organization_id: organizationId,
            expires_at: expiresAt.toISOString(),
            is_expired: false,
            is_used: false,
          },
        ]);

      if (codeError) throw codeError;
      setInviteCode(code);
    } catch (err) {
      setError("Failed to generate invite code");
      console.error(err);
    } finally {
      setLoadingCode(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  useEffect(() => {
    const fetchOrganizationDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: orgData, error: orgError } = await supabase
          .from("Organization")
          .select("*")
          .eq("id", organizationId)
          .single();

        if (orgError) throw orgError;

        setOrganization(orgData);

        if (orgData.owner) {
          const { data: profileData, error: profileError } = await supabase
            .from("Profile")
            .select("*")
            .eq("id", orgData.owner)
            .single();

          if (profileError) throw profileError;

          setOwner(profileData);
        }
      } catch (err) {
        console.error("Error fetching organization or owner:", err);
        setError("Failed to load organization details");
      } finally {
        setIsLoading(false);
      }
    };

    if (organizationId) {
      fetchOrganizationDetails();
    }
  }, [supabase, organizationId]);

  const openModal = () => {
    setIsModalOpen(true);
    setTimeout(() => setIsAnimating(true), 0);
  };

  const closeModal = () => {
    setTimeout(() => setIsModalOpen(false), 300);
    setIsAnimating(false);
  };

  const leaveOrg = async () => {
    try {
      const { data, error } = await supabase
        .from("Profile")
        .update({ organizationId: null })
        .eq("id", owner?.id);
      if (error) throw error;
      navigate("/dashboard/lots");
    } catch (error) {
      console.error("Error removing organization from profile:", error);
      return { error, success: false };
    }
  };

  if (isLoading) {
    return <div>Loading organization details</div>; // you can replace me with a loading skeleton later
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {organization ? (
        <>
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-6xl">{organization.name}</h1>
            <button
              className="text-base bg-red-500 rounded-lg p-2 hover:scale-105 transition-transform duration-300 active:bg-pink-600"
              onClick={openModal}
            >
              Leave Organization
            </button>
          </div>
          <div className="flex flex-col gap-x-12">
            <h3 className="text-2xl mb-4">Owner contact information:</h3>
            <h3 className="text-2xl">
              Owner: {owner?.first_name} {owner?.last_name}
            </h3>
            <h3 className="text-2xl">Email: {owner?.email}</h3>
            <button
              onClick={generateInviteCode}
              className="w-64 h-12 text-xl mt-8 rounded-lg border border-white hover:bg-neutral-600 transition-colors"
            >
              {loadingCode ? "Generating..." : "Generate invite code"}
            </button>
            {inviteCode && (
              <div className="flex gap-4 mt-8 items-center">
                <h3 className="text-xl">Invite code: {inviteCode}</h3>
                <button
                  onClick={handleCopy}
                  className="bg-transparent border rounded-lg hover:bg-neutral-600 transition-colors "
                >
                  {copied ? (
                    <div className="flex gap-2 p-2 items-center">
                      <h3>Copied !</h3>
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  ) : (
                    <div className="flex gap-2 p-2 items-center">
                      <h3>Copy</h3>
                      <Copy className="w-5 h-5" />{" "}
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <div className="w-full px-12 py-4">
              <div className="flex justify-between items-center mb-8"></div>
            </div>
            <div>
              {isModalOpen && (
                <div
                  className={`fixed inset-0 bg-gray-800 bg-opacity-20 flex items-center justify-center z-50 transition-opacity duration-300 ${
                    isAnimating ? "opacity-100" : "opacity-0"
                  }`}
                  onClick={closeModal}
                >
                  <div
                    className={`bg-neutral-800 rounded-lg shadow-2xl  w-3/6 transition-transform duration-300  ${
                      isAnimating ? "scale-100" : "scale-95"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-6 mt-4">
                      <h2 className="text-white text-3xl font-bold">
                        Are you sure you want to leave ?
                      </h2>
                      <button
                        className="flex items-center justify-center rounded-full p-2 hover:bg-neutral-900 hover:opacity-100 hover:duration-300"
                        onClick={closeModal}
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
                      <button
                        type="submit"
                        className="text-base bg-red-500 rounded-lg p-2 active:bg-red-700 active:text-white hover:scale-105 transition-transform duration-300 mt-8 w-1/4 font-bold"
                        onClick={leaveOrg}
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div>No organization found</div>
      )}
    </div>
  );
}
