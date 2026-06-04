import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <Link to="/wardrobe" className="text-xl font-semibold text-gray-900 tracking-tight">
        AI Closet Stylist
      </Link>
      <nav className="flex items-center gap-6">
        <Link to="/wardrobe" className="text-sm text-gray-600 hover:text-gray-900">
          Wardrobe
        </Link>
        <Link to="/upload" className="text-sm text-gray-600 hover:text-gray-900">
          Upload
        </Link>
        <Link to="/recommendations" className="text-sm text-gray-600 hover:text-gray-900">
          My Looks
        </Link>
        {user && (
          <span className="text-sm text-gray-400">{user.name}</span>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-700"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
