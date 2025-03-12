import { Link, useOutletContext, useRouteLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import {
  createServerClient,
  SupabaseClient,
  User,
} from "@supabase/auth-helpers-remix";
import React, { useEffect, useState } from "react";
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
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

  const fetchNotifications = async () => {
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
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(supabase, user.id);
    fetchNotifications();
  };

  const handleMarkAsRead = async (notificationId: number) => {
    await markNotificationAsRead(supabase, notificationId);
  };

  useEffect(() => {
    if (!user) return;

    const refreshNotifications = async () => {
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
    <div className="px-32">
      <h1 className="text-3xl">Notifications</h1>
      <hr className="border-pink-500 border-1 mt-6 mb-12" />
      <div className="flex justify-end mb-2">
        <button
          type="submit"
          className="bg-transparent text-neutral-400 hover:text-neutral-200 transition-colors"
          onClick={() => handleMarkAllAsRead()}
        >
          Mark all as read
        </button>
      </div>
      <div className="flex flex-col items-center gap-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`w-full px-4 py-8 rounded-lg ${
              notification.is_read ? "bg-neutral-700" : "bg-neutral-500"
            }`}
          >
            <div className="flex justify-between items-center align-middle">
              <p className="text-xl">{notification.content}</p>
              <Link
                to={notification.action_url}
                className="text-lg text-blue-400 mr-4 underline"
                onClick={() => handleMarkAsRead(notification.id)}
              >
                View Action
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
