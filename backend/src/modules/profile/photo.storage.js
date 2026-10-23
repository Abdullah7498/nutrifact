import { randomUUID } from 'node:crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';

function config() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
    process.env;
  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET
  ) {
    throw new ServiceUnavailableException(
      'Profile photo storage is not configured',
    );
  }
  return {
    bucket: R2_BUCKET,
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    }),
  };
}

function imageType(buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  )
    return { type: 'image/jpeg', ext: 'jpg' };
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return { type: 'image/png', ext: 'png' };
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  )
    return { type: 'image/webp', ext: 'webp' };
  throw new BadRequestException('Choose a JPEG, PNG, or WebP image');
}

export async function uploadProfilePhoto(userId, file) {
  if (!file?.buffer?.length) throw new BadRequestException('Choose a photo');
  if (file.buffer.length > 5 * 1024 * 1024)
    throw new BadRequestException('Photo must be under 5 MB');
  const { type, ext } = imageType(file.buffer);
  const { client, bucket } = config();
  const root = (process.env.R2_KEY_PREFIX || 'nutrifact').replace(
    /^\/+|\/+$/g,
    '',
  );
  if (!root.split('/').every((part) => /^[A-Za-z0-9_-]+$/.test(part))) {
    throw new ServiceUnavailableException('R2_KEY_PREFIX is invalid');
  }
  const key = `${root}/users/${userId}/profile/avatar/${randomUUID()}.${ext}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: type,
    }),
  );
  return key;
}

export async function profilePhotoUrl(key) {
  if (!key) return null;
  const { client, bucket } = config();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 3600 },
  );
}

export async function deleteProfilePhoto(key) {
  if (!key) return;
  const { client, bucket } = config();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
