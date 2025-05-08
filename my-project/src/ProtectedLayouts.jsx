import { Navigate, Outlet } from 'react-router-dom';
import NavBar from './Components/NavBar/NavBar';
import { useAuth } from './context/AuthContext';

function ProtectedLayout() {
  const { session } = useAuth();

  if (!session?.user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <NavBar />
      <div className="content">
        <Outlet />
      </div>
    </>
  );
}

export default ProtectedLayout;
