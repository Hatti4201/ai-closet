import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`text-sm transition-colors ${
        pathname === to || pathname.startsWith(to + '/')
          ? 'text-gray-900 font-medium'
          : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
      <Link to="/home" className="text-xl font-semibold text-gray-900 tracking-tight">
        AI Closet
      </Link>
      <nav className="flex items-center gap-6">
        {navLink('/home', 'Style')}
        {navLink('/wardrobe', 'Wardrobe')}
        {navLink('/upload', 'Upload')}
        {navLink('/recommendations', 'My Looks')}
        {user && <span className="text-sm text-gray-300">|</span>}
        {user && <span className="text-sm text-gray-400">{user.name}</span>}
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
          Logout
        </button>
      </nav>
    </header>
  );
}
