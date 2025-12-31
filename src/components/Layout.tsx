import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Calendar,
  TrendingUp,
  Clock,
  Settings,
  Lock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const { lock } = useAuth();
  const navigate = useNavigate();

  const handleLock = () => {
    lock();
    navigate('/');
  };

  const navItems = [
    { to: '/', icon: Calendar, label: 'Calendar' },
    { to: '/insights', icon: TrendingUp, label: 'Insights' },
    { to: '/history', icon: Clock, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">J</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Juno</span>
            </div>

            <button
              onClick={handleLock}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="Lock app"
            >
              <Lock className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content with sidebar offset on desktop */}
      <div className="flex-1 flex">
        {/* Sidebar navigation (desktop) */}
        <aside className="hidden sm:flex flex-col fixed left-0 top-14 bottom-0 w-56 bg-white border-r border-gray-200">
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-rose-50 text-rose-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t">
            <button
              onClick={handleLock}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
            >
              <Lock className="w-5 h-5" />
              Lock App
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 sm:ml-56">
          <div className="max-w-3xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom navigation (mobile) */}
      <nav className="sm:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-4 text-xs font-medium transition ${
                  isActive
                    ? 'text-rose-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <item.icon className="w-6 h-6 mb-0.5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
