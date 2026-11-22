import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Briefcase, Building2, User } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const { profile } = useAuth();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard Overview';
      case '/preparation':
        return 'AI Interview Preparation';
      case '/script-learning':
        return 'Script Mastery & Practice';
      case '/history':
        return 'Preparation Sets History';
      case '/profile':
        return 'Candidate Profile & Preferences';
      case '/onboarding':
        return 'Profile Setup & Onboarding';
      default:
        return 'CareerCatalyst Platform';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">
          {getPageTitle(location.pathname)}
        </h1>
        {profile?.target_role && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
            <Briefcase className="w-3 h-3 text-blue-500" />
            {profile.target_role}
            {profile?.target_company && (
              <>
                <span className="text-blue-300">•</span>
                <Building2 className="w-3 h-3 text-blue-500" />
                {profile.target_company}
              </>
            )}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {location.pathname !== '/preparation' && (
          <Link
            to="/preparation"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            New Prep
          </Link>
        )}
        <Link
          to="/profile"
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-600 hover:text-blue-600 flex items-center justify-center transition"
          title="View Profile"
        >
          <User className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
