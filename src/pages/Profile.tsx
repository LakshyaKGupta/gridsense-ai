import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { User, MapPin, Zap, Activity, Clock } from 'lucide-react';

export default function Profile() {
  const { token, email } = useAuth();

  if (!token) {
    return <Navigate to="/login" />;
  }

  const userStats = {
    totalSessions: 47,
    totalEnergy: 1250,
    avgSessionDuration: 35,
    preferredZone: 'Indiranagar',
    memberSince: 'January 2024',
    co2Saved: 312
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-200 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Info Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">GridSense User</h2>
                <p className="text-slate-400 text-sm">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock size={14} />
              <span>Member since {userStats.memberSince}</span>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={20} className="text-cyan-400" />
              <h2 className="text-xl font-semibold text-white">Impact Stats</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400">{userStats.totalSessions}</p>
                <p className="text-xs text-slate-500">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{userStats.totalEnergy}</p>
                <p className="text-xs text-slate-500">kWh Used</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{userStats.co2Saved}</p>
                <p className="text-xs text-slate-500">kg CO₂ Saved</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{userStats.avgSessionDuration}</p>
                <p className="text-xs text-slate-500">Min Avg</p>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={20} className="text-cyan-400" />
              <h2 className="text-xl font-semibold text-white">Preferences</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Preferred Zone</span>
                <span className="text-white font-medium">{userStats.preferredZone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Default Map View</span>
                <span className="text-white font-medium">Bengaluru</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={20} className="text-cyan-400" />
              <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
            </div>
            <div className="space-y-2">
              <Link
                to="/dashboard"
                className="block w-full text-center bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 py-2 rounded-lg transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/settings"
                className="block w-full text-center bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}