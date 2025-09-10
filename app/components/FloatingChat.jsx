'use client';
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Users, Search, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import Chat from './Chat';
import { useUserStore } from '../stores/userStores';
import { chatService, supabase } from '../lib/supabase';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Company dashboard state
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const currentUser = useUserStore((state) => state.currentUser);
  const isAdmin = currentUser?.role === 'admin';

  // store admin subscriptions cleanup in a ref
  const adminCleanupRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    if (currentUser) {
      getUserRole();
    }
    // cleanup on unmount
    return () => {
      if (adminCleanupRef.current) {
        try { adminCleanupRef.current(); } catch (e) { /* ignore */ }
      }
    };
  }, [currentUser]);

  const getUserRole = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (error) throw error;

      setUserRole(profile?.role || 'user');
    } catch (error) {
      console.error('Error getting user role:', error);
      setUserRole('user');
    }
  };

  const loadConversations = async () => {
    try {
      const data = await chatService.getCompanyConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const openChat = async () => {
    if (!currentUser) return;

    if (userRole === 'admin') {
      // Load conversations for admin
      await loadConversations();

      // Set up real-time subscriptions
      const conversationChannel = supabase
        .channel('conversations')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'conversations' },
          loadConversations
        )
        .subscribe();

      const messageChannel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          loadConversations
        )
        .subscribe();

      // Clean up subscriptions when chat closes
      const cleanup = () => {
        try {
          conversationChannel.unsubscribe();
        } catch (e) { /* ignore */ }
        try {
          messageChannel.unsubscribe();
        } catch (e) { /* ignore */ }
      };

      // Store cleanup function for later use
      adminCleanupRef.current = cleanup;
    } else {
      // Regular user - create or get conversation
      if (!conversationId) {
        const conversation = await chatService.getOrCreateConversation(currentUser.id);
        setConversationId(conversation.id);
      }
    }

    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setSelectedConversation(null);

    // Clean up subscriptions for admin
    if (userRole === 'admin' && adminCleanupRef.current) {
      adminCleanupRef.current();
      adminCleanupRef.current = null;
    }
  };

  const updateConversationStatus = async (conversationId, status) => {
    try {
      await chatService.updateConversationStatus(conversationId, status);
      loadConversations();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={12} />;
      case 'active':
        return <MessageSquare size={12} />;
      case 'closed':
        return <CheckCircle size={12} />;
      default:
        return <MessageSquare size={12} />;
    }
  };

  // Filter conversations for admin
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      !searchTerm ||
      conv.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.latest_message?.content
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || conv.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (!mounted || !currentUser) return null;

  // Enrich currentUser with role before passing down
  const enrichedCurrentUser = { ...currentUser, role: userRole || currentUser.role };

  return (
    <>
      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center"
        >
          {userRole === 'admin' ? <Users size={24} /> : <MessageCircle size={24} />}
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl z-50 border">
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
            <h3 className="font-semibold">
              {userRole === 'admin' ? 'Support Dashboard' : 'Support Chat'}
            </h3>
            <button
              onClick={closeChat}
              className="hover:bg-white hover:bg-opacity-20 p-1 rounded"
            >
              <X size={18} />
            </button>
          </div>

          <div className="h-[calc(600px-64px)]">
            {userRole === 'admin' ? (
              <div className="flex h-full">
                {/* Sidebar - hide when conversation is selected */}
                {!selectedConversation && (
                  <div className="w-full bg-gray-50 flex flex-col">
                    {/* Search & Filter */}
                    <div className="p-3 border-b">
                      <div className="relative mb-3">
                        <Search
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={14}
                        />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-7 pr-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {['all', 'pending', 'active', 'closed'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${filterStatus === status
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Conversation list */}
                    <div className="flex-1 overflow-y-auto">
                      {filteredConversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
                          <p className="text-xs">No conversations</p>
                        </div>
                      ) : (
                        filteredConversations
                          .filter((conv) => conv.user.role !== 'admin')
                          .map((conversation) => (
                            <div
                              key={conversation.id}
                              onClick={() => setSelectedConversation(conversation)}
                              className="p-3 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                                    {isAdmin ? (conversation.user?.full_name?.[0]?.toUpperCase() || 'U') : 'S'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate text-xs">
                                      {isAdmin ? (conversation.user?.full_name || 'Unknown User') : 'Support'}
                                    </h4>
                                    <p className="text-xs text-gray-500 truncate">
                                      {conversation.user?.email}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`inline-flex items-center space-x-1 px-1 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                    conversation.status
                                  )}`}
                                >
                                  {getStatusIcon(conversation.status)}
                                  <span className="text-xs">{conversation.status}</span>
                                </span>
                              </div>

                              {conversation.latest_message && (
                                <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                                  {conversation.latest_message.content}
                                </p>
                              )}

                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{formatTime(conversation.updated_at)}</span>
                                {conversation.status === 'pending' && (
                                  <span className="bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded-full font-medium text-xs">
                                    New
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}

                {/* Chat Area - full width when conversation is selected */}
                {selectedConversation && (
                  <div className="w-full flex flex-col">
                    <Chat
                      conversationId={selectedConversation.id}
                      conversation={selectedConversation}
                      currentUser={enrichedCurrentUser}
                      onClose={closeChat}
                      onBack={() => setSelectedConversation(null)}
                      showBackButton={true}
                    />
                  </div>
                )}

                {/* Empty state when no conversation is selected - only show in split view */}
                {!selectedConversation && filteredConversations.length > 0 && (
                  <div className="hidden">
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <MessageSquare size={32} className="mx-auto mb-2 text-gray-400" />
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          No conversation selected
                        </h4>
                        <p className="text-xs text-gray-500">
                          Choose a conversation to start
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Regular user chat
              conversationId && (
                <Chat
                  conversationId={conversationId}
                  currentUser={enrichedCurrentUser}
                  onClose={closeChat}
                />
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}
