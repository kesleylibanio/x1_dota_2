
import React, { useEffect, useState } from 'react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: { role: UserRole; id?: string };
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout }) => {
  const [embers, setEmbers] = useState<{ id: number; left: string; delay: string; size: string }[]>([]);

  useEffect(() => {
    const newEmbers = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      size: `${Math.random() * 4 + 2}px`,
    }));
    setEmbers(newEmbers);
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col font-sans">
      {/* Animated Embers Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {embers.map(e => (
          <div 
            key={e.id}
            className="ember"
            style={{
              left: e.left,
              bottom: '-20px',
              width: e.size,
              height: e.size,
              animation: `drift ${5 + Math.random() * 5}s linear infinite`,
              animationDelay: e.delay,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-red-900/10 to-transparent pointer-events-none" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-black/80 border-b border-red-900/50 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-fire-flame-curved text-red-600 text-2xl animate-pulse"></i>
            <h1 className="text-xl font-bold tracking-tighter fiery-text">DOTA 2 X1 PRO</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {currentUser.role && (
              <>
                <span className="text-xs uppercase tracking-widest text-slate-400 font-bold border-l border-slate-800 pl-4 ml-4 hidden sm:inline">
                  {currentUser.role === 'admin' ? 'SYSTEM OVERSEER' : `PLAYER: ${currentUser.id}`}
                </span>
                <button 
                  onClick={onLogout}
                  className="px-3 py-1 text-xs border border-red-600/30 hover:bg-red-600 hover:text-white transition rounded uppercase font-bold"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      <footer className="relative z-10 p-6 text-center text-slate-600 text-xs border-t border-slate-900">
        &copy; {new Date().getFullYear()} Dota 2 X1 Pro Management • Inspired by The International
      </footer>
    </div>
  );
};

export default Layout;
