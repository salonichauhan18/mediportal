import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input, Label } from '@mediportal/ui-core';
import { 
  Users, Globe, Shield,
  Search, UserPlus, Key, Edit3, 
  CheckCircle2, XCircle, Loader2, Database,
  ArrowRight
} from 'lucide-react';
import api from '../api/axios';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'branches' | 'audit'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff'); // Assuming a staff management endpoint exists
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.user?.name.toLowerCase().includes(search.toLowerCase()) || 
    u.user?.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Administration</h1>
          <p className="text-slate-500 font-bold text-sm">Manage users, branches, and security protocols</p>
        </div>
        <div className="flex bg-white/50 p-1.5 rounded-2xl border border-slate-100 w-fit">
          {[
            { id: 'users', label: 'User Mgmt', icon: Users },
            { id: 'branches', label: 'Branches', icon: Globe },
            { id: 'audit', label: 'Audit Log', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="relative w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    value={search}
                    onChange={(e: any) => setSearch(e.target.value)}
                    placeholder="Search staff by name or email..." 
                    className="pl-11 rounded-2xl border-slate-200" 
                  />
                </div>
                <Button className="rounded-2xl bg-indigo-600 text-white px-8 font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700">
                  <UserPlus className="w-4 h-4 mr-2" /> Add New Staff
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                      <th className="pb-4 pl-4">Staff Name</th>
                      <th className="pb-4">Role</th>
                      <th className="pb-4">Department</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                        </td>
                      </tr>
                    ) : filteredUsers.map((user) => (
                      <tr key={user.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="py-5 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">
                              {user.user?.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{user.user?.name}</p>
                              <p className="text-xs font-bold text-slate-400">{user.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5">
                          <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-indigo-50 text-indigo-600">
                            {user.user?.role}
                          </span>
                        </td>
                        <td className="py-5">
                          <p className="text-sm font-bold text-slate-600">{user.department?.name || 'N/A'}</p>
                        </td>
                        <td className="py-5">
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                          </div>
                        </td>
                        <td className="py-5 text-right pr-4">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-indigo-600">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-indigo-600">
                              <Key className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-red-600">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'branches' && (
        <div className="grid grid-cols-2 gap-8">
          <Card className="border-none shadow-sm rounded-[32px] bg-white p-8">
            <h3 className="text-xl font-black text-slate-900 mb-6">Branch Infrastructure</h3>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="p-6 rounded-[24px] border border-slate-100 bg-slate-50 flex items-center justify-between group hover:border-indigo-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800">Main City Branch {i}</h4>
                      <p className="text-xs font-bold text-slate-400">GSTIN: 29AAAAA0000A1Z5</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
              <Button variant="outline" className="w-full rounded-2xl border-dashed border-slate-300 text-slate-500 h-14">
                <Plus className="w-4 h-4 mr-2" /> Register New Branch
              </Button>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-[32px] bg-white p-8">
            <h3 className="text-xl font-black text-slate-900 mb-6">Global System Settings</h3>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Hospital Name</Label>
                <Input value="MediPortal Enterprise ERP" disabled className="rounded-xl bg-slate-50 border-slate-100 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Default Currency</Label>
                  <Input value="INR (₹)" disabled className="rounded-xl bg-slate-50 border-slate-100 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Tax Label</Label>
                  <Input value="GST" disabled className="rounded-xl bg-slate-50 border-slate-100 font-bold" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <Button className="w-full rounded-2xl bg-indigo-600 text-white h-12 font-black shadow-lg shadow-indigo-600/20">
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'audit' && (
        <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Global Audit Log</h3>
                <p className="text-sm font-bold text-slate-400 mt-1">Immutable record of all system-critical operations</p>
              </div>
              <Button variant="outline" className="rounded-2xl border-slate-200 font-bold text-xs">Export CSV</Button>
            </div>
            
            <div className="bg-slate-900 rounded-[32px] p-20 text-center">
              <Database className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h4 className="text-slate-400 font-black text-lg uppercase tracking-widest">Secure Audit Explorer</h4>
              <p className="text-slate-600 font-medium mt-2">Aggregating logs from across all hospital branches...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Plus = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

export default AdminPanel;
