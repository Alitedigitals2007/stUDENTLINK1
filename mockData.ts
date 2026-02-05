
import { User, Post, Resource, CompetitionEvent } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'admin-1',
    fullName: 'Platform Admin',
    whatsapp: '09154681851',
    university: 'Student Link Global',
    department: 'Administration',
    level: 'N/A',
    role: 'admin',
    password: 'admin123',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
    friends: [],
  }
];

export const INITIAL_POSTS: Post[] = [];
export const INITIAL_RESOURCES: Resource[] = [];
export const INITIAL_EVENTS: CompetitionEvent[] = [];
