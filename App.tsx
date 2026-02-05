
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, 
  BookOpen, 
  Trophy, 
  User as UserIcon, 
  Plus, 
  Search, 
  MessageCircle, 
  Heart, 
  Share2, 
  Settings,
  Bell,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  GraduationCap,
  Users,
  BarChart3,
  Star,
  Trash2,
  ChevronRight,
  Send,
  UserPlus,
  Clock,
  Camera,
  ImageIcon,
  ChevronLeft,
  Edit3,
  LogOut,
  Megaphone,
  Video,
  Music,
  Mic,
  FileText,
  Zap,
  MoreVertical,
  ClipboardList,
  Timer,
  AlertCircle,
  Smile,
  LayoutGrid,
  Calendar
} from 'lucide-react';
import { User, Post, Resource, CompetitionEvent, Role, Message, Comment, PostMedia, Notification, Quiz, QuizScore, QuizQuestion, FriendRequest } from './types';
import { INITIAL_USERS } from './mockData';
import { summarizeResource } from './geminiService';
import { db } from './db';

// --- Shared UI Components ---

const Badge: React.FC<{ count: number; className?: string }> = ({ count, className = "" }) => {
  if (count <= 0) return null;
  return (
    <span className={`absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-black text-white border-2 border-white ${className}`}>
      {count > 9 ? '9+' : count}
    </span>
  );
};

const Button: React.FC<{ 
  onClick?: () => void; 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}> = ({ onClick, children, variant = 'primary', className = '', type = 'button', disabled }) => {
  const styles = {
    primary: 'bg-[#008080] text-white hover:bg-[#006666]',
    secondary: 'bg-[#FFA500] text-white hover:bg-[#e69500]',
    outline: 'border-2 border-[#008080] text-[#008080] hover:bg-[#008080] hover:text-white',
    ghost: 'text-gray-600 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600'
  };
  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick} 
      className={`px-4 py-3 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 ${styles[variant]} ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {children}
    </button>
  );
};

const Input: React.FC<{
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  type?: string;
  options?: string[];
  multiline?: boolean;
  id?: string;
}> = ({ label, placeholder, value, onChange, type = 'text', options, multiline, id }) => (
  <div className="flex flex-col gap-1 w-full mb-4">
    {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1 ml-1">{label}</label>}
    {options ? (
      <select 
        id={id}
        value={value} 
        onChange={onChange}
        className="px-5 py-4 rounded-[1.5rem] border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#008080] transition-all bg-gray-50 font-bold text-gray-800 appearance-none"
      >
        <option value="">Select Option</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : multiline ? (
      <textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={4}
        className="px-5 py-4 rounded-[1.5rem] border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#008080] transition-all resize-none font-bold bg-gray-50 text-gray-800 placeholder:text-gray-300"
      />
    ) : (
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="px-5 py-4 rounded-[1.5rem] border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#008080] transition-all font-bold bg-gray-50 text-gray-800 placeholder:text-gray-300"
      />
    )}
  </div>
);

const TERTIARY_INSTITUTIONS = [
  "University of Ibadan (UI)", "University of Lagos (UNILAG)", "Obafemi Awolowo University (OAU)", 
  "Ahmadu Bello University (ABU)", "University of Nigeria, Nsukka (UNN)", "University of Benin (UNIBEN)", 
  "University of Ilorin (UNILORIN)", "Federal University, Oye-Ekiti (FUOYE)", "Lagos State University (LASU)", 
  "Covenant University", "Babcock University", "Other (Specify...)"
];

export default function App() {
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'home' | 'resources' | 'events' | 'social' | 'admin' | 'notifications' | 'leaderboard'>('landing');
  const [socialTab, setSocialTab] = useState<'circle' | 'messages' | 'discover'>('discover');
  const [user, setUser] = useState<User | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizScores, setQuizScores] = useState<QuizScore[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [friendReqs, setFriendReqs] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Global States
  const [globalAnnouncement, setGlobalAnnouncement] = useState<Notification | null>(null);

  // Interaction States
  const [viewingCommentsPost, setViewingCommentsPost] = useState<Post | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // Sync with DB
  const syncData = async () => {
    try {
      const [u, p, r, e, n, q, s, m, fr] = await Promise.all([
        db.users.getAll(),
        db.posts.getAll(),
        db.resources.getAll(),
        db.events.getAll(),
        db.notifications.getAll(),
        db.quizzes.getAll(),
        db.quizzes.scores.getAll(),
        db.messages.getAll(),
        db.friendRequests.getAll()
      ]);
      setUsers(u); setPosts(p); setResources(r); setEvents(e); setNotifications(n); setQuizzes(q); setQuizScores(s); setMessages(m); setFriendReqs(fr);
      
      const activeGlobal = n.find(notif => notif.isGlobal && (Date.now() - notif.timestamp < 3600000));
      setGlobalAnnouncement(activeGlobal || null);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { syncData().finally(() => setIsLoading(false)); }, [view]);

  // UI / Form States
  const [loginForm, setLoginForm] = useState({ whatsapp: '', password: '' });
  const [regData, setRegData] = useState({ fullName: '', whatsapp: '', university: '', customUniversity: '', department: '', level: '', password: '' });
  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState<PostMedia | null>(null);
  const [showAddPost, setShowAddPost] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [activeChat, setActiveChat] = useState<User | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'approvals' | 'broadcast' | 'quiz'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Quiz Admin States
  const [quizMode, setQuizMode] = useState<'manual' | 'bulk'>('manual');
  const [quizForm, setQuizForm] = useState({ title: '', description: '', duration: 15, startTime: '', expiresAt: '' });
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], correctIndex: 0 });
  const [bulkQuizJson, setBulkQuizJson] = useState('');

  // Event & Resource States
  const [eventForm, setEventForm] = useState({ title: '', description: '', rules: '', deadline: '', link: '', type: 'competition' as const, image: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', description: '', link: '', department: '', level: '' });
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '' });

  // Quiz Taking State
  const [activeTakingQuiz, setActiveTakingQuiz] = useState<Quiz | null>(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<{ score: number, total: number } | null>(null);
  const [quizTimer, setQuizTimer] = useState(0);

  // Timer Effect
  useEffect(() => {
    let timer: any;
    if (activeTakingQuiz && !quizResult && quizTimer > 0) {
      timer = setInterval(() => {
        setQuizTimer(prev => {
          if (prev <= 1) {
            handleQuizTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeTakingQuiz, quizResult, quizTimer]);

  const handleQuizTimeUp = () => {
    const finalScore = calculateQuizScore(quizAnswers);
    finishQuiz(finalScore);
  };

  const calculateQuizScore = (answers: number[]) => {
    let score = 0;
    answers.forEach((ans, idx) => {
      if (ans === activeTakingQuiz!.questions[idx].correctIndex) score++;
    });
    return score;
  };

  const finishQuiz = async (score: number) => {
    const scoreObj: QuizScore = {
      id: Math.random().toString(), quizId: activeTakingQuiz!.id, userId: user!.id,
      userName: user!.fullName, score: score, total: activeTakingQuiz!.questions.length,
      timestamp: Date.now()
    };
    await db.quizzes.scores.create(scoreObj);
    setQuizScores([...quizScores, scoreObj]);
    setQuizResult({ score: score, total: activeTakingQuiz!.questions.length });
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const postsCopy = [...posts];
    const post = postsCopy.find(p => p.id === postId);
    if (post) {
      if (post.likes.includes(user.id)) {
        post.likes = post.likes.filter(id => id !== user.id);
      } else {
        post.likes.push(user.id);
      }
      setPosts(postsCopy);
      const items = JSON.parse(localStorage.getItem('sl_db_posts') || '[]');
      const updated = items.map((i: any) => i.id === postId ? post : i);
      localStorage.setItem('sl_db_posts', JSON.stringify(updated));
    }
  };

  const handleComment = async () => {
    if (!user || !viewingCommentsPost || !commentInput.trim()) return;
    const newComment: Comment = {
      id: Math.random().toString(),
      userId: user.id,
      authorName: user.fullName,
      text: commentInput,
      createdAt: Date.now()
    };
    
    const postsCopy = [...posts];
    const post = postsCopy.find(p => p.id === viewingCommentsPost.id);
    if (post) {
      post.comments.push(newComment);
      setPosts(postsCopy);
      setCommentInput('');
      const items = JSON.parse(localStorage.getItem('sl_db_posts') || '[]');
      const updated = items.map((i: any) => i.id === post.id ? post : i);
      localStorage.setItem('sl_db_posts', JSON.stringify(updated));
    }
  };

  const getAIInsight = async (title: string, description: string) => {
    setAiInsight("Analyzing resource for Nigerian students...");
    const insight = await summarizeResource(title, description);
    setAiInsight(insight);
  };

  const handleLogin = () => {
    const wa = loginForm.whatsapp.trim();
    const pw = loginForm.password.trim();
    const found = users.find(u => u.whatsapp === wa && u.password === pw);
    if (found) { setUser(found); setView('home'); } 
    else { alert(`Invalid credentials.`); }
  };

  const handleRegister = async () => {
    const finalInst = regData.university === 'Other (Specify...)' ? regData.customUniversity : regData.university;
    if (!regData.fullName || !finalInst || !regData.whatsapp || !regData.password) return alert("Fill all required fields.");
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      ...regData, 
      university: finalInst, 
      role: 'student',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${regData.fullName}`, 
      friends: []
    };
    
    const updatedUsers = [...users, newUser];
    await db.users.save(updatedUsers);
    setUsers(updatedUsers); 
    setUser(newUser); 
    setView('home');
    alert("Welcome to the Circle!");
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updatedData };
    await db.users.update(newUser);
    setUser(newUser);
    setUsers(users.map(u => u.id === user.id ? newUser : u));
    setIsEditingProfile(false);
    alert("Profile updated!");
  };

  const submitPost = async () => {
    if (!user || !postContent.trim()) return;
    const newPost: Post = {
      id: Math.random().toString(36).substr(2, 9), userId: user.id, authorName: user.fullName,
      university: user.university, content: postContent, media: postMedia || undefined,
      likes: [], comments: [], status: 'approved', createdAt: Date.now()
    };
    await db.posts.create(newPost);
    setPosts([newPost, ...posts]); setPostContent(''); setPostMedia(null); setShowAddPost(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostMedia({ type, url: reader.result as string, name: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBulkQuizImport = () => {
    try {
      const parsed = JSON.parse(bulkQuizJson);
      if (!parsed.title || !Array.isArray(parsed.questions)) throw new Error();
      setQuizForm({ ...quizForm, title: parsed.title, description: parsed.description || '' });
      setQuizQuestions(parsed.questions.map((q: any) => ({ ...q, id: Math.random().toString() })));
      setQuizMode('manual');
      alert("Import Successful! Review the questions below.");
    } catch (e) {
      alert("Invalid JSON format. Expected: { title: '...', description: '...', questions: [...] }");
    }
  };

  const saveQuiz = async () => {
    if (!quizForm.title || quizQuestions.length === 0) return alert("Missing info");
    const newQuiz: Quiz = {
      id: Math.random().toString(), 
      title: quizForm.title,
      description: quizForm.description,
      questions: quizQuestions,
      createdAt: Date.now(), 
      active: true, 
      durationMinutes: quizForm.duration,
      startTime: quizForm.startTime ? new Date(quizForm.startTime).getTime() : undefined,
      expiresAt: quizForm.expiresAt ? new Date(quizForm.expiresAt).getTime() : undefined,
    };
    await db.quizzes.create(newQuiz);
    setQuizzes([...quizzes, newQuiz]);
    setQuizQuestions([]); setQuizForm({ title: '', description: '', duration: 15, startTime: '', expiresAt: '' });
    alert("Quiz Deployed Globally!");
  };

  const sendBroadcast = async () => {
    const { title, message } = broadcastForm;
    if (!title || !message) return alert("Fill all fields");
    const notif: Notification = {
      id: Math.random().toString(), title, message, timestamp: Date.now(), isRead: false, isGlobal: true
    };
    await db.notifications.create(notif);
    setGlobalAnnouncement(notif);
    setBroadcastForm({ title: '', message: '' });
    alert("Broadcasting to all students...");
  };

  const startQuiz = (quiz: Quiz) => {
    const alreadyTaken = quizScores.some(s => s.quizId === quiz.id && s.userId === user?.id);
    if (alreadyTaken) return alert("You have already completed this challenge. One access per user only.");
    
    const now = Date.now();
    if (quiz.startTime && now < quiz.startTime) {
      return alert(`This quiz is scheduled for ${new Date(quiz.startTime).toLocaleString()}.`);
    }
    if (quiz.expiresAt && now > quiz.expiresAt) {
      return alert("This quiz has expired.");
    }

    setActiveTakingQuiz(quiz); 
    setCurrentQuizIndex(0); 
    setQuizAnswers([]); 
    setQuizResult(null);
    setQuizTimer(quiz.durationMinutes * 60);
  };

  const submitQuizAnswer = (optionIndex: number) => {
    const newAnswers = [...quizAnswers, optionIndex];
    setQuizAnswers(newAnswers);
    if (currentQuizIndex < activeTakingQuiz!.questions.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
    } else {
      const finalScore = calculateQuizScore(newAnswers);
      finishQuiz(finalScore);
    }
  };

  const sendMessage = async () => {
    if (!user || !activeChat || !chatInput.trim()) return;
    const msg: Message = { id: Math.random().toString(), senderId: user.id, receiverId: activeChat.id, text: chatInput, timestamp: Date.now() };
    await db.messages.send(msg);
    setMessages([...messages, msg]);
    setChatInput('');
  };

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return;
    const existing = friendReqs.find(r => (r.senderId === user.id && r.receiverId === receiverId) || (r.senderId === receiverId && r.receiverId === user.id));
    if (existing) return alert("Request already exists.");
    
    const req: FriendRequest = {
      id: Math.random().toString(),
      senderId: user.id,
      receiverId: receiverId,
      status: 'pending'
    };
    await db.friendRequests.create(req);
    setFriendReqs([...friendReqs, req]);
    alert("Request sent!");
  };

  const acceptFriendRequest = async (req: FriendRequest) => {
    if (!user) return;
    const updated = { ...req, status: 'accepted' as const };
    await db.friendRequests.update(updated);
    setFriendReqs(friendReqs.map(r => r.id === req.id ? updated : r));
    
    const sender = users.find(u => u.id === req.senderId);
    if (sender) {
      const u1 = { ...user, friends: [...user.friends, req.senderId] };
      const u2 = { ...sender, friends: [...sender.friends, user.id] };
      await db.users.update(u1);
      await db.users.update(u2);
      setUser(u1);
      setUsers(users.map(u => u.id === u1.id ? u1 : u.id === u2.id ? u2 : u));
    }
  };

  const handleAdminDirectEventSubmit = async () => {
    if(!eventForm.title || !user) return alert("Title is mandatory");
    const e: CompetitionEvent = { 
      id: Math.random().toString(), 
      userId: user.id, 
      ...eventForm, 
      status: 'approved', 
      createdAt: Date.now() 
    };
    await db.events.create(e);
    setEvents(prev => [e, ...prev]);
    setEventForm({ title: '', description: '', rules: '', deadline: '', link: '', type: 'competition', image: '' });
    alert("Official Hub Item Published Successfully!");
  };

  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;
  const pendingRequestsCount = friendReqs.filter(r => r.receiverId === user?.id && r.status === 'pending').length;

  const filteredUsers = users.filter(u => 
    u.id !== user?.id && 
    (u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.university.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const myFriends = users.filter(u => user?.friends.includes(u.id));
  const recentChats = useMemo(() => {
    if (!user) return [];
    const chatUserIds = new Set(messages.filter(m => m.senderId === user.id || m.receiverId === user.id).map(m => m.senderId === user.id ? m.receiverId : m.senderId));
    return users.filter(u => chatUserIds.has(u.id));
  }, [messages, users, user]);

  if (view === 'landing') {
    return (
      <div className="app-container bg-white flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#008080]/10 to-transparent -z-10"></div>
        <div className="w-24 h-24 bg-[#008080] rounded-[2.5rem] flex items-center justify-center text-white rotate-12 shadow-2xl mb-12"><GraduationCap size={48} /></div>
        <h1 className="text-5xl font-black text-gray-900 leading-tight mb-4 tracking-tighter">Student<br/>Link.</h1>
        <p className="text-gray-400 text-sm mb-16 font-medium max-w-[280px]">Connecting Nigerian Tertiary Students across 100+ Institutions.</p>
        <div className="w-full flex flex-col gap-4">
          <Button onClick={() => setView('register')} className="w-full py-6 rounded-[2rem] text-lg">Join the Circle</Button>
          <button onClick={() => setView('login')} className="py-4 text-gray-400 font-black uppercase tracking-[4px] text-[10px]">Portal Access</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container bg-[#fcfcfc] relative">
      {/* Global Banner */}
      {globalAnnouncement && (
        <div className="bg-[#FFA500] text-white p-4 flex items-center gap-3 animate-pulse-slow relative z-[60]">
           <Megaphone size={20} className="shrink-0"/>
           <div className="flex-1 overflow-hidden">
             <p className="font-black text-[10px] uppercase leading-none mb-1">Global Announcement</p>
             <p className="text-xs font-bold truncate">{globalAnnouncement.message}</p>
           </div>
           <button onClick={() => setGlobalAnnouncement(null)} className="p-1"><XCircle size={16}/></button>
        </div>
      )}

      <header className="px-6 pt-10 pb-4 bg-white flex items-center justify-between sticky top-0 z-50 border-b border-gray-50/50">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase">
            {view === 'home' && 'Circle Feed'} {view === 'resources' && 'Library'} {view === 'events' && 'Big Hub'}
            {view === 'admin' && 'Admin'} {view === 'social' && 'Social Hub'} {view === 'register' && 'Join'} 
            {view === 'login' && 'Portal'} {view === 'notifications' && 'Activity'} {view === 'leaderboard' && 'Ranks'}
          </h2>
          {user && <p className="text-[10px] text-[#008080] font-black uppercase tracking-widest">{user.university}</p>}
        </div>
        <div className="flex gap-2">
          {user?.role === 'admin' && view !== 'admin' && <button onClick={() => setView('admin')} className="p-3 bg-red-50 text-red-600 rounded-2xl"><ShieldAlert size={20} /></button>}
          {user && (
            <button onClick={() => setView('notifications')} className="p-3 bg-gray-50 text-gray-400 rounded-2xl relative">
              <Bell size={20} />
              <Badge count={unreadNotifsCount + pendingRequestsCount} />
            </button>
          )}
          {user && <button onClick={() => setViewedUser(user)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl"><UserIcon size={20} /></button>}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 mb-24 no-scrollbar">
        {view === 'login' && (
          <div className="p-8 bg-white rounded-[3.5rem] shadow-xl mt-12 border border-gray-100 animate-fade-in">
            <h3 className="text-3xl font-black mb-8 text-center tracking-tighter uppercase">Welcome back.</h3>
            <Input label="WhatsApp Line" value={loginForm.whatsapp} onChange={e => setLoginForm({...loginForm, whatsapp: e.target.value})} />
            <Input label="Access Key" type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            <Button onClick={handleLogin} className="w-full py-5 rounded-[2.5rem] mt-4 shadow-lg">Authenticate</Button>
            <button onClick={() => setView('register')} className="w-full text-center mt-6 text-[10px] font-black uppercase text-[#008080]">Create new account</button>
          </div>
        )}

        {view === 'register' && (
          <div className="p-8 bg-white rounded-[3.5rem] shadow-xl mt-4 border border-gray-100 animate-fade-in">
            <h3 className="text-3xl font-black mb-6 text-center tracking-tighter uppercase">Join the Circle.</h3>
            <Input label="Full Name" value={regData.fullName} onChange={e => setRegData({...regData, fullName: e.target.value})} />
            <Input label="WhatsApp Number" placeholder="080..." value={regData.whatsapp} onChange={e => setRegData({...regData, whatsapp: e.target.value})} />
            <Input label="Institution" options={TERTIARY_INSTITUTIONS} value={regData.university} onChange={e => setRegData({...regData, university: e.target.value})} />
            {regData.university === 'Other (Specify...)' && <Input label="School Name" placeholder="Type school full name" value={regData.customUniversity} onChange={e => setRegData({...regData, customUniversity: e.target.value})} />}
            <Input label="Department" placeholder="e.g. Computer Science" value={regData.department} onChange={e => setRegData({...regData, department: e.target.value})} />
            <Input label="Level" options={['100','200','300','400','500','600','ND 1','ND 2','HND 1','HND 2']} value={regData.level} onChange={e => setRegData({...regData, level: e.target.value})} />
            <Input label="Choose Password" type="password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} />
            <Button onClick={handleRegister} className="w-full py-5 rounded-[2.5rem] mt-4 shadow-lg">Start Journey</Button>
            <button onClick={() => setView('login')} className="w-full text-center mt-6 text-[10px] font-black uppercase text-gray-300">Already have an account? Sign In</button>
          </div>
        )}

        {view === 'home' && (
          <div className="flex flex-col gap-5 pb-10">
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm mb-2">
               <div className="flex gap-4 items-center mb-6">
                  <img src={user?.avatar} className="w-12 h-12 rounded-2xl bg-gray-50 shadow-inner" />
                  <button onClick={() => setShowAddPost(true)} className="flex-1 text-left px-6 py-4 bg-gray-50 rounded-3xl text-gray-400 font-bold text-xs uppercase tracking-widest">Share with your circle...</button>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-teal-50/50 p-4 rounded-3xl text-center">
                     <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest mb-1">Circle Students</p>
                     <p className="text-xl font-black text-[#008080]">{users.length}</p>
                  </div>
                  <div className="bg-orange-50/50 p-4 rounded-3xl text-center">
                     <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest mb-1">Hub Resources</p>
                     <p className="text-xl font-black text-[#FFA500]">{resources.filter(r => r.status === 'approved').length}</p>
                  </div>
               </div>
            </div>
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-gray-50 animate-fade-in">
                <div className="flex items-center gap-4 mb-5">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName}`} className="w-12 h-12 rounded-2xl bg-gray-50" />
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-sm">{post.authorName}</p>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{post.university}</p>
                  </div>
                  <MoreVertical size={18} className="text-gray-300"/>
                </div>
                <p className="text-gray-800 text-sm mb-6 leading-relaxed font-medium">{post.content}</p>
                {post.media && (
                  <div className="rounded-[2rem] overflow-hidden mb-6 shadow-sm border bg-black">
                    {post.media.type === 'image' && <img src={post.media.url} className="w-full h-auto object-cover max-h-[400px]" />}
                    {post.media.type === 'video' && <video controls src={post.media.url} className="w-full" />}
                    {post.media.type === 'audio' && (
                       <div className="p-6 bg-[#008080]/10 flex flex-col items-center gap-3">
                          <Music size={40} className="text-[#008080] mb-2"/>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#008080]">Shared Audio Material</p>
                          <audio controls src={post.media.url} className="w-full h-10" />
                       </div>
                    )}
                  </div>
                )}
                <div className="flex gap-8 border-t border-gray-50 pt-5">
                  <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${post.likes.includes(user?.id || '') ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                    <Heart size={18} fill={post.likes.includes(user?.id || '') ? "currentColor" : "none"}/> {post.likes.length}
                  </button>
                  <button onClick={() => setViewingCommentsPost(post)} className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#008080] transition-colors">
                    <MessageCircle size={18}/> {post.comments.length}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'resources' && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#008080] p-8 rounded-[3rem] text-white relative overflow-hidden shadow-xl mb-4">
              <h3 className="text-2xl font-black mb-1 uppercase tracking-tighter">Library.</h3>
              <p className="text-teal-50/70 text-[10px] mb-6 max-w-[180px]">Access shared notes and archives from across Nigeria.</p>
              <Button onClick={() => setShowAddResource(true)} variant="secondary" className="px-6 py-2 text-xs rounded-xl">Upload Material</Button>
              <BookOpen size={160} className="absolute -right-10 -bottom-10 opacity-10 rotate-12" />
            </div>

            {resources.filter(r => r.status === 'approved').map(res => (
              <div key={res.id} className="bg-white rounded-[2.5rem] p-7 border border-gray-100 shadow-sm animate-fade-in mb-3">
                <p className="text-[8px] font-black text-[#008080] mb-1 uppercase tracking-widest">{res.department} • {res.level}</p>
                <h4 className="font-black text-md mb-2">{res.title}</h4>
                <p className="text-xs text-gray-400 mb-4 line-clamp-2">{res.description}</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 py-3 text-xs" onClick={() => window.open(res.link, '_blank')}>Download</Button>
                  <button onClick={() => getAIInsight(res.title, res.description)} className="p-3 bg-gray-50 text-[#008080] rounded-xl"><BarChart3 size={20}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'social' && (
          <div className="flex flex-col gap-6">
            <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm sticky top-0 z-10">
              {(['discover','circle','messages'] as const).map(t => (
                <button 
                  key={t} 
                  onClick={() => setSocialTab(t)} 
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${socialTab === t ? 'bg-[#008080] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {socialTab === 'discover' && (
              <div className="animate-fade-in">
                <div className="bg-white p-5 rounded-[2.5rem] flex items-center gap-3 border border-gray-100 mb-4 shadow-sm">
                  <Search className="text-[#008080]" size={20}/>
                  <input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search students or schools..." 
                    className="bg-transparent border-none outline-none font-bold text-sm w-full placeholder:text-gray-300" 
                  />
                </div>
                <div className="flex flex-col gap-3">
                  {filteredUsers.map(u => {
                    const isFriend = user?.friends.includes(u.id);
                    const isSent = friendReqs.some(r => r.senderId === user?.id && r.receiverId === u.id && r.status === 'pending');
                    return (
                      <div key={u.id} className="bg-white p-5 rounded-[2.5rem] flex items-center justify-between border border-gray-100 shadow-sm animate-fade-in">
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setViewedUser(u)}>
                          <img src={u.avatar} className="w-12 h-12 rounded-2xl bg-gray-50 object-cover" />
                          <div className="max-w-[150px]">
                            <p className="font-black text-sm truncate">{u.fullName}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate">{u.university}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {isFriend ? (
                            <button onClick={() => { setActiveChat(u); setSocialTab('messages'); }} className="p-3 bg-teal-50 text-[#008080] rounded-2xl"><MessageCircle size={20}/></button>
                          ) : isSent ? (
                            <span className="px-3 py-2 bg-gray-50 text-gray-400 text-[8px] font-black uppercase rounded-xl border border-gray-100">Sent</span>
                          ) : (
                            <button onClick={() => sendFriendRequest(u.id)} className="p-3 bg-[#008080] text-white rounded-2xl"><UserPlus size={20}/></button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {socialTab === 'circle' && (
              <div className="animate-fade-in space-y-3">
                {myFriends.map(u => (
                  <div key={u.id} className="bg-white p-5 rounded-[2.5rem] flex items-center justify-between border border-gray-100 shadow-sm animate-fade-in">
                    <div className="flex items-center gap-4" onClick={() => setViewedUser(u)}>
                      <img src={u.avatar} className="w-12 h-12 rounded-2xl bg-gray-50 object-cover" />
                      <div>
                        <p className="font-black text-sm">{u.fullName}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{u.university}</p>
                      </div>
                    </div>
                    <button onClick={() => { setActiveChat(u); setSocialTab('messages'); }} className="p-3 bg-teal-50 text-[#008080] rounded-2xl"><MessageCircle size={20}/></button>
                  </div>
                ))}
                {myFriends.length === 0 && (
                  <div className="text-center py-20 opacity-20 flex flex-col items-center">
                    <Users size={48} className="mb-4" />
                    <p className="font-black text-[10px] uppercase tracking-widest">No circle connections yet.</p>
                  </div>
                )}
              </div>
            )}

            {socialTab === 'messages' && (
              <div className="animate-fade-in space-y-3">
                {recentChats.map(u => (
                  <div key={u.id} onClick={() => setActiveChat(u)} className="bg-white p-5 rounded-[2.5rem] flex items-center justify-between border border-gray-100 shadow-sm animate-fade-in cursor-pointer hover:bg-teal-50/50">
                    <div className="flex items-center gap-4">
                      <img src={u.avatar} className="w-12 h-12 rounded-2xl bg-gray-50 object-cover" />
                      <div>
                        <p className="font-black text-sm">{u.fullName}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Active Chat</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                  </div>
                ))}
                {recentChats.length === 0 && (
                   <div className="text-center py-20 opacity-20 flex flex-col items-center">
                     <MessageCircle size={48} className="mb-4" />
                     <p className="font-black text-[10px] uppercase tracking-widest">No active messages.</p>
                   </div>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'admin' && (
          <div className="flex flex-col gap-6 pb-24">
            <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
              {(['dashboard','approvals','broadcast','quiz'] as const).map(t => (
                <button key={t} onClick={() => setAdminTab(t)} className={`flex-1 min-w-[90px] py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${adminTab === t ? 'bg-[#008080] text-white shadow-md' : 'text-gray-400'}`}>{t}</button>
              ))}
            </div>

            {adminTab === 'quiz' && (
              <div className="flex flex-col gap-6">
                <div className="bg-white p-10 rounded-[4rem] shadow-xl border border-gray-50">
                   <h4 className="font-black text-xl uppercase tracking-tighter mb-8">Quiz Engine</h4>
                   <Input label="Challenge Name" value={quizForm.title} onChange={e => setQuizForm({...quizForm, title: e.target.value})} />
                   <div className="grid grid-cols-2 gap-4">
                      <Input label="Duration (Mins)" type="number" value={String(quizForm.duration)} onChange={e => setQuizForm({...quizForm, duration: parseInt(e.target.value) || 15})} />
                      <Input label="Start Time" type="datetime-local" value={quizForm.startTime} onChange={e => setQuizForm({...quizForm, startTime: e.target.value})} />
                   </div>
                   <Input label="Expiry Time" type="datetime-local" value={quizForm.expiresAt} onChange={e => setQuizForm({...quizForm, expiresAt: e.target.value})} />
                   
                   <div className="p-6 bg-gray-50 rounded-[2.5rem] border mb-6">
                      <h5 className="font-black text-[10px] uppercase mb-6 tracking-widest text-[#008080]">New Question</h5>
                      <Input placeholder="Enter question..." value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} />
                      <div className="grid grid-cols-1 gap-2 mb-6">
                        {newQuestion.options.map((opt, i) => (
                           <div key={i} className="flex items-center gap-3">
                             <input type="radio" checked={newQuestion.correctIndex === i} onChange={() => setNewQuestion({...newQuestion, correctIndex: i})} className="w-5 h-5 accent-[#008080]"/>
                             <input value={opt} onChange={e => {
                               const n = [...newQuestion.options]; n[i] = e.target.value; setNewQuestion({...newQuestion, options: n});
                             }} placeholder={`Choice ${i+1}`} className="flex-1 p-4 rounded-xl border text-sm font-bold bg-white" />
                           </div>
                        ))}
                      </div>
                      <Button onClick={() => {
                        if(!newQuestion.text) return;
                        setQuizQuestions([...quizQuestions, { ...newQuestion, id: Math.random().toString() }]);
                        setNewQuestion({ text: '', options: ['', '', '', ''], correctIndex: 0 });
                      }} variant="secondary" className="w-full text-xs">Register Question</Button>
                   </div>
                   <Button onClick={saveQuiz} className="w-full py-6 rounded-[2.5rem] shadow-2xl text-lg">Schedule Challenge</Button>
                </div>
              </div>
            )}

            {adminTab === 'dashboard' && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-gray-50 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Students</p>
                    <p className="text-4xl font-black text-[#008080]">{users.length}</p>
                  </div>
                  <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-gray-50 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Pending Items</p>
                    <p className="text-4xl font-black text-[#FFA500]">{resources.filter(r => r.status === 'pending').length + events.filter(e => e.status === 'pending').length}</p>
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[4rem] shadow-xl border border-gray-50">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-teal-50 text-[#008080] rounded-2xl"><Calendar size={24}/></div>
                    <h4 className="font-black text-xl uppercase tracking-tighter">Publish Official Item</h4>
                  </div>
                  <Input label="Title" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} />
                  <Input label="Description" multiline value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} />
                  <Input label="Category" options={['competition', 'event']} value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value as any})} />
                  <Input label="Deadline" value={eventForm.deadline} onChange={e => setEventForm({...eventForm, deadline: e.target.value})} />
                  <Input label="Official Link" value={eventForm.link} onChange={e => setEventForm({...eventForm, link: e.target.value})} />
                  <Button onClick={handleAdminDirectEventSubmit} className="w-full py-6 rounded-[2.5rem] shadow-lg text-lg uppercase">Post Instantly</Button>
                </div>
              </div>
            )}

            {adminTab === 'approvals' && (
               <div className="flex flex-col gap-10">
                  <div className="px-2">
                     <h4 className="font-black text-xl mb-6 uppercase tracking-tighter flex items-center gap-2"><ClipboardList className="text-[#008080]"/> Pending Submissions</h4>
                     
                     <div className="space-y-4 mb-10">
                       <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Resources</h5>
                       {resources.filter(r => r.status === 'pending').map(res => (
                         <div key={res.id} className="bg-white p-7 rounded-[3rem] border shadow-sm animate-fade-in">
                           <h5 className="font-black text-lg mb-2">{res.title}</h5>
                           <p className="text-xs text-gray-400 mb-6">{res.description}</p>
                           <div className="flex gap-3">
                              <Button onClick={() => {
                                const u = {...res, status: 'approved' as const}; db.resources.update(u).then(syncData);
                              }} variant="success" className="flex-1 py-4 text-xs rounded-2xl">Approve</Button>
                              <Button variant="danger" className="px-5 rounded-2xl"><Trash2 size={20}/></Button>
                           </div>
                         </div>
                       ))}
                       {resources.filter(r => r.status === 'pending').length === 0 && <p className="text-center opacity-30 text-[8px] font-black uppercase">None</p>}
                     </div>

                     <div className="space-y-4">
                       <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hub Events</h5>
                       {events.filter(e => e.status === 'pending').map(evt => (
                        <div key={evt.id} className="bg-white p-7 rounded-[3rem] border shadow-sm animate-fade-in">
                           <h5 className="font-black text-lg mb-2">{evt.title}</h5>
                           <div className="flex gap-3">
                              <Button onClick={() => {
                                const u = {...evt, status: 'approved' as const}; db.events.update(u).then(syncData);
                              }} variant="success" className="flex-1 py-4 text-xs rounded-2xl">Approve</Button>
                              <Button variant="danger" className="px-5 rounded-2xl"><Trash2 size={20}/></Button>
                           </div>
                        </div>
                       ))}
                       {events.filter(e => e.status === 'pending').length === 0 && <p className="text-center opacity-30 text-[8px] font-black uppercase">None</p>}
                     </div>
                  </div>
               </div>
            )}
            
            {adminTab === 'broadcast' && (
              <div className="bg-white p-10 rounded-[4rem] shadow-xl animate-fade-in">
                 <h4 className="text-2xl font-black mb-10 flex items-center gap-3 tracking-tighter uppercase"><Megaphone className="text-[#FFA500]" size={28}/> Deploy Global Alert</h4>
                 <Input 
                   label="Alert Subject" 
                   placeholder="e.g. System Maintenance" 
                   id="broadcast-title" 
                   value={broadcastForm.title} 
                   onChange={e => setBroadcastForm({...broadcastForm, title: e.target.value})} 
                 />
                 <Input 
                   label="Public Message" 
                   multiline 
                   placeholder="Enter message for all students..." 
                   id="broadcast-msg" 
                   value={broadcastForm.message} 
                   onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})} 
                 />
                 <Button onClick={sendBroadcast} className="w-full py-6 rounded-[2.5rem] mt-6 text-lg shadow-2xl">Broadcast Everywhere</Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Comment Section Modal */}
      {viewingCommentsPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[700] p-6 flex items-end justify-center">
           <div className="bg-white w-full max-w-[450px] rounded-t-[4rem] rounded-b-[2rem] p-10 animate-slide-up flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-8 shrink-0">
                 <h3 className="text-xl font-black uppercase tracking-tighter">Comments ({viewingCommentsPost.comments.length})</h3>
                 <button onClick={() => setViewingCommentsPost(null)} className="p-2 bg-gray-50 rounded-full text-gray-400"><XCircle size={24}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar mb-8">
                 {viewingCommentsPost.comments.map(c => (
                    <div key={c.id} className="flex gap-4 animate-fade-in">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.authorName}`} className="w-10 h-10 rounded-xl shrink-0" />
                       <div className="flex-1 bg-gray-50 p-5 rounded-[2rem] rounded-tl-none">
                          <p className="font-black text-xs text-[#008080] mb-1">{c.authorName}</p>
                          <p className="text-sm text-gray-700 font-medium leading-relaxed">{c.text}</p>
                       </div>
                    </div>
                 ))}
                 {viewingCommentsPost.comments.length === 0 && (
                    <div className="text-center py-10 opacity-30 flex flex-col items-center">
                       <Smile size={32} className="mb-2" />
                       <p className="text-[10px] font-black uppercase">No comments yet. Start the conversation!</p>
                    </div>
                 )}
              </div>

              <div className="shrink-0 flex gap-2 items-center">
                 <input 
                   value={commentInput} 
                   onChange={e => setCommentInput(e.target.value)} 
                   placeholder="Write a comment..." 
                   className="flex-1 bg-gray-50 p-4 rounded-2xl outline-none font-bold text-sm border focus:ring-2 focus:ring-[#008080]" 
                 />
                 <button onClick={handleComment} className="p-4 bg-[#008080] text-white rounded-2xl active:scale-90 shadow-lg"><Send size={20}/></button>
              </div>
           </div>
        </div>
      )}

      {activeChat && (
        <div className="fixed inset-0 bg-white z-[600] flex flex-col animate-fade-in">
          <header className="p-6 border-b flex items-center gap-4 bg-[#008080] text-white">
             <button onClick={() => setActiveChat(null)} className="p-2"><ChevronLeft /></button>
             <img src={activeChat.avatar} className="w-10 h-10 rounded-xl bg-white/20" />
             <div className="overflow-hidden">
               <p className="font-black text-sm truncate">{activeChat.fullName}</p>
               <p className="text-[8px] font-black uppercase text-teal-100 truncate">{activeChat.university}</p>
             </div>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col no-scrollbar">
             {messages.filter(m => (m.senderId === user?.id && m.receiverId === activeChat.id) || (m.senderId === activeChat.id && m.receiverId === user?.id)).map(m => (
                <div key={m.id} className={`max-w-[80%] p-4 rounded-[1.8rem] font-bold text-sm ${m.senderId === user?.id ? 'bg-[#008080] text-white self-end rounded-tr-none' : 'bg-gray-100 text-gray-800 self-start rounded-tl-none'}`}>
                   {m.text}
                </div>
             ))}
          </div>
          <div className="p-6 border-t flex gap-2 items-center mb-2">
             <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type message..." className="flex-1 bg-gray-50 p-4 rounded-2xl outline-none font-bold text-sm" />
             <button onClick={sendMessage} className="p-4 bg-[#008080] text-white rounded-2xl active:scale-90"><Send size={20}/></button>
          </div>
        </div>
      )}

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-50/50 px-8 py-6 flex justify-between items-center z-50 max-w-[500px] mx-auto shadow-[0_-20px_50px_rgba(0,0,0,0.08)] rounded-t-[3.5rem]">
          <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'home' ? 'text-[#008080] -translate-y-1 scale-110' : 'text-gray-300 hover:text-gray-400'}`}><Home size={24}/></button>
          <button onClick={() => setView('resources')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'resources' ? 'text-[#008080] -translate-y-1 scale-110' : 'text-gray-300 hover:text-gray-400'}`}><BookOpen size={24}/></button>
          <button onClick={() => setView('events')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'events' ? 'text-[#008080] -translate-y-1 scale-110' : 'text-gray-300 hover:text-gray-400'}`}><Trophy size={24}/></button>
          <button onClick={() => setView('social')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'social' ? 'text-[#008080] -translate-y-1 scale-110' : 'text-gray-300 hover:text-gray-400'}`}><Users size={24}/></button>
        </nav>
      )}

      {showAddPost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] p-6 flex items-end justify-center">
          <div className="bg-white w-full rounded-[4rem] p-10 max-w-[450px] animate-slide-up shadow-2xl">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black tracking-tighter uppercase">New Update</h3>
               <button onClick={() => setShowAddPost(false)} className="p-2 bg-gray-50 rounded-full text-gray-300"><XCircle size={24}/></button>
            </div>
            <textarea autoFocus value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="Drop your news into the circle..." className="w-full h-36 p-7 bg-gray-50 rounded-[2.5rem] focus:outline-none resize-none mb-8 font-bold text-lg shadow-inner placeholder:text-gray-300" />
            <div className="grid grid-cols-3 gap-3 mb-10">
               <label className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-3xl border border-gray-100 cursor-pointer transition-colors hover:bg-teal-50 hover:border-teal-100 group">
                  <Camera size={24} className="text-gray-400 group-hover:text-[#008080] transition-colors"/>
                  <span className="text-[8px] font-black uppercase mt-2 text-gray-400 group-hover:text-[#008080]">Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'image')} />
               </label>
               <label className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-3xl border border-gray-100 cursor-pointer transition-colors hover:bg-orange-50 hover:border-orange-100 group">
                  <Video size={24} className="text-gray-400 group-hover:text-orange-500 transition-colors"/>
                  <span className="text-[8px] font-black uppercase mt-2 text-gray-400 group-hover:text-orange-500">Video</span>
                  <input type="file" accept="video/*" className="hidden" onChange={e => handleFileUpload(e, 'video')} />
               </label>
               <label className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-3xl border border-gray-100 cursor-pointer transition-colors hover:bg-blue-50 hover:border-blue-100 group">
                  <Music size={24} className="text-gray-400 group-hover:text-blue-500 transition-colors"/>
                  <span className="text-[8px] font-black uppercase mt-2 text-gray-400 group-hover:text-blue-500">Music</span>
                  <input type="file" accept="audio/*" className="hidden" onChange={e => handleFileUpload(e, 'audio')} />
               </label>
            </div>
            {postMedia && (
               <div className="p-4 bg-[#008080]/10 rounded-2xl mb-8 flex items-center justify-between border border-[#008080]/20">
                  <div className="flex items-center gap-3 overflow-hidden text-[#008080]">
                     {postMedia.type === 'image' && <ImageIcon size={18} className="shrink-0"/>}
                     {postMedia.type === 'video' && <Video size={18} className="shrink-0"/>}
                     {postMedia.type === 'audio' && <Mic size={18} className="shrink-0"/>}
                     <span className="text-[10px] font-black uppercase tracking-widest truncate">{postMedia.name || 'File Attached'}</span>
                  </div>
                  <button onClick={() => setPostMedia(null)} className="text-[#008080] shrink-0"><XCircle size={18}/></button>
               </div>
            )}
            <Button onClick={submitPost} className="w-full py-6 rounded-[2.5rem] text-xl shadow-2xl">Post to Circle</Button>
          </div>
        </div>
      )}

      {activeTakingQuiz && (
        <div className="fixed inset-0 bg-white z-[600] flex flex-col p-8 animate-fade-in">
          <div className="flex justify-between items-center mb-10">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center font-black">
                   <Timer size={24} className={quizTimer < 30 ? 'animate-bounce' : ''}/>
                </div>
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tighter text-gray-900">{activeTakingQuiz.title}</h3> 
                   <p className={`text-[10px] font-black uppercase ${quizTimer < 30 ? 'text-red-500' : 'text-gray-400'}`}>
                      {Math.floor(quizTimer/60)}:{(quizTimer % 60).toString().padStart(2, '0')} Remaining
                   </p>
                </div>
             </div>
             <button onClick={() => { if(confirm("End challenge early?")) handleQuizTimeUp(); }} className="p-3 bg-gray-50 rounded-full text-gray-400"><XCircle size={24}/></button>
          </div>
          {quizResult ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-48 h-48 bg-orange-50 text-orange-500 rounded-full flex flex-col items-center justify-center mb-8 border-[12px] border-white shadow-2xl">
                 <p className="text-[10px] font-black uppercase tracking-[3px] opacity-40 mb-1">Final Score</p>
                 <span className="text-6xl font-black">{quizResult.score}</span>
                 <p className="text-sm font-black mt-1">out of {quizResult.total}</p>
              </div>
              <h4 className="text-4xl font-black mb-4 tracking-tighter uppercase">Completed!</h4>
              <p className="text-gray-400 mb-16 font-medium max-w-[200px]">Result saved. Check your rank across Nigeria.</p>
              <Button onClick={() => setActiveTakingQuiz(null)} className="w-full py-6 rounded-[2.5rem] text-lg shadow-xl uppercase">View Leaderboard</Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between mb-4 items-end">
                 <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Question {currentQuizIndex + 1} of {activeTakingQuiz.questions.length}</span>
                 <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-4 py-1.5 rounded-full">{Math.round(((currentQuizIndex+1)/activeTakingQuiz.questions.length)*100)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full mb-16 overflow-hidden shadow-inner">
                 <div className="h-full bg-orange-500 rounded-full transition-all duration-700 ease-out" style={{width: `${((currentQuizIndex+1)/activeTakingQuiz.questions.length)*100}%`}}></div>
              </div>
              <div className="flex-1">
                 <h4 className="text-3xl font-black text-gray-900 mb-16 leading-tight tracking-tight">{activeTakingQuiz.questions[currentQuizIndex].text}</h4>
                 <div className="flex flex-col gap-4">
                   {activeTakingQuiz.questions[currentQuizIndex].options.map((opt, i) => (
                     <button key={i} onClick={() => submitQuizAnswer(i)} className="w-full p-8 text-left border-2 border-gray-100 rounded-[3rem] font-black text-lg hover:border-orange-500 hover:bg-orange-50/20 active:scale-[0.98] transition-all shadow-sm group">
                       <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400 mr-5 text-[10px] group-hover:bg-orange-500 group-hover:text-white transition-colors">{String.fromCharCode(65 + i)}</span>
                       {opt}
                     </button>
                   ))}
                 </div>
              </div>
            </div>
          )}
        </div>
      )}

      {viewedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[400] p-6 flex items-center justify-center">
          <div className="bg-white w-full rounded-[5rem] p-0 max-w-[450px] shadow-2xl overflow-hidden animate-fade-in border-4 border-white max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="h-40 bg-gradient-to-br from-[#008080] to-[#004D4D] relative">
               <button onClick={() => setViewedUser(null)} className="absolute top-8 right-8 p-3 bg-white/20 rounded-full text-white backdrop-blur-sm"><XCircle size={28}/></button>
               {viewedUser.id === user?.id && !isEditingProfile && (
                 <button onClick={() => setIsEditingProfile(true)} className="absolute bottom-4 right-8 p-3 bg-white text-[#008080] rounded-full shadow-lg"><Edit3 size={20}/></button>
               )}
            </div>
            <div className="px-12 pb-16 -mt-20 text-center">
              <img src={viewedUser.avatar} className="w-40 h-40 rounded-[3.5rem] bg-gray-50 border-[12px] border-white mx-auto shadow-2xl mb-8 object-cover" />
              {isEditingProfile ? (
                <div className="text-left animate-fade-in space-y-4">
                   <Input label="Full Name" value={user?.fullName || ''} onChange={e => setUser(u => u ? {...u, fullName: e.target.value} : null)} />
                   <Input label="Department" value={user?.department || ''} onChange={e => setUser(u => u ? {...u, department: e.target.value} : null)} />
                   <Input label="Level" options={['100','200','300','400','500','600','ND 1','ND 2','HND 1','HND 2']} value={user?.level || ''} onChange={e => setUser(u => u ? {...u, level: e.target.value} : null)} />
                   <div className="flex gap-3 mt-6">
                      <Button onClick={() => updateProfile(user!)} className="flex-1 rounded-[2rem]">Save Changes</Button>
                      <Button onClick={() => setIsEditingProfile(false)} variant="ghost" className="rounded-[2rem]">Cancel</Button>
                   </div>
                </div>
              ) : (
                <>
                  <h3 className="text-4xl font-black mb-2 tracking-tighter">{viewedUser.fullName}</h3>
                  <p className="text-[#008080] font-black text-[10px] uppercase tracking-[4px] mb-12">{viewedUser.university}</p>
                  <div className="grid grid-cols-2 gap-4 mb-12">
                    <div className="bg-gray-50 p-6 rounded-[2.5rem] text-left border border-gray-100 shadow-inner overflow-hidden">
                       <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Focus</p>
                       <p className="font-bold text-sm text-gray-800 truncate">{viewedUser.department}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-[2.5rem] text-left border border-gray-100 shadow-inner overflow-hidden">
                       <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Stage</p>
                       <p className="font-bold text-sm text-gray-800 truncate">{viewedUser.level}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    {viewedUser.id !== user?.id ? (
                      <Button onClick={() => { setActiveChat(viewedUser); setSocialTab('messages'); setViewedUser(null); }} className="flex-1 py-6 rounded-[2.5rem] text-lg shadow-xl"><MessageCircle size={22}/> Direct Message</Button>
                    ) : (
                      <button onClick={() => { setUser(null); setView('landing'); setViewedUser(null); }} className="flex-1 py-6 bg-red-50 text-red-600 rounded-[3rem] font-black uppercase tracking-[3px] text-xs shadow-sm hover:bg-red-100">Sign Out</button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddResource && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[250] p-6 flex items-center justify-center">
          <div className="bg-white w-full rounded-[4.5rem] p-10 max-w-[450px] overflow-y-auto max-h-[90vh] shadow-2xl animate-fade-in no-scrollbar border-4 border-white/20">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black tracking-tighter uppercase">Deploy Material</h3>
                <button onClick={() => setShowAddResource(false)} className="p-3 bg-gray-50 rounded-full text-gray-400"><XCircle size={28}/></button>
             </div>
             <Input label="Title" value={resourceForm.title} onChange={e => setResourceForm({...resourceForm, title: e.target.value})} />
             <Input label="Summary" multiline value={resourceForm.description} onChange={e => setResourceForm({...resourceForm, description: e.target.value})} />
             <Input label="Department" value={resourceForm.department} onChange={e => setResourceForm({...resourceForm, department: e.target.value})} />
             <Input label="Level" options={['100','200','300','400','500','600','ND 1','ND 2','HND 1','HND 2']} value={resourceForm.level} onChange={e => setResourceForm({...resourceForm, level: e.target.value})} />
             <Input label="Download Link" placeholder="https://..." value={resourceForm.link} onChange={e => setResourceForm({...resourceForm, link: e.target.value})} />
             <Button onClick={async () => {
                if(!resourceForm.title || !user) return;
                const r: Resource = { id: Math.random().toString(), userId: user.id, ...resourceForm, status: 'pending', createdAt: Date.now() };
                await db.resources.create(r);
                
                // Admin Notification
                await db.notifications.create({ 
                  id: Math.random().toString(), 
                  title: 'New Library Material', 
                  message: `${user.fullName} uploaded a new resource for ${r.department}. Review required.`, 
                  timestamp: Date.now(), 
                  isRead: false 
                });

                setResources(prev => [r, ...prev]); 
                setShowAddResource(false); 
                alert("Submitted for approval. Admin notified.");
             }} className="w-full py-6 rounded-[2.5rem] shadow-2xl text-lg mt-8 uppercase">Upload to Library</Button>
          </div>
        </div>
      )}

      {showAddEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[250] p-6 flex items-center justify-center">
          <div className="bg-white w-full rounded-[4.5rem] p-10 max-w-[450px] overflow-y-auto max-h-[90vh] shadow-2xl animate-fade-in no-scrollbar border-4 border-white/20">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black tracking-tighter uppercase">Hub Entry</h3>
                <button onClick={() => setShowAddEvent(false)} className="p-3 bg-gray-50 rounded-full text-gray-400"><XCircle size={28}/></button>
             </div>
             <Input label="Event Name" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} />
             <Input label="Description" multiline value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} />
             <Input label="Category" options={['competition', 'event']} value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value as any})} />
             <Input label="Deadline/Date" placeholder="e.g. Dec 1st" value={eventForm.deadline} onChange={e => setEventForm({...eventForm, deadline: e.target.value})} />
             <Input label="Official Link" placeholder="https://..." value={eventForm.link} onChange={e => setEventForm({...eventForm, link: e.target.value})} />
             <Button onClick={async () => {
                if(!eventForm.title || !user) return;
                const e: CompetitionEvent = { id: Math.random().toString(), userId: user.id, ...eventForm, status: 'pending', createdAt: Date.now() };
                await db.events.create(e);
                
                // Admin Notification
                await db.notifications.create({ 
                  id: Math.random().toString(), 
                  title: 'New Hub Suggestion', 
                  message: `${user.fullName} suggested a new ${e.type}: ${e.title}. Review required.`, 
                  timestamp: Date.now(), 
                  isRead: false 
                });

                setEvents(prev => [e, ...prev]); 
                setShowAddEvent(false); 
                alert("Request sent. Admin notified.");
             }} className="w-full py-6 rounded-[2.5rem] shadow-2xl text-lg mt-8 uppercase">Dispatch Suggestion</Button>
          </div>
        </div>
      )}

      {aiInsight && (
         <div className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[700] p-12 flex items-center justify-center">
           <div className="bg-white rounded-[5rem] p-16 max-w-[420px] text-center shadow-2xl animate-slide-up border-4 border-teal-50">
             <div className="w-24 h-24 bg-teal-50 text-[#008080] rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-inner"><BarChart3 size={48} /></div>
             <h3 className="text-3xl font-black mb-8 tracking-tighter uppercase">AI Perspective</h3>
             <div className="text-gray-600 mb-12 italic font-bold leading-relaxed text-left text-lg">
                {aiInsight.split('\n').map((line, i) => <p key={i} className="mb-4">{line}</p>)}
             </div>
             <Button onClick={() => setAiInsight(null)} className="w-full py-7 rounded-[3rem] text-xl shadow-2xl uppercase">Dismiss Insight</Button>
           </div>
         </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.9; } }
        .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-pulse-slow { animation: pulse-slow 3s infinite ease-in-out; }
        ::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .app-container { touch-action: manipulation; overflow-x: hidden; }
      `}</style>
    </div>
  );
}
