import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function PanelLayout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      <Header />
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
