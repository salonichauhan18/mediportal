import { useState } from 'react';
import { useAuthStore } from './store/auth.store';
import LoginPage from './pages/Login';
import PatientRegistrationPage from './pages/PatientRegistration';
import SchedulingPage from './pages/Scheduling';
import PatientChartPage from './pages/PatientChart';
import LabPortalPage from './pages/LabPortal';
import BillingPortal from './pages/BillingPortal';
import PharmacyPortal from './pages/PharmacyPortal';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import AdminPanel from './pages/AdminPanel';
import ConsultationPage from './pages/ConsultationPage';
import Interoperability from './pages/Interoperability';
import LanguageSwitcher from './components/LanguageSwitcher';
import { LocaleProvider } from './components/LocaleProvider';
import StaffChat from './components/StaffChat';
import NotificationHub from './components/NotificationHub';
import BedManagement from './pages/BedManagement';
import ClaimsDashboard from './pages/ClaimsDashboard';
import { LayoutDashboard, Calendar, UserPlus, LogOut, HeartPulse, FileText, FlaskConical, Receipt, Pill, Settings, MessageSquare, Network, BedDouble, ShieldAlert } from 'lucide-react';

function App() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'scheduling' | 'registration' | 'dashboard' | 'chart' | 'lab' | 'billing' | 'pharmacy' | 'admin' | 'consultation' | 'interoperability' | 'beds' | 'claims'>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const viewPatientChart = (id: string) => {
    setSelectedPatientId(id);
    setActiveTab('chart');
  };

  if (!isAuthenticated) {
    return (
      <LocaleProvider>
        <LoginPage />
      </LocaleProvider>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'scheduling', label: 'Appointments', icon: Calendar },
    { id: 'registration', label: 'Patients', icon: UserPlus },
    { id: 'chart', label: 'EHR Chart', icon: FileText },
    { id: 'consultation', label: 'Consultation', icon: MessageSquare },
    { id: 'lab', label: 'Lab Portal', icon: FlaskConical },
    { id: 'interoperability', label: 'Interoperability', icon: Network },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'claims', label: 'Insurance RPA', icon: ShieldAlert },
    { id: 'pharmacy', label: 'Pharmacy', icon: Pill },
    { id: 'beds', label: 'Bed Management', icon: BedDouble },
    ...(user?.role === 'SUPER_ADMIN' ? [{ id: 'admin', label: 'System Admin', icon: Settings }] : []),
  ];

  return (
    <LocaleProvider>
      <div className="min-h-screen bg-[#F8FAFC] flex overflow-hidden h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col shadow-sm z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <HeartPulse className="text-white w-6 h-6" />
          </div>
          <span className="font-black text-xl tracking-tighter text-gray-900">MEDI<span className="text-primary">PORTAL</span></span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-primary/10 text-primary shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center border-2 border-primary/20">
              <span className="text-xs font-bold text-primary">{user?.name?.charAt(0)}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
              <p className="text-[10px] font-medium text-gray-400 truncate uppercase">{user?.role}</p>
            </div>
          </div>
          <div className="mb-4">
            <LanguageSwitcher />
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {activeTab === 'registration' && <PatientRegistrationPage onViewChart={viewPatientChart} />}
          {activeTab === 'scheduling' && (
            <SchedulingPage 
              onStartConsultation={(appId: string) => {
                setSelectedAppointmentId(appId);
                setActiveTab('consultation');
              }} 
            />
          )}
          {activeTab === 'chart' && <PatientChartPage id={selectedPatientId} />}
          {activeTab === 'consultation' && (
            <ConsultationPage 
              appointmentId={selectedAppointmentId} 
              onEnd={() => {
                setSelectedAppointmentId(null);
                setActiveTab('dashboard');
              }} 
            />
          )}
            {activeTab === 'lab' && <LabPortalPage />}
            {activeTab === 'interoperability' && <Interoperability />}
            {activeTab === 'billing' && <BillingPortal />}
            {activeTab === 'claims' && <ClaimsDashboard />}
          {activeTab === 'pharmacy' && <PharmacyPortal />}
          {activeTab === 'beds' && <BedManagement />}
          {activeTab === 'dashboard' && <ExecutiveDashboard />}
          {activeTab === 'admin' && <AdminPanel />}
        </div>
      </main>

      {/* Real-time Components */}
      <NotificationHub />
      <StaffChat />
    </div>
    </LocaleProvider>
  );
}

export default App;
