import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { AlertCircle, Pill, Calendar, X } from 'lucide-react';

const NotificationHub: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      const { accessToken } = useAuthStore.getState();
      const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002', {
        auth: { token: accessToken }
      });

      socket.emit('register', {
        staffId: user.id,
        branchId: 'main-branch',
        role: user.role
      });

      socket.on('notification', (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
          setNotifications((prev) => prev.filter(n => n.id !== notif.id));
        }, 10000);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-8 right-8 z-[200] space-y-3 w-80">
      {notifications.map((n) => (
        <div 
          key={n.id} 
          className="bg-white rounded-[24px] shadow-2xl border border-slate-100 p-4 flex items-start gap-4 animate-in slide-in-from-right-10 duration-500 overflow-hidden group"
        >
          <div className={`p-2 rounded-xl ${
            n.type === 'CRITICAL_LAB' ? 'bg-red-50 text-red-600' :
            n.type === 'LOW_STOCK' ? 'bg-amber-50 text-amber-600' :
            'bg-indigo-50 text-indigo-600'
          }`}>
            {n.type === 'CRITICAL_LAB' ? <AlertCircle className="w-5 h-5" /> :
             n.type === 'LOW_STOCK' ? <Pill className="w-5 h-5" /> :
             <Calendar className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-slate-900 truncate">{n.title}</h4>
            <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5">{n.content}</p>
          </div>
          <button 
            onClick={() => removeNotification(n.id)}
            className="p-1 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-0 left-0 h-1 bg-indigo-600 animate-out fade-out slide-out-to-left-full duration-[10000ms] w-full" />
        </div>
      ))}
    </div>
  );
};

export default NotificationHub;
