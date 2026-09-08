/**
 * Google Cloud Storage configuration.
 *
 * Credentials are read ONLY from environment variables - never hard-coded.
 * GOOGLE_CLOUD_PRIVATE_KEY commonly arrives with literal "\n" sequences
 * (because most hosting dashboards, including Render, do not let you paste
 * real newlines into an env var). We convert those literal "\n" sequences
 * back into real newline characters before handing the key to the SDK,
 * otherwise the private key will fail to parse.
 */

const { Storage } = require('@google-cloud/storage');

function getPrivateKey() {
  const raw = process.env.GOOGLE_CLOUD_PRIVATE_KEY || '';
  return raw.replace(/\\n/g, '\n');
}

let storageInstance = null;
let bucketInstance = null;

function getStorage() {
  if (storageInstance) return storageInstance;

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      '[GCS] Google Cloud Storage credentials are missing. ' +
      'File uploads (payment proof / product images) will fail until ' +
      'GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_CLIENT_EMAIL and GOOGLE_CLOUD_PRIVATE_KEY are set.'
    );
  }

  storageInstance = new Storage({
    projectId,
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });

  return storageInstance;
}

function getBucket() {
  if (bucketInstance) return bucketInstance;
  const bucketName = process.env.GOOGLE_CLOUD_BUCKET;
  if (!bucketName) {
    console.warn('[GCS] GOOGLE_CLOUD_BUCKET is not set.');
  }
  bucketInstance = getStorage().bucket(bucketName);
  return bucketInstance;
}

/**
 * Uploads a buffer to Google Cloud Storage under the given folder and
 * returns the object's storage path (NOT a public URL - proof screenshots
 * stay private and must be accessed via signed URLs, see getSignedUrl).
 */
async function uploadBuffer(buffer, originalName, mimeType, folder = 'uploads') {
  const bucket = getBucket();
  const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const objectPath = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
  const file = bucket.file(objectPath);

  await file.save(buffer, {
    metadata: { contentType: mimeType },
    resumable: false,
    // Private by default - no `public: true` here on purpose.
  });

  return objectPath;
}

/**
 * Generates a short-lived signed URL so an authenticated admin can view a
 * private payment-proof screenshot without the bucket being public.
 */
async function getSignedUrl(objectPath, expiresInMinutes = 15) {
  const bucket = getBucket();
  const file = bucket.file(objectPath);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });
  return url;
}

/**
 * Uploads a buffer as a PUBLIC object (used for product images only -
 * these need to render on the storefront without an auth check).
 * Payment proofs must NEVER use this function - use uploadBuffer instead.
 */
async function uploadPublicBuffer(buffer, originalName, mimeType, folder = 'products') {
  const bucket = getBucket();
  const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const objectPath = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
  const file = bucket.file(objectPath);

  await file.save(buffer, {
    metadata: { contentType: mimeType },
    resumable: false,
    public: true,
  });

  const bucketName = process.env.GOOGLE_CLOUD_BUCKET;
  return `https://storage.googleapis.com/${bucketName}/${objectPath}`;
}

async function deleteObject(objectPathOrUrl) {
  if (!objectPathOrUrl) return;
  try {
    const bucket = getBucket();
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET;
    // Accept either a raw object path or a public storage.googleapis.com URL.
    const prefix = `https://storage.googleapis.com/${bucketName}/`;
    const objectPath = objectPathOrUrl.startsWith(prefix)
      ? objectPathOrUrl.slice(prefix.length)
      : objectPathOrUrl;
    await bucket.file(objectPath).delete({ ignoreNotFound: true });
  } catch (err) {
    console.error('[GCS] Failed to delete object:', objectPathOrUrl, err.message);
  }
}

module.exports = { getStorage, getBucket, uploadBuffer, uploadPublicBuffer, getSignedUrl, deleteObject };
