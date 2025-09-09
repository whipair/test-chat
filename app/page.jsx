// pages/index.js
import Link from 'next/link';
import { MessageCircle, Users, Shield, Zap } from 'lucide-react';

export default function Home() {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <MessageCircle className="text-white" size={24} />
                </div>
                <span className="text-xl font-bold text-gray-900">ChatApp</span>
              </div>

              <div className="flex items-center space-x-4">
                <Link
                  href="/chat"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-medium"
                >
                  Start Chat
                </Link>
                <Link
                  href="/company"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors font-medium"
                >
                  Company Login
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Real-time Chat
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                Made Simple
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Connect with your customers instantly. Built with Next.js and
              Supabase for lightning-fast, secure, and scalable communication.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat"
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Try Live Chat
              </Link>
              <Link
                href="/company"
                className="bg-white text-gray-700 px-8 py-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Company Demo
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Zap className="text-blue-500" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Real-time
              </h3>
              <p className="text-gray-600">
                Instant messaging with live updates using Supabase Realtime
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="text-purple-500" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Secure
              </h3>
              <p className="text-gray-600">
                Built-in authentication and Row Level Security for data
                protection
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="text-green-500" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Multi-user
              </h3>
              <p className="text-gray-600">
                Support multiple conversations with role-based access
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <MessageCircle className="text-orange-500" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Modern UI
              </h3>
              <p className="text-gray-600">
                Beautiful, responsive interface built with Tailwind CSS
              </p>
            </div>
          </div>

          {/* Demo Preview */}
          <div className="mt-20 bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6">
              <h2 className="text-2xl font-bold text-white text-center">
                Live Demo
              </h2>
              <p className="text-blue-100 text-center mt-2">
                Experience the chat system in action
              </p>
            </div>

            <div className="p-8 grid md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="text-blue-500" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Customer Chat
                </h3>
                <p className="text-gray-600 mb-4">
                  Sign up as a customer and start a conversation with support
                </p>
                <Link
                  href="/chat"
                  className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Start Chatting
                </Link>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-purple-500" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Support Dashboard
                </h3>
                <p className="text-gray-600 mb-4">
                  Login as company to manage customer conversations
                </p>
                <Link
                  href="/company"
                  className="inline-block bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Access Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="text-white" size={18} />
                </div>
                <span className="font-semibold text-gray-900">ChatApp</span>
              </div>
              <p className="text-gray-500 text-sm">
                Built with Next.js & Supabase
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
