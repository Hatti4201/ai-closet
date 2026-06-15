import { Outlet } from 'react-router-dom';

// No auth in MVP backend — render directly
export default function ProtectedRoute() {
  return <Outlet />;
}
