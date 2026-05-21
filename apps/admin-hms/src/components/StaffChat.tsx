import React, { useState, useEffect, useRef } from 'react';
import { Card, Input } from '@mediportal/ui-core';
import { 
  MessageSquare, Send, X, 
  Circle, Search, Loader2, Phone, Video
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import api from '../api/axios';
import { useAuthStore } from '../store/auth.store';
import { format } from 'date-fns';

const StaffChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      // Connect to socket
      const { accessToken } = useAuthStore.getState();
      socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002', {
        auth: { token: accessToken }
      });

      socketRef.current.emit('register', {
        staffId: user.id, // Assuming staff ID is same or linked
        branchId: 'main-branch', // Mock branch
        role: user.role
      });

      socketRef.current.on('new_message', (msg) => {
        if (selectedStaff && (msg.senderId === selectedStaff.id || msg.receiverId === selectedStaff.id)) {
          setMessages((prev) => [...prev, msg]);
        }
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user, selectedStaff]);

  useEffect(() => {
    if (isOpen) fetchStaff();
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/staff');
      setStaffList(res.data.filter((s: any) => s.userId !== user?.id));
    } catch (err) {
      console.error('Failed to fetch staff', err);
    }
  };

  const selectChat = async (staff: any) => {
    setSelectedStaff(staff);
    setLoading(true);
    try {
      const res = await api.get(`/messaging/history/${staff.id}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedStaff) return;
    try {
      const res = await api.post('/messaging/send', {
        receiverId: selectedStaff.id,
        content: newMessage
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-indigo-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95 group"
        >
          <MessageSquare className="w-7 h-7" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black">2</div>
        </button>
      )}

      {/* Chat Drawer */}
      {isOpen && (
        <Card className="w-96 h-[600px] shadow-2xl border-none rounded-[40px] bg-white overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-indigo-600 p-6 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><MessageSquare className="w-5 h-5" /></div>
              <div>
                <h3 className="font-black text-lg tracking-tight">Staff Connect</h3>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Internal Messaging</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Staff List */}
            {!selectedStaff ? (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-slate-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search staff..." className="pl-10 rounded-xl border-slate-100 bg-slate-50 text-sm" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {staffList.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectChat(s)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all text-left group"
                    >
                      <div className="relative">
                        <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                          {s.user?.name.charAt(0)}
                        </div>
                        <Circle className="absolute -bottom-1 -right-1 w-3.5 h-3.5 fill-emerald-500 stroke-white stroke-2" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{s.user?.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{s.user?.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Active Chat */
              <div className="flex-1 flex flex-col bg-slate-50">
                <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between">
                  <button onClick={() => setSelectedStaff(null)} className="p-2 hover:bg-slate-50 rounded-xl mr-1"><Search className="w-4 h-4 rotate-180" /></button>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-xs font-black">
                      {selectedStaff.user?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{selectedStaff.user?.name}</p>
                      <p className="text-[9px] font-bold text-emerald-500 flex items-center gap-1 uppercase">
                        <Circle className="w-1.5 h-1.5 fill-current" /> Online
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 text-slate-400 hover:text-indigo-600"><Phone className="w-4 h-4" /></button>
                    <button className="p-2 text-slate-400 hover:text-indigo-600"><Video className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading ? (
                    <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.senderId !== selectedStaff.id;
                      return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                            isMe ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/10' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                          }`}>
                            {msg.content}
                            <p className={`text-[9px] mt-1 font-bold ${isMe ? 'text-white/60 text-right' : 'text-slate-400'}`}>
                              {format(new Date(msg.createdAt), 'hh:mm a')}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e: any) => setNewMessage(e.target.value)}
                      onKeyPress={(e: any) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="rounded-xl bg-slate-50 border-none text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StaffChat;
