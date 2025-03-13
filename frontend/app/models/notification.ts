import { SupabaseClient } from "@supabase/auth-helpers-remix";
import { Database } from "~/types/supabase";



export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export async function getUserNotifications(supabase: SupabaseClient, userId: string): Promise<Notification[]> {    
    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(40);

    if (error) {
        console.error('Error fetching notifications:', error);
        throw new Error('Failed to fetch notifications');
    }

    return data || [];
}

export async function createNotification(
    userId: number | null,
    content: string,
    type: string,
    action_url: string,
    supabase: SupabaseClient,
): Promise<Notification> {
    const { data, error } = await supabase
    .from("notifications")
    .insert([
        {
            user_id: userId,
            content,
            type,
            action_url,
            is_read: false,
        },
    ])
    .select()
    .single();

    if (error) {
        console.error('Error creating notification:', error);
        throw new Error('Failed to create notification');
      }
    
      return data;
    }

    export async function markNotificationAsRead(supabase: SupabaseClient, notificationId: number): Promise<void> {
        const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)

        if (error) {
            console.error('Error marking notification as read:', error);
            throw new Error('Failed to mark notification as read');
          }
    }

    export async function markAllNotificationsAsRead(supabase: SupabaseClient, userId: string): Promise<void> {
        const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

        if (error) {
            console.error('Error marking all notifications as read:', error);
            throw new Error('Failed to mark all notifications as read');
          }
    }

    // Helper functions for specific actions 

    export async function createParkingRequestNotification(
        requesterId: string,
        parkingLotId: number | null,
        parkingLotName: string,
        organizationId: number | null,
        supabase: SupabaseClient,

    ): Promise<void> {
        await createNotification(organizationId, `Someone has requested to join: ${parkingLotName}`, "new_membership",`/dashboard/admin-memberships/${parkingLotId}` , supabase);
    }


    // this isn't used, a trigger is used to update it
    export async function createIllegalVehicalNotification(
        parkingLotName: string,
        ownerId: number | null,
        supabase: SupabaseClient,

    ): Promise<void> {
        await createNotification(ownerId, `A vehicle without a membership has entered parking lot: ${parkingLotName}`,"illegal_vehicle", "/dashboard/records", supabase);
    }


    // realtime subscription
    export function subscribeToExternalEvents(
        supabase: SupabaseClient, 
        userId: string, 
        callback: () => void
      ) {
        return supabase
          .channel(`notifications:${userId}`)
          .on(
            "postgres_changes",
            { 
              event: "*", 
              schema: "public", 
              table: "notifications", 
              filter: `user_id=eq.${userId}` 
            },
            (payload) => {
              callback();
            }
          )
          .subscribe();
      }

