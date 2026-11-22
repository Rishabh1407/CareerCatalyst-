import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black text-slate-900">404 - Page Not Found</h1>
      <p className="text-sm text-slate-500 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
