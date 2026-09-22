import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const BUCKET_NAME = 'team-logos';

// Use service role key for server-side uploads (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Ensures the storage bucket exists and is publicly accessible.
 * Called once when the server starts.
 */
export async function ensureBucketExists() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === BUCKET_NAME);
    if (!exists) {
      await supabase.storage.createBucket(BUCKET_NAME, { public: true });
      console.log(`✅ Created Supabase Storage bucket: ${BUCKET_NAME}`);
    }
  } catch (err) {
    console.warn('Could not ensure bucket exists (may already exist):', err);
  }
}

/**
 * Uploads a file from a local path to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFileToSupabase(
  localPath: string,
  fileName: string,
  mimeType: string
): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase env vars missing: SUPABASE_URL or SUPABASE_SECRET_KEY not set on the server.');
  }

  const fileBuffer = fs.readFileSync(localPath);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Deletes a file from Supabase Storage by its public URL.
 */
export async function deleteFileFromSupabase(publicUrl: string) {
  try {
    // Extract the file path from the URL
    const urlParts = publicUrl.split(`/${BUCKET_NAME}/`);
    if (urlParts.length < 2) return;
    const filePath = urlParts[1];
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  } catch (err) {
    console.warn('Could not delete file from Supabase:', err);
  }
}
