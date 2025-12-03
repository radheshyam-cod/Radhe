import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const secret = process.env.JWT_SECRET || 'your-super-secret-key';

export function signToken(payload: object): string {
  return jwt.sign(payload, secret, { expiresIn: '1d' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

export function getUserFromRequest() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  return verifyToken(token);
}
