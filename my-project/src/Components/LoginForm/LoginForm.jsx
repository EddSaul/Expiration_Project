import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginForm.css';
import { FaUser, FaLock } from "react-icons/fa";
import { supabase } from '../../lib/supabaseClient';
import { UserAuth } from '../../context/AuthContext';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { LoginUser } = UserAuth(); 
  
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { session, error } = await LoginUser(email, password); // Use your signIn function

    if (error) {
      setError(error); // Set the error message if sign-in fails

      // Set a timeout to clear the error message after a specific duration (e.g., 3 seconds)
      setTimeout(() => {
        setError("");
      }, 3000); // 3000 milliseconds = 3 seconds
    } else {
      // Redirect or perform any necessary actions after successful sign-in
      navigate("/dashboard");
    }

    if (session) {
      closeModal();
      setError(""); // Reset the error when there's a session
    }
  };
  

  return (
    <div className='wrapper'>
      <form onSubmit={handleSubmit}> 
        <h1>Login</h1>
        {error && <div className="error-message">{error}</div>}
        
        <div className='input-box'>
          <input 
            type="text" 
            placeholder='Email or Username' 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="Email"
            required 
          />
          <FaUser className='icon' />
        </div>
        
        <div className='input-box'>
          <input 
            type="password" 
            placeholder='Password' 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required 
          />
          <FaLock className='icon' />
        </div>
        
        <button type='submit' disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
       
      </form>
    </div>
  );
};

export default LoginForm;