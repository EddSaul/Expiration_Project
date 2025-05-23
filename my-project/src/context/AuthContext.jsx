import { createContext, useEffect, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => { 
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Create User
    const createUser = async (email, password) => {
        setLoading(true);
        setError(null);
    
        try {
            const { data, error: supabaseError } = await supabase.auth.signUp({
                email: email.toLowerCase(),
                password: password,
            });
    
            if (supabaseError) {
                console.error('Supabase error:', supabaseError);
                throw supabaseError;
            }
    
            console.log('User created:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Signup failed:', error);
            setError(error.message);
            return { success: false, error };
        } finally {
            setLoading(false);
        }
    };

    // Sign in
    const LoginUser = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase(),
                password: password,
            });

            if (supabaseError) {
                throw supabaseError;
            }

            return { success: true, data };
        } catch (error) {
            setError(error.message);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    // Sign out
    const signOut = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error: supabaseError } = await supabase.auth.signOut();
            if (supabaseError) {
                throw supabaseError;
            }
            setSession(null);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch session
    const fetchSession = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription?.unsubscribe();
    }, [fetchSession]);

    return (
        <AuthContext.Provider value={{ 
            LoginUser, 
            createUser,
            signOut,  
            session,
            loading,
            error,
            setError
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthContextProvider');
    }
    return context;
};

export const UserAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthContextProvider');
    }
    return context;
};