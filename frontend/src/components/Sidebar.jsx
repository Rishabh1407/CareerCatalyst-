import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Mic,
  Sparkles,
  BookOpen,
  BarChart3,
  History,
  User,
  LogOut,
  Lock,
  ChevronRight,
  GraduationCap,
  Video,
  Users
} from 'lucide-react';

const Sidebar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Mock Interview', path: '/interview/new', icon: Mic, badge: 'Live' },
    { name: 'AI Preparation', path: '/preparation', icon: Sparkles },
    { name: 'Script Learning', path: '/script-learning', icon: BookOpen },
    { name: 'Performance Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Interview History', path: '/interview/history', icon: History },
    { name: 'Prep Sets History', path: '/history', icon: BookOpen },
    { name: 'My Profile', path: '/profile', icon: User },
  ];

  const upcomingItems = [
    { name: 'Multi-Persona Panel', icon: Users },
    { name: 'Video & Gaze Tracker', icon: Video },
  ];

  const completion = profile?.completion_percentage || 0;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-tight">CareerCatalyst</span>
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">AI Mock & Coaching</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-5 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Core Platform</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && !isActive && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded">
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-4 h-4 text-blue-500 shrink-0" />}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Future Roadmap Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Future Roadmap</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">Phase 3</span>
          </div>
          <div className="space-y-1">
            {upcomingItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-400 text-xs bg-slate-50/50 cursor-not-allowed group border border-dashed border-slate-200/60"
                  title="Coming in future release"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.name}</span>
                  </div>
                  <Lock className="w-3 h-3 text-slate-400" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Profile Completion Box */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>Profile Completion</span>
            <span className="text-blue-600 font-bold">{completion}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
          <NavLink
            to="/profile"
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            {completion < 100 ? 'Complete profile for tailored AI prep →' : 'Edit profile & targets →'}
          </NavLink>
        </div>
      </div>

      {/* User Footer / Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/40">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-2">
            <p className="text-xs font-bold text-slate-900 truncate">{profile?.full_name || 'Career Candidate'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
