import { useOutletContext, useParams } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/server-runtime";
import {
  createServerClient,
  SupabaseClient,
} from "@supabase/auth-helpers-remix";
import { useEffect, useState } from "react";

export const loader: LoaderFunction = async ({ params, request }) => {
  return null;
};

export default function OrganizationDetailPage() {
  const { supabase } = useOutletContext<{
    supabase: SupabaseClient;
  }>();

  const { orgId } = useParams();

  const [organization, setOrganization] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizationDetails = async () => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from("Organization")
          .select("*")
          .eq("id", orgId)
          .single();

        if (error) {
          throw error;
        }

        setOrganization(data);
      } catch (err) {
        console.error("Error fetching organization:", err);
        setError("Failed to load organization details");
      } finally {
        setIsLoading(false);
      }
    };

    if (orgId) {
      fetchOrganizationDetails();
    }
  }, [supabase, orgId]);

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
          <h1>{organization.name}</h1>
          <h3>{organization.owner}</h3>
        </>
      ) : (
        <div>No organization found</div>
      )}
    </div>
  );
}
