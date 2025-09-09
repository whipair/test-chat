"use client"
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { MessageCircle } from "lucide-react";

// Auth component
export default function AuthComponent() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [authLoading, setAuthLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setAuthLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;
                alert('Check your email for verification link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                window.location.reload();
                if (error) throw error;
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {isSignUp
                            ? 'Start chatting with our support team'
                            : 'Sign in to continue chatting'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
                    >
                        {authLoading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                        {isSignUp
                            ? 'Already have an account? Sign In'
                            : 'Need an account? Sign Up'}
                    </button>
                </div>
            </div>
        </div>
    );
};