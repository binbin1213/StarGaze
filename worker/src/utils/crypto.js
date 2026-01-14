import bcrypt from 'bcryptjs';
export async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}
export async function verifyPassword(password, hash) {
    const bcrypt = (await import('bcryptjs')).default;
    return bcrypt.compare(password, hash);
}
export function generateToken() {
    return crypto.randomUUID();
}
export function generateJWTSecret() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
