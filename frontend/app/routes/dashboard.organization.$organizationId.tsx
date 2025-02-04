import { useNavigate, useOutletContext, useParams } from "@remix-run/react";
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

  const navigate = useNavigate();

  const { organizationId } = useParams();

  const [organization, setOrganization] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const returnToLots = 0;

  useEffect(() => {
    const fetchOrganizationDetails = async () => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from("Organization")
          .select("*")
          .eq("id", organizationId)
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

    if (organizationId) {
      fetchOrganizationDetails();
    }
  }, [supabase, organizationId]);

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
