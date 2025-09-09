// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Chat-specific functions
export const chatService = {
  // Get or create conversation between user and company
  async getOrCreateConversation(userId, companyUserId = null) {
    // First try to find existing conversation
    let { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no conversation exists, create one
    if (!conversation) {
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert([
          {
            user_id: userId,
            company_user_id: companyUserId,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (createError) throw createError;
      conversation = newConversation;
    }

    return conversation;
  },

  // Get conversation with messages
  async getConversationWithMessages(conversationId) {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
      *,
      user:profiles!conversations_user_id_fkey (
        id,
        full_name,
        avatar_url,
        role
      ),
      messages (
        *,
        sender:profiles!messages_sender_id_fkey (
          id,
          full_name,
          avatar_url,
          role
        )
      )
    `)
      .eq('id', conversationId)
      .single();

    if (error) throw error;

    if (data.messages) {
      data.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    return data;
  },


  // Send a message
  async sendMessage(
    conversationId,
    senderId,
    content,
    messageType = 'text',
    fileUrl = null
  ) {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType,
          file_url: fileUrl,
        },
      ])
      .select(
        `
        *,
        sender:profiles!messages_sender_id_fkey (
          id,
          full_name,
          avatar_url,
          role
        )
      `
      )
      .single();

    if (error) throw error;
    return data;
  },

  // Get all conversations for company dashboard
  async getCompanyConversations() {
    const { data, error } = await supabase
      .from('conversations')
      .select(
        `
        *,
        user:profiles!conversations_user_id_fkey (
          id,
          full_name,
          avatar_url,
          email,
          role
        ),
        messages (
          content,
          created_at
        )
      `
      )
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Get latest message for each conversation
    return data.map((conv) => ({
      ...conv,
      latest_message: conv.messages?.[conv.messages.length - 1] || null,
      messages: undefined, // Remove messages array to keep response clean
    }));
  },

  // Subscribe to new messages in a conversation
  subscribeToMessages(conversationId, callback) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the message with sender info
          const { data: messageWithSender } = await supabase
            .from('messages')
            .select(
              `
              *,
              sender:profiles!messages_sender_id_fkey (
                id,
                full_name,
                avatar_url,
                role
              )
            `
            )
            .eq('id', payload.new.id)
            .single();

          callback(messageWithSender);
        }
      )
      .subscribe();
  },

  // Update conversation status
  async updateConversationStatus(conversationId, status) {
    const { data, error } = await supabase
      .from('conversations')
      .update({ status })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
