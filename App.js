
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, BookOpen, Trophy, User as UserIcon, Search, MessageCircle, Heart, Bell, 
  CheckCircle2, XCircle, ShieldAlert, GraduationCap, Users, BarChart3, Trash2, 
  ChevronRight, Send, UserPlus, Clock, Camera, ImageIcon, ChevronLeft, Edit3, 
  Megaphone, Video, Music, Mic, MoreVertical, ClipboardList, Timer, Inbox, Smile, Calendar, Zap
} from 'lucide-react';
import { summarizeResource } from './geminiService';
import { db } from './db';

// --- Shared Components ---

const Badge = ({ count, className = "" }) => {
  if (count <= 0) return null;
  return (
    <span className={`absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-black text-white border-2 border-white ${className}`}>
      {count > 9 ? '9+' : count}
    </span>
  );
};

const Button = ({ onClick, children, variant = 'primary', className = '', type = 'button', disabled }) => {
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

const Input = ({ label, placeholder, value, onChange, type = 'text', options, multiline, id }) => (
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
  "Ahmadu Bello University (ABU)", "University of Nigeria, Nsukka (UNN)", "University Benin (UNIBEN)", 
  "University of Ilorin (UNILORIN)", "Federal University, Oye-Ekiti (FUOYE)", "Lagos State University (LASU)", 
  "Covenant University", "Babcock University", "Other (Specify...)"
];

export default function App() {
  const [view, setView] = useState('landing');
  const [socialTab, setSocialTab] = useState('discover');
  const [user, setUser] = useState(null);
  
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [resources, setResources] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [quizScores, setQuizScores] = useState([]);
  const [messages, setMessages] = useState([]);
  const [friendReqs, setFriendReqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [globalAnnouncement, setGlobalAnnouncement] = useState(null);
  const [viewingCommentsPost, setViewingCommentsPost] = useState(null);
  const [commentInput, setCommentInput] = useState('');

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
    } catch (err) { 
      console.error("Sync error:", err); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { syncData(); }, [view]);

  const [loginForm, setLoginForm] = useState({ whatsapp: '', password: '' });
  const [regData, setRegData] = useState({ fullName: '', whatsapp: '', university: '', customUniversity: '', department: '', level: '', password: '' });
  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState(null);
  const [showAddPost, setShowAddPost] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [viewedUser, setViewedUser] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [aiInsight, setAiInsight] = useState(null);
  const [adminTab, setAdminTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [quizForm, setQuizForm] = useState({ title: '', description: '', duration: 15, startTime: '', expiresAt: '' });
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], correctIndex: 0 });
  const [eventForm, setEventForm] = useState({ title: '', description: '', rules: '', deadline: '', link: '', type: 'competition', image: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', description: '', link: '', department: '', level: '' });
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '' });

  const [activeTakingQuiz, setActiveTakingQuiz] = useState(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [quizTimer, setQuizTimer] = useState(0);

  useEffect(() => {
    let timer;
    if (activeTakingQuiz && !quizResult && quizTimer > 0) {
      timer = setInterval(() => {
        setQuizTimer(prev => {
          if (prev <= 1) { handleQuizTimeUp(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeTakingQuiz, quizResult, quizTimer]);

  const handleQuizTimeUp = () => finishQuiz(calculateQuizScore(quizAnswers));
  const calculateQuizScore = (answers) => {
    let score = 0;
    answers.forEach((ans, idx) => { if (ans === activeTakingQuiz.questions[idx].correctIndex) score++; });
    return score;
  };

  const finishQuiz = async (score) => {
    const scoreObj = {
      id: Math.random().toString(), quizId: activeTakingQuiz.id, userId: user.id,
      userName: user.fullName, score, total: activeTakingQuiz.questions.length,
      timestamp: Date.now()
    };
    await db.quizzes.scores.create(scoreObj);
    setQuizScores(prev => [...prev, scoreObj]);
    setQuizResult({ score, total: activeTakingQuiz.questions.length });
  };

  const handleLike = async (postId) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const updatedLikes = post.likes.includes(user.id) 
      ? post.likes.filter(id => id !== user.id) 
      : [...post.likes, user.id];
    const updatedPost = { ...post, likes: updatedLikes };
    setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
    const items = JSON.parse(localStorage.getItem('sl_db_posts') || '[]');
    localStorage.setItem('sl_db_posts', JSON.stringify(items.map((i) => i.id === postId ? updatedPost : i)));
  };

  const handleComment = async () => {
    if (!user || !viewingCommentsPost || !commentInput.trim()) return;
    const newComment = { id: Math.random().toString(), userId: user.id, authorName: user.fullName, text: commentInput, createdAt: Date.now() };
    const updatedPost = { ...viewingCommentsPost, comments: [...viewingCommentsPost.comments, newComment] };
    setPosts(prev => prev.map(p => p.id === viewingCommentsPost.id ? updatedPost : p));
    setViewingCommentsPost(updatedPost);
    setCommentInput('');
    const items = JSON.parse(localStorage.getItem('sl_db_posts') || '[]');
    localStorage.setItem('sl_db_posts', JSON.stringify(items.map((i) => i.id === updatedPost.id ? updatedPost : i)));
  };

  const handleLogin = () => {
    const found = users.find(u => u.whatsapp === loginForm.whatsapp.trim() && u.password === loginForm.password.trim());
    if (found) { setUser(found); setView('home'); } 
    else { alert("Authentication failed."); }
  };

  const handleRegister = async () => {
    const finalInst = regData.university === 'Other (Specify...)' ? regData.customUniversity : regData.university;
    if (!regData.fullName || !finalInst || !regData.whatsapp || !regData.password) return alert("Fill all fields.");
    const newUser = {
      id: Math.random().toString(36).substr(2, 9), ...regData, university: finalInst, role: 'student',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${regData.fullName}`, friends: []
    };
    await db.users.save([...users, newUser]);
    setUsers(prev => [...prev, newUser]); setUser(newUser); setView('home');
  };

  const updateProfile = async (updatedData) => {
    if (!user) return;
    const newUser = { ...user, ...updatedData };
    await db.users.update(newUser);
    setUser(newUser); syncData();
    setIsEditingProfile(false);
  };

  const submitPost = async () => {
    if (!user || !postContent.trim()) return;
    const newPost = {
      id: Math.random().toString(36).substr(2, 9), userId: user.id, authorName: user.fullName,
      university: user.university, content: postContent, media: postMedia || undefined,
      likes: [], comments: [], status: 'approved', createdAt: Date.now()
    };
    await db.posts.create(newPost); setPosts(prev => [newPost, ...prev]); setPostContent(''); setPostMedia(null); setShowAddPost(false);
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPostMedia({ type, url: reader.result, name: file.name });
      reader.readAsDataURL(file);
    }
  };

  const saveQuiz = async () => {
    if (!quizForm.title || quizQuestions.length === 0) return alert("Missing quiz info");
    const q = {
      id: Math.random().toString(),
      title: quizForm.title,
      description: quizForm.description,
      durationMinutes: quizForm.duration,
      questions: quizQuestions,
      createdAt: Date.now(),
      active: true,
      startTime: quizForm.startTime ? new Date(quizForm.startTime).getTime() : undefined,
      expiresAt: quizForm.expiresAt ? new Date(quizForm.expiresAt).getTime() : undefined,
    };
    await db.quizzes.create(q); setQuizzes(prev => [...prev, q]); setQuizQuestions([]); setQuizForm({ title: '', description: '', duration: 15, startTime: '', expiresAt: '' });
    alert("Quiz Published!");
  };

  const sendFriendRequest = async (receiverId) => {
    if (!user) return;
    const req = { id: Math.random().toString(), senderId: user.id, senderName: user.fullName, senderAvatar: user.avatar, receiverId, status: 'pending', timestamp: Date.now() };
    await db.friendRequests.create(req);
    await db.notifications.create({ 
      id: Math.random().toString(), title: 'New Connection Request', 
      message: `${user.fullName} wants to connect with you.`, 
      timestamp: Date.now(), isRead: false, fromUserId: user.id, type: 'friend_request' 
    });
    setFriendReqs(prev => [...prev, req]); alert("Request sent!");
  };

  const acceptFriendRequest = async (req) => {
    if (!user) return;
    const updated = { ...req, status: 'accepted' };
    await db.friendRequests.update(updated);
    const sender = users.find(u => u.id === req.senderId);
    if (sender) {
      const u1 = { ...user, friends: [...user.friends, req.senderId] };
      const u2 = { ...sender, friends: [...sender.friends, user.id] };
      await db.users.update(u1); await db.users.update(u2);
      setUser(u1); syncData();
    }
  };

  const startQuizFlow = (quiz) => {
    if (quizScores.some(s => s.quizId === quiz.id && s.userId === user?.id)) return alert("Already taken.");
    const now = Date.now();
    if (quiz.startTime && now < quiz.startTime) return alert("Not started yet.");
    if (quiz.expiresAt && now > quiz.expiresAt) return alert("Expired.");
    setActiveTakingQuiz(quiz); setCurrentQuizIndex(0); setQuizAnswers([]); setQuizResult(null); setQuizTimer(quiz.durationMinutes * 60);
  };

  const getAIInsight = async (title, description) => {
    setAiInsight("Analyzing resource with Gemini AI...");
    const summary = await summarizeResource(title, description);
    setAiInsight(summary);
  };

  const handleAdminDirectEventSubmit = async () => {
    if(!eventForm.title || !user) return alert("Title required");
    const e = { id: Math.random().toString(), userId: user.id, ...eventForm, status: 'approved', createdAt: Date.now() };
    await db.events.create(e); setEvents(prev => [e, ...prev]);
    setEventForm({ title: '', description: '', rules: '', deadline: '', link: '', type: 'competition', image: '' });
    alert("Published!");
  };

  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;
  const pendingRequests = friendReqs.filter(r => r.receiverId === user?.id && r.status === 'pending');
  const filteredUsers = users.filter(u => u.id !== user?.id && (u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || u.university.toLowerCase().includes(searchQuery.toLowerCase())));
  const myFriends = users.filter(u => user?.friends.includes(u.id));
  const recentChats = useMemo(() => {
    if (!user) return [];
    const chatIds = new Set(messages.filter(m => m.senderId === user.id || m.receiverId === user.id).map(m => m.senderId === user.id ? m.receiverId : m.senderId));
    return users.filter(u => chatIds.has(u.id));
  }, [messages, users, user]);

  if (view === 'landing') {
    return (
      <div className="app-container bg-white flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#008080]/10 to-transparent -z-10"></div>
        <div className="w-24 h-24 bg-[#008080] rounded-[2.5rem] flex items-center justify-center text-white rotate-12 shadow-2xl mb-12"><GraduationCap size={48} /></div>
        <h1 className="text-5xl font-black text-gray-900 leading-tight mb-4 tracking-tighter">Student<br/>Link.</h1>
        <p className="text-gray-400 text-sm mb-16 font-medium max-w-[280px]">Connecting Nigerian Tertiary Students.</p>
        <div className="w-full flex flex-col gap-4">
          <Button onClick={() => setView('register')} className="w-full py-6 rounded-[2rem] text-lg">Join</Button>
          <button onClick={() => setView('login')} className="py-4 text-gray-400 font-black uppercase tracking-[4px] text-[10px]">Sign In</button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="app-container bg-white flex items-center justify-center font-black uppercase text-[10px] tracking-widest text-gray-300">Syncing...</div>;
  }

  return (
    <div className="app-container bg-[#fcfcfc] relative min-h-screen flex flex-col">
      {globalAnnouncement && (
        <div className="bg-[#FFA500] text-white p-4 flex items-center gap-3 relative z-[60] animate-pulse">
           <Megaphone size={20} className="shrink-0"/>
           <div className="flex-1 overflow-hidden">
             <p className="font-black text-[10px] uppercase leading-none mb-1">Notice</p>
             <p className="text-xs font-bold truncate">{globalAnnouncement.message}</p>
           </div>
           <button onClick={() => setGlobalAnnouncement(null)} className="p-1"><XCircle size={16}/></button>
        </div>
      )}

      <header className="px-6 pt-10 pb-4 bg-white flex items-center justify-between sticky top-0 z-50 border-b border-gray-50/50">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase">
            {view === 'home' && 'Feed'} {view === 'resources' && 'Library'} {view === 'events' && 'Hub'}
            {view === 'admin' && 'Admin'} {view === 'social' && 'Social'} {view === 'notifications' && 'Activity'}
          </h2>
          {user && <p className="text-[10px] text-[#008080] font-black uppercase tracking-widest truncate max-w-[150px]">{user.university}</p>}
        </div>
        <div className="flex gap-2">
          {user?.role === 'admin' && view !== 'admin' && <button onClick={() => setView('admin')} className="p-3 bg-red-50 text-red-600 rounded-2xl"><ShieldAlert size={20} /></button>}
          {user && (
            <button onClick={() => setView('notifications')} className="p-3 bg-gray-50 text-gray-400 rounded-2xl relative">
              <Bell size={20} />
              <Badge count={unreadNotifsCount + pendingRequests.length} />
            </button>
          )}
          {user && <button onClick={() => setViewedUser(user)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl"><UserIcon size={20} /></button>}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 mb-24 no-scrollbar">
        {view === 'login' && (
          <div className="p-8 bg-white rounded-[3.5rem] shadow-xl mt-12 border border-gray-100 animate-fade-in">
            <h3 className="text-3xl font-black mb-8 text-center tracking-tighter uppercase">Sign In.</h3>
            <Input label="WhatsApp" value={loginForm.whatsapp} onChange={e => setLoginForm({...loginForm, whatsapp: e.target.value})} />
            <Input label="Key" type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            <Button onClick={handleLogin} className="w-full py-5 rounded-[2.5rem] mt-4 shadow-lg">Login</Button>
          </div>
        )}

        {view === 'register' && (
          <div className="p-8 bg-white rounded-[3.5rem] shadow-xl mt-4 border border-gray-100 animate-fade-in">
            <h3 className="text-3xl font-black mb-6 text-center tracking-tighter uppercase">Sign Up.</h3>
            <Input label="Full Name" value={regData.fullName} onChange={e => setRegData({...regData, fullName: e.target.value})} />
            <Input label="WhatsApp" placeholder="080..." value={regData.whatsapp} onChange={e => setRegData({...regData, whatsapp: e.target.value})} />
            <Input label="Institution" options={TERTIARY_INSTITUTIONS} value={regData.university} onChange={e => setRegData({...regData, university: e.target.value})} />
            <Input label="Department" value={regData.department} onChange={e => setRegData({...regData, department: e.target.value})} />
            <Input label="Level" options={['100','200','300','400','500','600','ND 1','ND 2','HND 1','HND 2']} value={regData.level} onChange={e => setRegData({...regData, level: e.target.value})} />
            <Input label="Password" type="password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} />
            <Button onClick={handleRegister} className="w-full py-5 rounded-[2.5rem] mt-4 shadow-lg">Start</Button>
          </div>
        )}

        {view === 'home' && (
          <div className="flex flex-col gap-5 pb-10">
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm mb-2 flex gap-4 items-center">
                <img src={user?.avatar} className="w-12 h-12 rounded-2xl bg-gray-50 shadow-inner" />
                <button onClick={() => setShowAddPost(true)} className="flex-1 text-left px-6 py-4 bg-gray-50 rounded-3xl text-gray-400 font-bold text-xs uppercase tracking-widest">What's happening?</button>
            </div>
            {posts.length === 0 ? (
               <div className="text-center py-20 opacity-20 uppercase font-black text-[10px]">No posts in the circle yet.</div>
            ) : posts.map(post => (
              <div key={post.id} className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-gray-50 animate-fade-in">
                <div className="flex items-center gap-4 mb-5">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName}`} className="w-12 h-12 rounded-2xl bg-gray-50" />
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-sm">{post.authorName}</p>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{post.university}</p>
                  </div>
                </div>
                <p className="text-gray-800 text-sm mb-6 leading-relaxed font-medium">{post.content}</p>
                {post.media && (
                  <div className="rounded-[2rem] overflow-hidden mb-6 shadow-sm border bg-black">
                    {post.media.type === 'image' && <img src={post.media.url} className="w-full h-auto object-cover max-h-[400px]" />}
                    {post.media.type === 'video' && <video controls src={post.media.url} className="w-full" />}
                  </div>
                )}
                <div className="flex gap-8 border-t border-gray-50 pt-5">
                  <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${post.likes.includes(user?.id || '') ? 'text-red-500' : 'text-gray-400'}`}>
                    <Heart size={18} fill={post.likes.includes(user?.id || '') ? "currentColor" : "none"}/> {post.likes.length}
                  </button>
                  <button onClick={() => setViewingCommentsPost(post)} className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
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
              <h3 className="text-2xl font-black mb-1 uppercase tracking-tighter leading-none">Library.</h3>
              <p className="text-teal-50/70 text-[10px] mb-6 uppercase font-black">Archive Hub</p>
              <Button onClick={() => setShowAddResource(true)} variant="secondary" className="px-6 py-2 text-xs rounded-xl">Add File</Button>
            </div>
            {resources.filter(r => r.status === 'approved').map(res => (
              <div key={res.id} className="bg-white rounded-[2.5rem] p-7 border border-gray-100 shadow-sm animate-fade-in">
                <p className="text-[8px] font-black text-[#008080] mb-1 uppercase tracking-widest">{res.department} • {res.level}</p>
                <h4 className="font-black text-md mb-2">{res.title}</h4>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 py-3 text-xs" onClick={() => window.open(res.link, '_blank')}>Get File</Button>
                  <button onClick={() => getAIInsight(res.title, res.description)} className="p-3 bg-gray-50 text-[#008080] rounded-xl"><BarChart3 size={20}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'notifications' && (
          <div className="flex flex-col gap-6 pb-10">
            {pendingRequests.length > 0 && (
              <div className="animate-fade-in">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-[#008080] mb-4 ml-2">Requests</h4>
                {pendingRequests.map(req => (
                  <div key={req.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-[#008080]/10 shadow-md flex items-center justify-between mb-3 animate-fade-in">
                    <div className="flex items-center gap-4">
                      <img src={req.senderAvatar} className="w-12 h-12 rounded-2xl border" />
                      <div><p className="font-black text-sm">{req.senderName}</p><p className="text-[9px] font-bold text-gray-400 uppercase">Wants to connect</p></div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => acceptFriendRequest(req)} className="p-3 bg-[#008080] text-white rounded-2xl shadow-md"><CheckCircle2 size={20}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-2">History</h4>
              {notifications.map(n => (
                <div key={n.id} className={`p-6 rounded-[2.5rem] border mb-3 animate-fade-in shadow-sm ${n.isGlobal ? 'bg-[#FFA500]/10 border-[#FFA500]/20' : 'bg-white border-gray-100'}`}>
                  <h5 className="font-black text-sm text-gray-900 mb-1">{n.title}</h5>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{n.message}</p>
                </div>
              ))}
              {notifications.length === 0 && pendingRequests.length === 0 && (
                <div className="text-center py-20 opacity-20 uppercase font-black text-[10px]">No alerts.</div>
              )}
            </div>
          </div>
        )}

        {view === 'social' && (
           <div className="flex flex-col gap-6">
            <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm sticky top-0 z-10">
              {(['discover','circle','messages']).map(t => (
                <button key={t} onClick={() => setSocialTab(t)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${socialTab === t ? 'bg-[#008080] text-white shadow-md' : 'text-gray-400'}`}> {t} </button>
              ))}
            </div>
            {socialTab === 'discover' && (
              <div className="animate-fade-in space-y-4">
                <div className="bg-white p-5 rounded-[2.5rem] flex items-center gap-3 border border-gray-100 shadow-sm"><Search className="text-[#008080]" size={20}/><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="bg-transparent border-none outline-none font-bold text-sm w-full" /></div>
                {filteredUsers.map(u => (
                  <div key={u.id} className="bg-white p-5 rounded-[2.5rem] flex items-center justify-between border border-gray-100 animate-fade-in">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => setViewedUser(u)}>
                      <img src={u.avatar} className="w-12 h-12 rounded-2xl bg-gray-50 object-cover" />
                      <div className="max-w-[150px]"><p className="font-black text-sm truncate">{u.fullName}</p><p className="text-[9px] text-gray-400 font-bold uppercase truncate">{u.university}</p></div>
                    </div>
                    {user?.friends.includes(u.id) ? (
                      <button onClick={() => { setActiveChat(u); setSocialTab('messages'); }} className="p-3 bg-teal-50 text-[#008080] rounded-2xl"><MessageCircle size={20}/></button>
                    ) : (
                      <button onClick={() => sendFriendRequest(u.id)} className="p-3 bg-[#008080] text-white rounded-2xl shadow-sm"><UserPlus size={20}/></button>
                    )}
                  </div>
                ))}
              </div>
            )}
           </div>
        )}
      </main>

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-50/50 px-8 py-6 flex justify-between items-center z-50 max-w-[500px] mx-auto shadow-2xl rounded-t-[3.5rem]">
          <button onClick={() => setView('home')} className={`transition-all ${view === 'home' ? 'text-[#008080] scale-110' : 'text-gray-300'}`}><Home size={24}/></button>
          <button onClick={() => setView('resources')} className={`transition-all ${view === 'resources' ? 'text-[#008080] scale-110' : 'text-gray-300'}`}><BookOpen size={24}/></button>
          <button onClick={() => setView('social')} className={`transition-all ${view === 'social' ? 'text-[#008080] scale-110' : 'text-gray-300'}`}><Users size={24}/></button>
          <button onClick={() => setView('notifications')} className={`transition-all ${view === 'notifications' ? 'text-[#008080] scale-110' : 'text-gray-300'}`}><Bell size={24}/></button>
        </nav>
      )}

      {/* Comment Section Modal */}
      {viewingCommentsPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[700] p-6 flex items-end justify-center">
           <div className="bg-white w-full max-w-[450px] rounded-t-[4rem] p-10 flex flex-col max-h-[85vh] animate-slide-up">
              <div className="flex justify-between items-center mb-8 shrink-0">
                 <h3 className="text-xl font-black uppercase tracking-tighter">Comments</h3>
                 <button onClick={() => setViewingCommentsPost(null)}><XCircle size={28} className="text-gray-300"/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar mb-8">
                 {viewingCommentsPost.comments.map(c => (
                    <div key={c.id} className="flex gap-4">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.authorName}`} className="w-10 h-10 rounded-xl" />
                       <div className="flex-1 bg-gray-50 p-5 rounded-[2rem] rounded-tl-none">
                          <p className="font-black text-xs text-[#008080] mb-1">{c.authorName}</p>
                          <p className="text-sm font-medium">{c.text}</p>
                       </div>
                    </div>
                 ))}
                 {viewingCommentsPost.comments.length === 0 && <p className="text-center opacity-30 uppercase font-black text-[10px] mt-10">No comments yet.</p>}
              </div>
              <div className="shrink-0 flex gap-2">
                 <input value={commentInput} onChange={e => setCommentInput(e.target.value)} placeholder="Say something..." className="flex-1 bg-gray-50 p-4 rounded-2xl outline-none font-bold text-sm" />
                 <button onClick={handleComment} className="p-4 bg-[#008080] text-white rounded-2xl"><Send size={20}/></button>
              </div>
           </div>
        </div>
      )}

      {/* Post Modal */}
      {showAddPost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] p-6 flex items-end justify-center">
          <div className="bg-white w-full rounded-[4rem] p-10 max-w-[450px] animate-slide-up shadow-2xl">
            <h3 className="text-2xl font-black mb-8 uppercase tracking-tighter">New Post</h3>
            <textarea autoFocus value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="What's on your mind?" className="w-full h-36 p-7 bg-gray-50 rounded-[2.5rem] focus:outline-none resize-none mb-8 font-bold text-lg shadow-inner placeholder:text-gray-300" />
            <div className="grid grid-cols-2 gap-3 mb-10 text-center">
               <label className="p-4 bg-gray-50 rounded-3xl cursor-pointer"><Camera size={24} className="mx-auto text-gray-400"/><input type="file" className="hidden" onChange={e => handleFileUpload(e, 'image')} /></label>
               <label className="p-4 bg-gray-50 rounded-3xl cursor-pointer"><Video size={24} className="mx-auto text-gray-400"/><input type="file" className="hidden" onChange={e => handleFileUpload(e, 'video')} /></label>
            </div>
            <Button onClick={submitPost} className="w-full py-6 rounded-[2.5rem] text-xl">Post</Button>
            <button onClick={() => setShowAddPost(false)} className="w-full mt-4 text-[10px] font-black text-gray-300 uppercase">Cancel</button>
          </div>
        </div>
      )}

      {aiInsight && (
         <div className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[700] p-12 flex items-center justify-center">
           <div className="bg-white rounded-[5rem] p-16 max-w-[420px] text-center shadow-2xl animate-slide-up border-4 border-teal-50">
             <div className="w-24 h-24 bg-teal-50 text-[#008080] rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-inner"><BarChart3 size={48} /></div>
             <h3 className="text-3xl font-black mb-8 tracking-tighter uppercase">AI Perspective</h3>
             <div className="text-gray-600 mb-12 italic font-bold leading-relaxed text-left text-lg">
                {aiInsight}
             </div>
             <Button onClick={() => setAiInsight(null)} className="w-full py-7 rounded-[3rem] text-xl shadow-2xl uppercase">Dismiss Insight</Button>
           </div>
         </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        ::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .app-container { touch-action: manipulation; overflow-x: hidden; }
      `}</style>
    </div>
  );
}
