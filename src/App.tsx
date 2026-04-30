import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Admin from './pages/Admin';
import { useEffect, useState } from 'react';
import { auth, signInWithGoogle } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.warn('Login popup request was cancelled by a previous request.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.info('Login popup closed by user.');
      } else {
        console.error('Login error:', error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6]">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-[#5A5A40] text-xl font-serif"
        >
          載入中...
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#fdfaf6] text-[#1a1a1a] font-sans">
        <nav className="border-b border-[#5A5A40]/10 bg-white/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="text-2xl font-serif font-bold text-[#5A5A40]">
              茶人 • Tea Master
            </Link>
            <div className="flex gap-6 items-center">
              <Link to="/menu" className="text-sm font-medium hover:text-[#5A5A40] transition-colors">
                我要點餐
              </Link>
              <Link to="/admin" className="text-sm font-medium hover:text-[#5A5A40] transition-colors">
                後台管理
              </Link>
              {user ? (
                <div className="flex items-center gap-3">
                  <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-[#5A5A40]/20" alt="avatar" />
                  <button 
                    onClick={() => auth.signOut()}
                    className="text-xs text-gray-500 hover:text-red-500"
                  >
                    登出
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="text-sm bg-[#5A5A40] text-white px-4 py-1.5 rounded-full hover:bg-[#4a4a35] transition-all disabled:opacity-50"
                >
                  {isLoggingIn ? '登入中...' : '管理員登入'}
                </button>
              )}
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto py-8 px-4">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/admin" element={<Admin user={user} />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
}
