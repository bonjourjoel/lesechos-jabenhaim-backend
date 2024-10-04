import * as bcryptjs from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const passwordHashed = await bcryptjs.hash(password, 10);
  return passwordHashed;
}
