import jwt from 'jsonwebtoken';
import { get, run } from '../db/postgres.js';
import { config } from '../config/env.js';

const JWT_SECRET = config.jwtSecret;

export const createToken = (user) => {
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
      tokenVersion: user.token_version || 1
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return token;
};

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
};

export const getTokenVersion = async (userId) => {
  const user = await get('SELECT token_version FROM users WHERE id = $1', [userId]);
  return user?.token_version || 1;
};

export const incrementTokenVersion = async (userId) => {
  await run('UPDATE users SET token_version = token_version + 1 WHERE id = $1', [userId]);
  const newVersion = await getTokenVersion(userId);
  return newVersion;
};

export const isTokenValid = async (userId, tokenVersion) => {
  const currentVersion = await getTokenVersion(userId);
  return currentVersion === tokenVersion;
};
