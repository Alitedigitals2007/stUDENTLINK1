
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, BookOpen, Trophy, User as UserIcon, Search, MessageCircle, Heart, Bell, 
  CheckCircle2, XCircle, ShieldAlert, GraduationCap, Users, BarChart3, Trash2, 
  ChevronRight, Send, UserPlus, Clock, Camera, ImageIcon, ChevronLeft, Edit3, 
  Megaphone, Video, Music, Mic, MoreVertical, ClipboardList, Timer, Inbox, Smile, Calendar, Zap
} from 'lucide-react';
import { summarizeResource } from './geminiService';
import { db } from './db';

// --- Components ---

// Added BadgeProps to fix implicit any and prop typing
interface BadgeProps {
  count: number;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ count, className = "" }) => {
  if (count <= 0) return null;
  return (
    <span className={`absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-black text-white border-2 border-white ${className}`}>
      {count > 9 ? '9+' : count}
    </span>
  );
};

// Added ButtonProps to fix 'type' assignability error on line 34
interface ButtonProps {
  onClick?: (e?: React.MouseEvent) => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ onClick, children, variant = 'primary', className = '', type = 'button', disabled = false }) => {
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
      // Fixed: Constraint the type to specific string literals allowed by HTML button element
      type={type}
      disabled={disabled}
      onClick={onClick} 
      className={`px-4 py-3 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 ${styles[variant]} ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {children}
    </button>
  );
};

// Added InputProps and made options optional to fix 'Property options is missing' errors on lines 237, 238, 246, 247, 249, 251
interface InputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  type?: string;
  options?: string[];
  multiline?: boolean;
  id?: string;
}

const Input: React.FC<InputProps> = ({ label, placeholder = '', value, onChange, type = 'text', options, multiline = false, id = '' }) => (
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
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [friendReqs, setFriendReqs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [globalAnnouncement, setGlobalAnnouncement] = useState<any>(null);
  const [viewingCommentsPost, setViewingCommentsPost] = useState<any>(null);
  const [commentInput, setCommentInput] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState<any>(null);
  const [showAddPost, setShowAddPost] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const syncData = async () => {
    try {
      const [u, p, r, n, fr] = await Promise.all([
        db.users.getAll(),
        db.posts.getAll(),
        db.resources.getAll(),
        db.notifications.getAll(),
        db.friendRequests.getAll()
      ]);
      setUsers(u); setPosts(p); setResources(r); setNotifications(n); setFriendReqs(fr);
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
    const updatedUsers = [...users, newUser];
    await db.users.save(updatedUsers);
    setUsers(updatedUsers); setUser(newUser); setView('home');
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

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return;
    const req = { id: Math.random().toString(), senderId: user.id, senderName: user.fullName, senderAvatar: user.avatar, receiverId, status: 'pending', timestamp: Date.now() };
    await db.friendRequests.create(req);
    await db.notifications.create({ 
      id: Math.random().toString(), title: 'New Request', 
      message: `${user.fullName} wants to connect with you.`, 
      timestamp: Date.now(), isRead: false, fromUserId: user.id, type: 'friend_request' 
    });
    setFriendReqs(prev => [...prev, req]); alert("Request sent!");
  };

  const acceptFriendRequest = async (req: any) => {
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

  const getAIInsight = async (title: string, description: string) => {
    setAiInsight("Analyzing resource with Gemini AI...");
    const summary = await summarizeResource(title, description);
    setAiInsight(summary);
  };

  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;
  const pendingRequests = friendReqs.filter(r => r.receiverId === user?.id && r.status === 'pending');
  const filteredUsers = users.filter(u => u.id !== user?.id && (u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || u.university.toLowerCase().includes(searchQuery.toLowerCase())));

  if (view === 'landing') {
    return (
      <div className="app-container bg-white flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#008080]/10 to-transparent -z-10"></div>
        <div className="w-24 h-24 bg-[#008080] rounded-[2.5rem] flex items-center justify-center text-white rotate-12 shadow-2xl mb-12"><GraduationCap size={48} /></div>
        <h1 className="text-5xl font-black text-gray-900 leading-tight mb-4 tracking-tighter">Student<br/>Link.</h1>
        <p className="text-gray-400 text-sm mb-16 font-medium max-w-[280px]">Connecting Nigerian Students.</p>
        <div className="w-full flex flex-col gap-4">
          <Button onClick={() => setView('register')} className="w-full py-6 rounded-[2rem] text-lg">Join the Circle</Button>
          <button onClick={() => setView('login')} className="py-4 text-gray-400 font-black uppercase tracking-[4px] text-[10px]">Portal Login</button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="app-container bg-white flex items-center justify-center font-black uppercase text-[10px] tracking-widest text-gray-300">Synchronizing...</div>;
  }

  return (
    <div className="app-container bg-[#fcfcfc] relative min-h-screen flex flex-col">
      <header className="px-6 pt-10 pb-4 bg-white flex items-center justify-between sticky top-0 z-50 border-b border-gray-50/50">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase">
            {view === 'home' && 'Feed'} {view === 'resources' && 'Library'} {view === 'social' && 'Social'} {view === 'notifications' && 'Activity'}
          </h2>
          {user && <p className="text-[10px] text-[#008080] font-black uppercase tracking-widest truncate max-w-[150px]">{user.university}</p>}
        </div>
        <div className="flex gap-2">
          {user && (
            <button onClick={() => setView('notifications')} className="p-3 bg-gray-50 text-gray-400 rounded-2xl relative">
              <Bell size={20} />
              <Badge count={unreadNotifsCount + pendingRequests.length} />
            </button>
          )}
          {user && <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl"><UserIcon size={20} /></button>}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 mb-24 no-scrollbar overflow-y-auto">
        {view === 'login' && (
          <div className="p-8 bg-white rounded-[3.5rem] shadow-xl mt-12 border border-gray-100 animate-fade-in">
            <h3 className="text-3xl font-black mb-8 text-center tracking-tighter uppercase">Sign In.</h3>
            {/* Fixed: Input component now uses explicit props including optional options */}
            <Input label="WhatsApp Line" value={loginForm.whatsapp} onChange={e => setLoginForm({...loginForm, whatsapp: e.target.value})} />
            <Input label="Secret Key" type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            <Button onClick={handleLogin} className="w-full py-5 rounded-[2.5rem] mt-4 shadow-lg">Authenticate</Button>
          </div>
        )}

        {view === 'register' && (
          <div className="p-8 bg-white rounded-[3.5rem] shadow-xl mt-4 border border-gray-100 animate-fade-in">
            <h3 className="text-3xl font-black mb-6 text-center tracking-tighter uppercase">New Member.</h3>
            {/* Fixed: Multiple usages of Input component now pass correctly typed props */}
            <Input label="Full Name" value={regData.fullName} onChange={e => setRegData({...regData, fullName: e.target.value})} />
            <Input label="WhatsApp" value={regData.whatsapp} onChange={e => setRegData({...regData, whatsapp: e.target.value})} />
            <Input label="Institution" options={TERTIARY_INSTITUTIONS} value={regData.university} onChange={e => setRegData({...regData, university: e.target.value})} />
            <Input label="Department" value={regData.department} onChange={e => setRegData({...regData, department: e.target.value})} />
            <Input label="Level" options={['100','200','300','400','500','600']} value={regData.level} onChange={e => setRegData({...regData, level: e.target.value})} />
            <Input label="Password" type="password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} />
            <Button onClick={handleRegister} className="w-full py-5 rounded-[2.5rem] mt-4 shadow-lg">Create Account</Button>
          </div>
        )}

        {view === 'home' && (
          <div className="flex flex-col gap-5 pb-10">
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm mb-2 flex gap-4 items-center">
                <img src={user?.avatar} className="w-12 h-12 rounded-2xl bg-gray-50 shadow-inner" />
                <button onClick={() => setShowAddPost(true)} className="flex-1 text-left px-6 py-4 bg-gray-50 rounded-3xl text-gray-400 font-bold text-xs uppercase tracking-widest">Share with circle...</button>
            </div>
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-gray-50 animate-fade-in">
                <div className="flex items-center gap-4 mb-5">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName}`} className="w-12 h-12 rounded-2xl bg-gray-50" />
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-sm">{post.authorName}</p>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{post.university}</p>
                  </div>
                </div>
                <p className="text-gray-800 text-sm mb-6 leading-relaxed font-medium">{post.content}</p>
                <div className="flex gap-8 border-t border-gray-50 pt-5">
                  <button className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400"><Heart size={18}/> {post.likes.length}</button>
                  <button className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest"><MessageCircle size={18}/> {post.comments.length}</button>
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
              <Button onClick={() => setShowAddResource(true)} variant="secondary" className="px-6 py-2 text-xs rounded-xl">Add Document</Button>
            </div>
            {resources.filter(r => r.status === 'approved').map(res => (
              <div key={res.id} className="bg-white rounded-[2.5rem] p-7 border border-gray-100 shadow-sm animate-fade-in">
                <p className="text-[8px] font-black text-[#008080] mb-1 uppercase tracking-widest">{res.department} • {res.level}</p>
                <h4 className="font-black text-md mb-2">{res.title}</h4>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 py-3 text-xs" onClick={() => window.open(res.link, '_blank')}>View File</Button>
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
                <h4 className="text-[11px] font-black uppercase tracking-widest text-[#008080] mb-4 ml-2">Pending Requests</h4>
                {pendingRequests.map(req => (
                  <div key={req.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-[#008080]/10 shadow-md flex items-center justify-between mb-3 animate-fade-in">
                    <div className="flex items-center gap-4">
                      <img src={req.senderAvatar} className="w-12 h-12 rounded-2xl border" />
                      <div><p className="font-black text-sm">{req.senderName}</p><p className="text-[9px] font-bold text-gray-400 uppercase">Wants to connect</p></div>
                    </div>
                    <button onClick={() => acceptFriendRequest(req)} className="p-3 bg-[#008080] text-white rounded-2xl shadow-md"><CheckCircle2 size={20}/></button>
                  </div>
                ))}
              </div>
            )}
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-2">Activity History</h4>
              {notifications.map(n => (
                <div key={n.id} className={`p-6 rounded-[2.5rem] border mb-3 animate-fade-in shadow-sm bg-white border-gray-100`}>
                  <h5 className="font-black text-sm text-gray-900 mb-1">{n.title}</h5>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'social' && (
           <div className="flex flex-col gap-6">
            <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm sticky top-0 z-10">
              {(['discover','circle']).map(t => (
                <button key={t} onClick={() => setSocialTab(t)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${socialTab === t ? 'bg-[#008080] text-white shadow-md' : 'text-gray-400'}`}> {t} </button>
              ))}
            </div>
            {socialTab === 'discover' && (
              <div className="animate-fade-in space-y-4">
                <div className="bg-white p-5 rounded-[2.5rem] flex items-center gap-3 border border-gray-100 shadow-sm"><Search className="text-[#008080]" size={20}/><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search circle..." className="bg-transparent border-none outline-none font-bold text-sm w-full" /></div>
                {filteredUsers.map(u => (
                  <div key={u.id} className="bg-white p-5 rounded-[2.5rem] flex items-center justify-between border border-gray-100 animate-fade-in">
                    <div className="flex items-center gap-4 cursor-pointer">
                      <img src={u.avatar} className="w-12 h-12 rounded-2xl bg-gray-50 object-cover" />
                      <div className="max-w-[150px]"><p className="font-black text-sm truncate">{u.fullName}</p><p className="text-[9px] text-gray-400 font-bold uppercase truncate">{u.university}</p></div>
                    </div>
                    {!user?.friends.includes(u.id) && (
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

      {showAddPost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] p-6 flex items-end justify-center">
          <div className="bg-white w-full rounded-[4rem] p-10 max-w-[450px] animate-slide-up shadow-2xl">
            <h3 className="text-2xl font-black mb-8 uppercase tracking-tighter">Share Update</h3>
            <textarea autoFocus value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="Drop your news..." className="w-full h-36 p-7 bg-gray-50 rounded-[2.5rem] focus:outline-none resize-none mb-8 font-bold text-lg shadow-inner placeholder:text-gray-300" />
            <Button onClick={submitPost} className="w-full py-6 rounded-[2.5rem] text-xl">Post to Circle</Button>
            <button onClick={() => setShowAddPost(false)} className="w-full mt-4 text-[10px] font-black text-gray-300 uppercase">Cancel</button>
          </div>
        </div>
      )}

      {aiInsight && (
         <div className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[700] p-12 flex items-center justify-center">
           <div className="bg-white rounded-[5rem] p-16 max-w-[420px] text-center shadow-2xl animate-fade-in border-4 border-teal-50">
             <div className="w-24 h-24 bg-teal-50 text-[#008080] rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-inner"><BarChart3 size={48} /></div>
             <h3 className="text-3xl font-black mb-8 tracking-tighter uppercase">AI Perspective</h3>
             <div className="text-gray-600 mb-12 italic font-bold leading-relaxed text-left text-lg">
                {aiInsight}
             </div>
             <Button onClick={() => setAiInsight(null)} className="w-full py-7 rounded-[3rem] text-xl shadow-2xl uppercase">Close</Button>
           </div>
         </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
