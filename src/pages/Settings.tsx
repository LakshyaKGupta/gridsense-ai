import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { User, Lock, Bell, MapPin, Battery, Save, Shield } from 'lucide-react';

export default function Settings() {
  const { token, email, logout } = useAuth();
  const [saved, setSaved] = useState(false);

  if (!token) {
    return <Navigate to="/login" />;
  }

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-200 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <User size={20} className="text-cyan-400" />
              Profile
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={email || ''}
                  disabled
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-300 opacity-60"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Display Name</label>
                <input
                  type="text"
                  defaultValue="GridSense User"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Lock size={20} className="text-cyan-400" />
              Security
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Bell size={20} className="text-cyan-400" />
              Notifications
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-cyan-500" />
                <span className="text-slate-300">Email alerts for zone overloads</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-cyan-500" />
                <span className="text-slate-300">Push notifications for station updates</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-cyan-500" />
                <span className="text-slate-300">Daily demand reports</span>
              </label>
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-cyan-400" />
              Location Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Default City</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none">
                  <option value="bengaluru">Bengaluru, India</option>
                  <option value="delhi">Delhi, India</option>
                  <option value="mumbai">Mumbai, India</option>
                  <option value="hyderabad">Hyderabad, India</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-cyan-500" />
                <span className="text-slate-300">Auto-detect location on login</span>
              </label>
            </div>
          </div>

          {/* Grid Settings Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Battery size={20} className="text-cyan-400" />
              Grid Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Update Frequency</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none">
                  <option value="3">Every 3 seconds</option>
                  <option value="5">Every 5 seconds</option>
                  <option value="10">Every 10 seconds</option>
                  <option value="30">Every 30 seconds</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-cyan-500" />
                <span className="text-slate-300">Show real-time station wait times</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-[#0B0F14] font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Save size={18} />
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Shield size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}