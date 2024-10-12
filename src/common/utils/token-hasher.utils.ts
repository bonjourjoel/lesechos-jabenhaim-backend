import { createHmac } from 'crypto';

export async function hashToken(str: string): Promise<string> {
  const secret = process.env.JWT_HASH_SECRET;
  if (!secret) {
    throw new Error('JWT_HASH_SECRET secret is not defined');
  }

  const hash = createHmac('sha256', secret).update(str).digest('hex');

  return hash;
}

export async function compareHashedToken(args: {
  plainStr: string;
  hashedStr: string;
}): Promise<boolean> {
  const { plainStr, hashedStr } = args;

  const plainStrHashed = await hashToken(plainStr);

  return plainStrHashed === hashedStr;
}
