
export type Role = 'student' | 'admin';

export interface User {
  id: string;
  fullName: string;
  whatsapp: string;
  university: string;
  department: string;
  level: string;
  role: Role;
  avatar?: string;
  password?: string;
  friends: string[]; // List of User IDs
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted';
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}

export interface PostMedia {
  type: 'image' | 'video' | 'audio';
  url: string;
  name?: string;
}

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  university: string;
  content: string;
  media?: PostMedia;
  likes: string[]; // User IDs
  comments: Comment[];
  status: 'approved';
  isFeatured?: boolean;
  createdAt: number;
}

export interface Comment {
  id: string;
  userId: string;
  authorName: string;
  text: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  isGlobal?: boolean;
}

export interface Resource {
  id: string;
  userId: string;
  title: string;
  description: string;
  link: string;
  department: string;
  level: string;
  status: 'pending' | 'approved';
  isFeatured?: boolean;
  createdAt: number;
}

export interface CompetitionEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  rules: string;
  deadline: string;
  link: string;
  image?: string;
  type: 'competition' | 'event';
  status: 'pending' | 'approved';
  createdAt: number;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  createdAt: number;
  durationMinutes: number;
  active: boolean;
  startTime?: number; // For scheduling
  expiresAt?: number;
}

export interface QuizScore {
  id: string;
  quizId: string;
  userId: string;
  userName: string;
  score: number;
  total: number;
  timestamp: number;
}
