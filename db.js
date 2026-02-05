
import { createClient } from '@supabase/supabase-js';
import { INITIAL_USERS } from './mockData';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqbglkoudzftkgrnhsrb.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_z6ZcVuaEwEYSmRb7wvICQA_7zkYZFPO';

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
export const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const getLocal = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

const setLocal = (key, value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export const db = {
  users: {
    getAll: async () => {
      await delay(100);
      return getLocal('sl_db_users', INITIAL_USERS);
    },
    save: async (users) => {
      setLocal('sl_db_users', users);
      await delay(100);
    },
    update: async (updatedUser) => {
      const users = getLocal('sl_db_users', INITIAL_USERS);
      const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      setLocal('sl_db_users', newUsers);
      await delay(100);
    }
  },
  friendRequests: {
    getAll: async () => {
      return getLocal('sl_db_friend_reqs', []);
    },
    create: async (req) => {
      const reqs = getLocal('sl_db_friend_reqs', []);
      setLocal('sl_db_friend_reqs', [...reqs, req]);
    },
    update: async (updated) => {
      const reqs = getLocal('sl_db_friend_reqs', []);
      setLocal('sl_db_friend_reqs', reqs.map(r => r.id === updated.id ? updated : r));
    }
  },
  posts: {
    getAll: async () => {
      await delay(100);
      return getLocal('sl_db_posts', []);
    },
    create: async (post) => {
      const posts = getLocal('sl_db_posts', []);
      setLocal('sl_db_posts', [post, ...posts]);
      await delay(100);
    }
  },
  resources: {
    getAll: async () => {
      return getLocal('sl_db_resources', []);
    },
    create: async (res) => {
      const items = getLocal('sl_db_resources', []);
      setLocal('sl_db_resources', [res, ...items]);
    },
    update: async (updated) => {
      const items = getLocal('sl_db_resources', []);
      setLocal('sl_db_resources', items.map(i => i.id === updated.id ? updated : i));
    }
  },
  events: {
    getAll: async () => {
      return getLocal('sl_db_events', []);
    },
    create: async (evt) => {
      const items = getLocal('sl_db_events', []);
      setLocal('sl_db_events', [evt, ...items]);
    },
    update: async (updated) => {
      const items = getLocal('sl_db_events', []);
      setLocal('sl_db_events', items.map(i => i.id === updated.id ? updated : i));
    }
  },
  messages: {
    getAll: async () => {
      return getLocal('sl_db_messages', []);
    },
    send: async (msg) => {
      const items = getLocal('sl_db_messages', []);
      setLocal('sl_db_messages', [...items, msg]);
    }
  },
  notifications: {
    getAll: async () => {
      return getLocal('sl_db_notifs', []);
    },
    create: async (notif) => {
      const items = getLocal('sl_db_notifs', []);
      setLocal('sl_db_notifs', [notif, ...items]);
    },
    markRead: async (id) => {
      const items = getLocal('sl_db_notifs', []);
      setLocal('sl_db_notifs', items.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  },
  quizzes: {
    getAll: async () => {
      return getLocal('sl_db_quizzes', []);
    },
    create: async (quiz) => {
      const items = getLocal('sl_db_quizzes', []);
      setLocal('sl_db_quizzes', [quiz, ...items]);
    },
    scores: {
      getAll: async () => {
        return getLocal('sl_db_quiz_scores', []);
      },
      create: async (score) => {
        const items = getLocal('sl_db_quiz_scores', []);
        setLocal('sl_db_quiz_scores', [score, ...items]);
      }
    }
  }
};
