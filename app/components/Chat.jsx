'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase, chatService } from '../lib/supabase';
import { Send, Paperclip, MoreVertical, File, FilesIcon } from 'lucide-react';
import { uploadFile } from '../utils/utils';
import { Image } from 'next/image';
export default function Chat({ conversationId, currentUser, onClose = null }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isAdmin = currentUser?.role === 'admin';
  const otherUser = isAdmin ? conversation?.user : null;

  const loadConversation = async () => {
    try {
      const data = await chatService.getConversationWithMessages(conversationId);
      setConversation(data);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    subscriptionRef.current = chatService.subscribeToMessages(
      conversationId,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        setIsTyping(false);
      }
    );
  };

  useEffect(() => {
    if (conversationId) {
      loadConversation();
      subscribeToMessages();
    }
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [conversationId, loadConversation, subscribeToMessages]);

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
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { signedUrl, message } = await uploadFile(
        file,
        currentUser.id,
        conversationId
      );

      console.log("Messaggio salvato:", message);
      console.log("URL firmato:", signedUrl);
    } catch (err) {
      alert("Errore durante upload: " + err.message);
    }
  }

  const getSignedUrl = async (filePath) => {
    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .createSignedUrl(filePath, 60 * 60); // valido 1h

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    return data.signedUrl;
  };

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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {otherUser?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {isAdmin ? otherUser?.full_name : 'Support'}
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
                  className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
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
                    {message.message_type === "file" ? (
                      <FilePreview filePath={message.file_url} getSignedUrl={getSignedUrl} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    <p
                      className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'
                        }`}
                    >
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
            onClick={() => fileInputRef.current.click()}
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
        <Image
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
        <path d="M14 2H6a2 2 0 ..."></path>
      </svg>
      <span>{fileName}</span>
    </a>
  );
}
