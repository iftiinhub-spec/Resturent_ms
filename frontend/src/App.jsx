import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import POSView from './views/POSView';
import TablesView from './views/TablesView';
import OrdersView from './views/OrdersView';
import MenuInventoryView from './views/MenuInventoryView';
import CategoriesView from './views/CategoriesView';
import UsersView from './views/UsersView';
import ReportsView from './views/ReportsView';

function MainApp() {
  const { user, loading, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('pos'); // Default to POS for rapid cashier workflows
  const [selectedTableForPOS, setSelectedTableForPOS] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
          <span className="font-semibold text-sm">Initializing Offline Restaurant System...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Handle switching table from floor map to POS
  const handleSelectTableForOrder = (table) => {
    setSelectedTableForPOS(table);
    setCurrentView('pos');
  };

  // Render view safely based on role
  const renderView = () => {
    switch (currentView) {
      case 'pos':
        return <POSView initialTable={selectedTableForPOS} />;
      case 'dashboard':
        return <DashboardView setCurrentView={setCurrentView} />;
      case 'tables':
        return (
          <TablesView
            setCurrentView={setCurrentView}
            onSelectTableForOrder={handleSelectTableForOrder}
          />
        );
      case 'orders':
        return <OrdersView />;
      case 'menu':
        return isAdmin ? <MenuInventoryView /> : <DashboardView setCurrentView={setCurrentView} />;
      case 'categories':
        return isAdmin ? <CategoriesView /> : <DashboardView setCurrentView={setCurrentView} />;
      case 'users':
        return isAdmin ? <UsersView /> : <DashboardView setCurrentView={setCurrentView} />;
      case 'reports':
        return isAdmin ? <ReportsView /> : <DashboardView setCurrentView={setCurrentView} />;
      default:
        return <POSView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
