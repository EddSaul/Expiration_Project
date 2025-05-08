// layouts.js
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

export function AuthLayout() {
  const { session } = useAuth();
  return session?.user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicLayout() {
  const { session } = useAuth();
  return !session?.user ? <Outlet /> : <Navigate to="/dashboard" replace />;
}