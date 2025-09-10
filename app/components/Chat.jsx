'use client';
import { ArrowLeft, File, FilesIcon, MoreVertical, Paperclip, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { chatService, supabase } from '../lib/supabase';
import { getSignedUrl, uploadFile } from '../utils/uploadFileClient';

export default function Chat({
  conversationId,
  conversation: initialConversation,
  currentUser,
  onClose = null,
  onBack,
  showBackButton = false,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(initialConversation || null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Prefer role provided on currentUser (FloatingChat should pass profile.role)
  const isAdmin = currentUser?.role === 'admin';

  // Robust resolver for the "other user"
  const getOtherUser = (conv) => {
    if (!conv) return null;

    if (conv.user && conv.user.id !== currentUser?.id) return conv.user;

    if (Array.isArray(conv.participants)) {
      const p = conv.participants.find((x) => x.id !== currentUser?.id);
      if (p) return p;
    }

    if (conv.latest_message?.sender && conv.latest_message.sender.id !== currentUser?.id) {
      return conv.latest_message.sender;
    }

    const lastNonMe = (conv.messages || []).slice().reverse().find(m => m.sender_id !== currentUser?.id && m.sender);
    if (lastNonMe) return lastNonMe.sender;

    return null;
  };

  const otherUser = isAdmin ? getOtherUser(conversation) : null;

  // helper: set messages but dedupe by id
  const setMessagesDeduped = (next) => {
    setMessages((prev) => {
      const map = new Map();
      [...prev, ...next].forEach(m => { if (m && m.id != null) map.set(String(m.id), m); });
      const arr = Array.from(map.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return arr;
    });
  };

  useEffect(() => {
    if (!conversationId) return;

    let mounted = true;
    let subscription = null;

    const loadConversation = async () => {
      try {
        // if parent passed conversation AND it already contains messages -> use it
        const hasMessages = Array.isArray(initialConversation?.messages) && initialConversation.messages.length > 0;
        if (initialConversation && initialConversation.id === conversationId && hasMessages) {
          setConversation(initialConversation);
          setMessages(initialConversation.messages || []);
          setLoading(false);
          return;
        }

        // otherwise fetch the full conversation with messages
        const data = await chatService.getConversationWithMessages(conversationId);
        if (!mounted) return;
        setConversation(data);
        setMessages(data.messages || []);
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const subscribe = () => {
      try {
        subscription = chatService.subscribeToMessages(conversationId, (newRow) => {
          // ensure we have a normalized message object
          if (!newRow) return;
          // sometimes payload has .new vs full row; normalize if needed
          const message = newRow.new ? newRow.new : newRow;
          // append deduped
          setMessagesDeduped([message]);
          setIsTyping(false);
        });
        subscriptionRef.current = subscription;
      } catch (err) {
        console.error('subscribe error', err);
      }
    };

    loadConversation();
    subscribe();

    return () => {
      mounted = false;
      if (subscription && typeof subscription.unsubscribe === 'function') {
        try { subscription.unsubscribe(); } catch (e) { /* ignore */ }
      }
      subscriptionRef.current = null;
    };
    // intentionally only depend on conversationId so changing initialConversation doesn't cancel subscribes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsTyping(true);

    try {
      await chatService.sendMessage(conversationId, currentUser.id, messageContent);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      setNewMessage(messageContent); // restore on error
    }
  };

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // optional: show a subtle UI indicator if you want
      // call the client helper which uploads to e2 and inserts the DB row
      const { signedUrl, message } = await uploadFile(file, currentUser.id, conversationId);

      // optimistically add the new message to the UI (deduped)
      if (message) {
        setMessagesDeduped([message]);
        // Scroll down after inserting
        setTimeout(() => scrollToBottom(), 50);
      }

      console.log('Messaggio salvato:', message);
      console.log('URL firmato:', signedUrl);

      // reset file input so user can re-upload same file if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Errore durante upload:', err);
      alert('Errore durante upload: ' + (err?.message || err));
      // reset input on error too so user can retry
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }


  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isNewDay = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    return (
      new Date(currentMsg.created_at).toDateString() !==
      new Date(prevMsg.created_at).toDateString()
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with integrated back button */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-3">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Back to conversations"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {isAdmin ? (otherUser?.full_name?.[0]?.toUpperCase() || 'U') : 'S'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {isAdmin
                ? (otherUser?.full_name || 'Unknown User')
                : 'Support'}
            </h3>
            <p className="text-sm text-gray-500">
              {conversation?.status === 'active' ? 'Active' : 'Pending'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-200 rounded-full">
            <MoreVertical size={18} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full text-gray-500"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.sender_id === currentUser?.id;
          const showDate = isNewDay(message, messages[index - 1]);

          return (
            <div key={message.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                    {formatDate(message.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {message.sender?.full_name?.[0]?.toUpperCase() || 'C'}
                    </div>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl ${isOwn
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}
                  >
                    {message.message_type === 'file' ? (
                      <FilePreview filePath={message.file_url} getSignedUrl={getSignedUrl} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    <p
                      className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t bg-gray-50">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-500"
          >
            <Paperclip size={20} />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-full text-white transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

/* componente helper per gestire link firmato */
function FilePreview({ filePath, getSignedUrl }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (filePath) {
      getSignedUrl(filePath).then((signed) => {
        if (mounted) setUrl(signed);
      });
    }
    return () => { mounted = false; };
  }, [filePath, getSignedUrl]);

  if (!filePath) return <span className="text-red-500">Invalid file</span>;
  if (!url) return <span className="text-gray-400">Loading...</span>;

  const fileName = filePath.split('/').pop();
  const ext = fileName.split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const isPDF = ext === 'pdf';

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={fileName}
          className="max-w-[200px] max-h-[200px] rounded-lg border shadow-sm hover:opacity-90 transition"
        />
      </a>
    );
  }

  if (isPDF) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-2 border rounded-lg shadow-sm hover:shadow-md transition-all bg-white max-w-[300px]"
      >
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-red-100 rounded-full">
          <FilesIcon size={20} className="text-red-600" />
        </div>
        <span className="text-gray-800 font-medium truncate">{fileName}</span>
        <span className="ml-auto text-xs text-gray-500">PDF</span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center space-x-2 text-blue-600 hover:underline"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <File size={20} />
      </svg>
      <span>{fileName}</span>
    </a>
  );
}