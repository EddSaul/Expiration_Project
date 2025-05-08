import {Navigate, Outlet } from 'react-router-dom'
import NavBar from './Components/NavBar/NavBar';
import './App.css'
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import {useAuth } from './context/AuthContext';

function App() {
  return (
    <div className="content">
      <Outlet />
    </div>
  );
}

function ProtectedLayout() {
  const { session } = useAuth();
  console.log("ProtectedLayout session check:", session?.user);

  if (!session?.user) {
    console.log("No user session, redirecting to login");
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

export default App