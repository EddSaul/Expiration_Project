import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom' // Changed from <a> to <Link>
import './NavBar.css'

export default function NavBar() { 
  const { session, signOut } = useAuth() // Changed from UserAuth to useAuth
  const navigate = useNavigate()

  console.log("NavBar session check:", session?.user);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  
  return (
    <header className='header'>
        <Link to="/dashboard" className='logo'>Logo</Link> {/* Changed to Link */}
  
        <nav className='navbar'>
            <Link to="/dashboard">Home</Link> {/* Changed to Link */}
            <Link to="/createusers">Users</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/brands">Brands</Link>
            <button onClick={handleSignOut} className="sign-out-btn">
              Sign Out
            </button>
        </nav>
    </header>
  )
}