import { createClient } from "@supabase/supabase-js";
import type { Contact, Subscriber } from "@shared/schema";

function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  return { url, anonKey };
}

export function getSupabaseClient() {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getSupabaseConnectionStatus() {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    return {
      connected: false,
      configured: false,
      message: "Supabase env vars are missing",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}/auth/v1/health`, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        connected: false,
        configured: true,
        message: `Supabase responded with ${response.status}`,
      };
    }

    return {
      connected: true,
      configured: true,
      message: "Supabase connection is healthy",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      connected: false,
      configured: true,
      message: `Supabase check failed: ${message}`,
    };
  }
}

export async function getSupabaseGoogleOAuthStatus() {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    return {
      connected: false,
      configured: false,
      message: "Supabase env vars are missing",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}/auth/v1/authorize?provider=google`, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      redirect: "manual",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const location = response.headers.get("location") || "";
    const redirectsToGoogle = /accounts\.google\.com/i.test(location);
    const looksHealthy = response.status >= 300 && response.status < 400 && redirectsToGoogle;

    if (looksHealthy) {
      return {
        connected: true,
        configured: true,
        message: "Google OAuth is configured in Supabase",
      };
    }

    return {
      connected: false,
      configured: true,
      message: `Google OAuth check failed (${response.status})`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      connected: false,
      configured: true,
      message: `Google OAuth check failed: ${message}`,
    };
  }
}

export async function upsertContactToSupabase(contact: Contact) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("norwedfilm_contacts")
    .upsert(
      {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        event_date: contact.eventDate,
        event_type: contact.eventType,
        message: contact.message,
        status: contact.status,
        created_at: contact.createdAt ? new Date(contact.createdAt).toISOString() : null,
      },
      { onConflict: "id" },
    );

  if (error) {
    throw new Error(`Contact sync failed: ${error.message}`);
  }
}

export async function deleteContactFromSupabase(contactId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.from("norwedfilm_contacts").delete().eq("id", contactId);
  if (error) {
    throw new Error(`Contact delete sync failed: ${error.message}`);
  }
}

export async function upsertSubscriberToSupabase(subscriber: Subscriber) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("norwedfilm_subscribers")
    .upsert(
      {
        id: subscriber.id,
        email: subscriber.email,
        name: subscriber.name,
        status: subscriber.status,
        source: subscriber.source,
        created_at: subscriber.createdAt ? new Date(subscriber.createdAt).toISOString() : null,
      },
      { onConflict: "id" },
    );

  if (error) {
    throw new Error(`Subscriber sync failed: ${error.message}`);
  }
}

export async function deleteSubscriberFromSupabase(subscriberId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.from("norwedfilm_subscribers").delete().eq("id", subscriberId);
  if (error) {
    throw new Error(`Subscriber delete sync failed: ${error.message}`);
  }
}

export async function syncNorwedfilmDataToSupabase(params: {
  contacts: Contact[];
  subscribers: Subscriber[];
}) {
  let syncedContacts = 0;
  let syncedSubscribers = 0;
  const errors: string[] = [];

  for (const contact of params.contacts) {
    try {
      await upsertContactToSupabase(contact);
      syncedContacts += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown contact sync error";
      errors.push(`contact:${contact.id}:${message}`);
    }
  }

  for (const subscriber of params.subscribers) {
    try {
      await upsertSubscriberToSupabase(subscriber);
      syncedSubscribers += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown subscriber sync error";
      errors.push(`subscriber:${subscriber.id}:${message}`);
    }
  }

  return {
    syncedContacts,
    syncedSubscribers,
    errors,
  };
}
