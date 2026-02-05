
// Add exported interfaces to make this file a valid TypeScript module and provide types for the application.

export interface User {
  id: string;
  fullName: string;
  whatsapp: string;
  university: string;
  department: string;
  level: string;
  role: 'admin' | 'student';
  password?: string;
  avatar: string;
  friends: string[];
}

export interface PostMedia {
  type: 'image' | 'video' | 'audio';
  url: string;
  name?: string;
}

export interface Comment {
  id: string;
  userId: string;
  authorName: string;
  text: string;
  createdAt: number;
}

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  university: string;
  content: string;
  media?: PostMedia;
  likes: string[];
  comments: Comment[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  link: string;
  department: string;
  level: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface CompetitionEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  rules?: string;
  deadline?: string;
  link?: string;
  type: 'competition' | 'event';
  image?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  fromUserId?: string;
  type?: 'friend_request' | 'system' | 'announcement';
  isGlobal?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}

export interface QuizQuestion {
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  questions: QuizQuestion[];
  createdAt: number;
  active: boolean;
  startTime?: number;
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

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}
