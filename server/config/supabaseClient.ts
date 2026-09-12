// server/config/supabaseClient.ts
// 24/7 Supabase Cloud Database Integration for Cadence
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let lastSyncedAt: string | null = null;
let connectionStatus: 'INITIALIZING' | 'CONNECTED' | 'DISCONNECTED' | 'FALLBACK' = 'INITIALIZING';
let lastError: string | null = null;

const BUCKET_NAME = 'cadencedb';
const STATE_FILENAME = 'cadence_persistent_state.json';

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    connectionStatus = 'FALLBACK';
    lastError = 'Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment';
    console.warn('[Supabase 24/7 DB] Environment credentials missing. Running local memory fallback.');
    return null;
  }

  try {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false },
    });
    return supabaseClient;
  } catch (err: any) {
    connectionStatus = 'DISCONNECTED';
    lastError = err.message;
    console.error('[Supabase 24/7 DB] Initialization error:', err);
    return null;
  }
}

/**
 * Initializes and checks the Supabase connection and bucket readiness.
 */
export async function initializeSupabasePersistence(): Promise<boolean> {
  const client = getSupabase();
  if (!client) {
    return false;
  }

  try {
    // Check or ensure storage bucket exists
    const { data: buckets, error } = await client.storage.listBuckets();
    if (error) {
      console.warn('[Supabase 24/7 DB] List buckets warning:', error.message);
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME || b.id === BUCKET_NAME);
    if (!bucketExists) {
      const { error: createErr } = await client.storage.createBucket(BUCKET_NAME, {
        public: false,
      });
      if (createErr && !createErr.message.includes('already exists')) {
        console.warn('[Supabase 24/7 DB] Bucket creation note:', createErr.message);
      }
    }

    connectionStatus = 'CONNECTED';
    lastError = null;
    console.log(`[Supabase 24/7 DB] Successfully connected to live Supabase cloud at: ${process.env.SUPABASE_URL}`);
    return true;
  } catch (err: any) {
    connectionStatus = 'DISCONNECTED';
    lastError = err.message;
    console.error('[Supabase 24/7 DB] Connection check failed:', err.message);
    return false;
  }
}

/**
 * Persists the entire authoritative Cadence store to Supabase cloud storage 24/7.
 */
export async function persistStoreToSupabase(stateData: any): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const jsonString = JSON.stringify(stateData, null, 2);
    const { error } = await client.storage
      .from(BUCKET_NAME)
      .upload(STATE_FILENAME, jsonString, {
        contentType: 'application/json',
        upsert: true,
      });

    if (error) {
      console.error('[Supabase 24/7 DB] Persistence upload error:', error.message);
      lastError = error.message;
      return false;
    }

    lastSyncedAt = new Date().toISOString();
    connectionStatus = 'CONNECTED';
    lastError = null;
    return true;
  } catch (err: any) {
    console.error('[Supabase 24/7 DB] Persistence exception:', err.message);
    lastError = err.message;
    return false;
  }
}

/**
 * Loads the persisted Cadence store from Supabase on startup.
 */
export async function loadStoreFromSupabase(): Promise<any | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .download(STATE_FILENAME);

    if (error) {
      console.log('[Supabase 24/7 DB] No previous state file found or error downloading:', error.message);
      return null;
    }

    const text = await data.text();
    const parsed = JSON.parse(text);
    lastSyncedAt = new Date().toISOString();
    connectionStatus = 'CONNECTED';
    console.log('[Supabase 24/7 DB] Successfully restored state from live Supabase cloud database.');
    return parsed;
  } catch (err: any) {
    console.warn('[Supabase 24/7 DB] Failed to load stored state from Supabase:', err.message);
    return null;
  }
}

/**
 * Returns diagnostic metadata about the 24/7 Supabase connection.
 */
export function getSupabaseDiagnostic() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const cleanUrl = url.replace(/^https?:\/\//, '');

  return {
    connected: connectionStatus === 'CONNECTED',
    status: connectionStatus,
    projectUrl: url,
    endpointDomain: cleanUrl.split('/')[0] || 'Unconfigured',
    bucket: BUCKET_NAME,
    lastSyncedAt,
    lastError,
    mode: '24/7 High-Availability Cloud Storage',
  };
}
