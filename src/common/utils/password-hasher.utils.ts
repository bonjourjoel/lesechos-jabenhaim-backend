import * as bcryptjs from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const passwordHashed = await bcryptjs.hash(password, 10);
  return passwordHashed;
}

export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  const isMatch = await bcryptjs.compare(plainPassword, hashedPassword);
  return isMatch;
}
