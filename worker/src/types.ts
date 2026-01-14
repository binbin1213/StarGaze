export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  KV: KVNamespace;
  JWT_SECRET: string;
  R2_PUBLIC_URL?: string;
  WORKER_URL?: string;
}

export interface Star {
  id: number;
  name: string;
  name_en?: string;
  birthday?: string;
  height?: string;
  weight?: string;
  measurements?: string;
  biography?: string;
  avatar_url?: string;
  university?: string;
  major?: string;
  degree?: string;
  representative_works?: string;
  tags?: string;
  thai_name?: string;
  nickname?: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: number;
  filename: string;
  original_name: string;
  star_id?: number;
  star_name?: string;
  chineseName?: string;
  englishName?: string;
  tags?: string;
  width?: number;
  height?: number;
  size?: number;
  mime_type?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: string;
}
