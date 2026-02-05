
import { createClient } from '@supabase/supabase-js';
import { User, Post, Resource, CompetitionEvent, Notification, Message, Quiz, QuizScore, FriendRequest } from './types';
import { INITIAL_USERS } from './mockData';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqbglkoudzftkgrnhsrb.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_z6ZcVuaEwEYSmRb7wvICQA_7zkYZFPO';

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
export const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getLocal = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

const setLocal = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const db = {
  users: {
    getAll: async (): Promise<User[]> => {
      await delay(200);
      return getLocal('sl_db_users', INITIAL_USERS);
    },
    save: async (users: User[]) => {
      setLocal('sl_db_users', users);
      await delay(200);
    },
    update: async (updatedUser: User) => {
      const users = getLocal<User[]>('sl_db_users', INITIAL_USERS);
      const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      setLocal('sl_db_users', newUsers);
      await delay(200);
    }
  },
  friendRequests: {
    getAll: async (): Promise<FriendRequest[]> => {
      return getLocal('sl_db_friend_reqs', []);
    },
    create: async (req: FriendRequest) => {
      const reqs = getLocal<FriendRequest[]>('sl_db_friend_reqs', []);
      setLocal('sl_db_friend_reqs', [...reqs, req]);
    },
    update: async (updated: FriendRequest) => {
      const reqs = getLocal<FriendRequest[]>('sl_db_friend_reqs', []);
      setLocal('sl_db_friend_reqs', reqs.map(r => r.id === updated.id ? updated : r));
    }
  },
  posts: {
    getAll: async (): Promise<Post[]> => {
      await delay(300);
      return getLocal('sl_db_posts', []);
    },
    create: async (post: Post) => {
      const posts = getLocal<Post[]>('sl_db_posts', []);
      setLocal('sl_db_posts', [post, ...posts]);
      await delay(200);
    }
  },
  resources: {
    getAll: async (): Promise<Resource[]> => {
      return getLocal('sl_db_resources', []);
    },
    create: async (res: Resource) => {
      const items = getLocal<Resource[]>('sl_db_resources', []);
      setLocal('sl_db_resources', [res, ...items]);
    },
    update: async (updated: Resource) => {
      const items = getLocal<Resource[]>('sl_db_resources', []);
      setLocal('sl_db_resources', items.map(i => i.id === updated.id ? updated : i));
    }
  },
  events: {
    getAll: async (): Promise<CompetitionEvent[]> => {
      return getLocal('sl_db_events', []);
    },
    create: async (evt: CompetitionEvent) => {
      const items = getLocal<CompetitionEvent[]>('sl_db_events', []);
      setLocal('sl_db_events', [evt, ...items]);
    },
    update: async (updated: CompetitionEvent) => {
      const items = getLocal<CompetitionEvent[]>('sl_db_events', []);
      setLocal('sl_db_events', items.map(i => i.id === updated.id ? updated : i));
    }
  },
  messages: {
    getAll: async (): Promise<Message[]> => {
      return getLocal('sl_db_messages', []);
    },
    send: async (msg: Message) => {
      const items = getLocal<Message[]>('sl_db_messages', []);
      setLocal('sl_db_messages', [...items, msg]);
    }
  },
  notifications: {
    getAll: async (): Promise<Notification[]> => {
      return getLocal('sl_db_notifs', []);
    },
    create: async (notif: Notification) => {
      const items = getLocal<Notification[]>('sl_db_notifs', []);
      setLocal('sl_db_notifs', [notif, ...items]);
    },
    markRead: async (id: string) => {
      const items = getLocal<Notification[]>('sl_db_notifs', []);
      setLocal('sl_db_notifs', items.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  },
  quizzes: {
    getAll: async (): Promise<Quiz[]> => {
      return getLocal('sl_db_quizzes', []);
    },
    create: async (quiz: Quiz) => {
      const items = getLocal<Quiz[]>('sl_db_quizzes', []);
      setLocal('sl_db_quizzes', [quiz, ...items]);
    },
    scores: {
      getAll: async (): Promise<QuizScore[]> => {
        return getLocal('sl_db_quiz_scores', []);
      },
      create: async (score: QuizScore) => {
        const items = getLocal<QuizScore[]>('sl_db_quiz_scores', []);
        setLocal('sl_db_quiz_scores', [score, ...items]);
      }
    }
  }
};
