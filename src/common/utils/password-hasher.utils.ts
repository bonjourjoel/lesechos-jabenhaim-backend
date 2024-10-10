import * as bcryptjs from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const passwordHashed = await bcryptjs.hash(password, 10);
  return passwordHashed;
}

export async function compareHashedPasword(args: {
  plainStr: string;
  hashedStr: string;
}): Promise<boolean> {
  const isMatch = await bcryptjs.compare(args.plainStr, args.hashedStr);
  return isMatch;
}
