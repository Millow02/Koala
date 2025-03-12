import { useOutletContext, useRouteLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import {
  createServerClient,
  SupabaseClient,
  User,
} from "@supabase/auth-helpers-remix";
import React, { useEffect, useState } from "react";
import {
  getUserNotifications,
  subscribeToExternalEvents,
} from "~/models/notification";

import { Database } from "~/types/supabase";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

export default function Notifications() {
  const { user, supabase } = useOutletContext<ContextType>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return;

      setIsLoading(true);

      try {
        const notificationData = await getUserNotifications(supabase, user.id);
        setNotifications(notificationData);
      } catch (error) {
        console.error("Error fetching notifications", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const refreshNotifications = async () => {
      console.log("refreshing notifications");
      try {
        const data = await getUserNotifications(supabase, user.id);
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications", error);
      }
    };

    const subscription = subscribeToExternalEvents(
      supabase,
      user.id,
      refreshNotifications
    );

    refreshNotifications();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, supabase]);

  return (
    <div>
      <h1>Notifications</h1>
      <ul>
        {notifications.map((notification) => (
          <li key={notification.id} className="p-2">
            {notification.content}
          </li>
        ))}
      </ul>
    </div>
  );
}
