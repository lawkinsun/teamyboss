
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { Message } from "@/api/entities";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  MessageSquare,
  Users,
  Search,
  ArrowLeft,
  Plus,
  UserPlus,
  Settings,
  Paperclip,
  Edit3,
  Check,
  X,
  FileText,
  Video
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday, differenceInHours } from 'date-fns';
import CreatePollDialog from '../components/messages/CreatePollDialog';
import PollMessage from '../components/messages/PollMessage';
import EditGroupDialog from '../components/messages/EditGroupDialog';

const formatTimestamp = (date) => {
  if (!date) return '';
  try {
    // Handle both ISO strings and date objects
    let d;
    if (typeof date === 'string') {
      // If it's an ISO string with Z (UTC), parse it normally
      // If it's a date string without timezone info, treat it as local time
      if (date.includes('T') && (date.endsWith('Z') || date.includes('+'))) {
        d = new Date(date); // This is a proper ISO string with timezone
      } else {
        // This might be a date string without timezone info
        // Parse it as local time to avoid timezone shifts
        d = new Date(date + (date.includes('T') ? '' : 'T00:00:00'));
      }
    } else {
      d = new Date(date);
    }

    // Handle invalid dates
    if (isNaN(d.getTime())) {
      return '';
    }

    // Use local time for display
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (messageDate.getTime() === today.getTime()) {
      // Today - show time only
      return format(d, 'h:mm a');
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return format(d, 'MMM d');
    }
  } catch (error) {
    console.error("Error formatting date:", error);
    return ''; // Return empty string if formatting fails
  }
};

const MessageAttachment = ({ message }) => {
  if (!message.attachment_url) return null;

  const isImage = message.attachment_type?.startsWith('image/');
  const isVideo = message.attachment_type?.startsWith('video/');
  const isPDF = message.attachment_type === 'application/pdf';

  return (
    <div className="mt-2 p-2 bg-slate-100 rounded-lg">
      {isImage && (
        <img
          src={message.attachment_url}
          alt={message.attachment_name}
          className="max-w-xs max-h-48 rounded cursor-pointer"
          onClick={() => window.open(message.attachment_url, '_blank')}
        />
      )}
      {isVideo && (
        <video
          src={message.attachment_url}
          className="max-w-xs max-h-48 rounded"
          controls
        />
      )}
      {!isImage && !isVideo && (
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          <a
            href={message.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            {message.attachment_name || 'Download file'}
          </a>
          {message.attachment_size && (
            <span className="text-xs text-slate-500">
              ({(message.attachment_size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default function Messages() {
  const { currentUser, isAdmin } = useAuth();
  const [allTeamMembers, setAllTeamMembers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [showEditGroupDialog, setShowEditGroupDialog] = useState(false);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // New states for message editing and file upload
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [messageSearchTerm, setMessageSearchTerm] = useState("");
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const fileInputRef = useRef(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const lastCheckTimeRef = useRef(0);
  const errorCountRef = useRef(0);

  const loadMessages = useCallback(async () => {
    try {
      const allMessages = await Message.list('-created_date', 500);
      const userMessages = allMessages.filter(
        (m) =>
          m.sender_email === currentUser.email ||
          m.recipient_email === currentUser.email ||
          (m.type === 'group' && m.group_members?.includes(currentUser.email))
      );
      setMessages(userMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [currentUser, setMessages]);

  const loadConversations = useCallback(async (allUsers) => {
    try {
      const allMessages = await Message.list('-created_date', 500);
      const userMessages = allMessages.filter(
        (m) =>
          m.sender_email === currentUser.email ||
          m.recipient_email === currentUser.email ||
          (m.type === 'group' && m.group_members?.includes(currentUser.email))
      );

      const approvedUsers = allUsers.filter(
        (u) => u.approved && u.email !== currentUser.email
      );

      const uniqueGroups = new Map();
      userMessages.forEach((msg) => {
        if (msg.type === 'group' && msg.group_name && msg.group_members?.includes(currentUser.email)) {
          const creationMessage = userMessages.find(
            (m) => m.group_name === msg.group_name && m.content.includes('created the group')
          );

          if (!creationMessage?.is_archived) {
            if (!uniqueGroups.has(msg.group_name)) {
              const latestMessageForGroup = userMessages
                .filter((m) => m.group_name === msg.group_name && m.group_members && m.group_members.length > 0)
                .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

              uniqueGroups.set(msg.group_name, {
                id: `group_${msg.group_name}`,
                name: msg.group_name,
                isGroup: true,
                members: latestMessageForGroup ? latestMessageForGroup.group_members : [],
                latestTimestamp: latestMessageForGroup ? latestMessageForGroup.created_date : '1970-01-01T00:00:00Z',
              });
            }
          }
        }
      });
      
      const directConversations = approvedUsers.map(user => {
        const latestMessage = userMessages.filter(m => !m.group_name && (
          (m.sender_email === currentUser.email && m.recipient_email === user.email) || 
          (m.sender_email === user.email && m.recipient_email === currentUser.email)
        ))
        .sort((a,b) => new Date(b.created_date) - new Date(a.created_date))[0];
        return {
          ...user,
          latestTimestamp: latestMessage ? latestMessage.created_date : '1970-01-01T00:00:00Z',
        };
      });

      let conversationsForSidebar = [...Array.from(uniqueGroups.values()), ...directConversations];
      
      // Add unread count to each conversation
      conversationsForSidebar = conversationsForSidebar.map(convo => {
          let unreadCount = 0;
          if (convo.isGroup) {
              unreadCount = userMessages.filter(m => m.group_name === convo.name && !m.is_read && m.sender_email !== currentUser.email).length;
          } else {
              unreadCount = userMessages.filter(m => m.recipient_email === currentUser.email && m.sender_email === convo.email && !m.is_read).length;
          }
          return { ...convo, unreadCount };
      });
      
      // Sort conversations by latest message timestamp
      conversationsForSidebar.sort((a, b) => new Date(b.latestTimestamp) - new Date(a.latestTimestamp));
      
      setTeamMembers(conversationsForSidebar);

    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [currentUser, setTeamMembers]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allUsers] = await Promise.all([
        User.list()
      ]);

      setAllTeamMembers(allUsers);
      await loadMessages();
      await loadConversations(allUsers);
    } catch (error) {
      console.error('Error loading messages data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setAllTeamMembers, loadMessages, loadConversations]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  // Optimized real-time message checking with rate limit protection
  useEffect(() => {
    const checkForNewMessages = async () => {
      try {
        // Skip if we've checked recently (prevent duplicate calls)
        const now = Date.now();
        if (now - lastCheckTimeRef.current < 8000) { // Minimum 8 seconds between checks
          return;
        }
        lastCheckTimeRef.current = now;

        const allMessages = await Message.list('-created_date', 50); // Reduced from 500 to 50
        const currentMessageCount = allMessages.length;
        
        if (lastMessageCount > 0 && currentMessageCount > lastMessageCount) {
          // New messages arrived, refresh the data
          loadData();
          
          // Mark new messages as read if they're for current user
          const newMessages = allMessages.slice(0, currentMessageCount - lastMessageCount);
          const myNewMessages = newMessages.filter(m => 
            (m.recipient_email === currentUser?.email || 
             (m.type === 'group' && m.group_members?.includes(currentUser?.email))) &&
            m.sender_email !== currentUser?.email &&
            !m.is_read
          );
          
          // Auto-mark as read when viewing Messages page
          for (const message of myNewMessages) {
            await Message.update(message.id, { is_read: true });
          }
        }
        
        setLastMessageCount(currentMessageCount);
        errorCountRef.current = 0; // Reset error count on success
      } catch (error) {
        console.error('Error checking for new messages:', error);
        errorCountRef.current++;
        
        // If we hit rate limits, slow down even more
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          errorCountRef.current += 2; // Penalize rate limit errors more
        }
      }
    };

    // Dynamic interval based on error count (exponential backoff)
    const getInterval = () => {
      const baseInterval = 12000; // Start with 12 seconds (slower than notifications)
      const maxInterval = 60000; // Max 1 minute
      const errorMultiplier = Math.min(errorCountRef.current, 5); // Cap at 5x
      return Math.min(baseInterval * Math.pow(1.5, errorMultiplier), maxInterval);
    };

    let timeoutId;
    
    const scheduleNextCheck = () => {
      const interval = getInterval();
      timeoutId = setTimeout(() => {
        checkForNewMessages().finally(() => {
          scheduleNextCheck(); // Schedule next check after current one completes
        });
      }, interval);
    };

    // Initial check
    checkForNewMessages().finally(() => {
      scheduleNextCheck();
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentUser, lastMessageCount, loadData]);

  // Only scroll to bottom when we should (after sending message or switching conversation)
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldScrollToBottom(false);
    }
  }, [messages, shouldScrollToBottom]);

  const handleSelectConversation = async (member) => {
    setSelectedConversation(member);
    setShowMobileChat(true);
    setMessageSearchTerm("");
    setShouldScrollToBottom(true);

    // Mark messages in this conversation as read
    const chatMessages = messages.filter(m => {
        if (member.isGroup) {
            return m.group_name === member.name;
        }
        return (m.sender_email === currentUser.email && m.recipient_email === member.email) ||
               (m.sender_email === member.email && m.recipient_email === currentUser.email);
    });

    const unreadMessages = chatMessages.filter(m => !m.is_read && m.sender_email !== currentUser.email);

    if (unreadMessages.length > 0) {
      // Optimistically update the UI for a snappy feel
      const updatedMessages = messages.map(m => {
          if (unreadMessages.some(um => um.id === m.id)) {
              return { ...m, is_read: true };
          }
          return m;
      });
      setMessages(updatedMessages);

      // Update the backend in the background
      try {
        await Promise.all(
          unreadMessages.map(m => Message.update(m.id, { is_read: true }))
        );
        // After marking as read, re-load conversations to update unread counts in sidebar
        loadConversations(allTeamMembers);
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
        // If it fails, the next data load will correct the state.
      }
    }
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedConversation(null);
    setMessageSearchTerm("");
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedConversation) return;

    setUploadingFile(true);
    try {
      const { file_url } = await UploadFile({ file });

      const messageData = {
        sender_name: currentUser.full_name,
        sender_email: currentUser.email,
        content: `📎 ${file.name}`,
        type: selectedConversation.isGroup ? 'group' : 'direct',
        attachment_url: file_url,
        attachment_name: file.name,
        attachment_type: file.type,
        attachment_size: file.size
      };

      if (selectedConversation.isGroup) {
        messageData.group_name = selectedConversation.name;
        messageData.group_members = selectedConversation.members;
      } else {
        messageData.recipient_email = selectedConversation.email;
      }

      await Message.create(messageData);
      await loadMessages();
      await loadConversations(allTeamMembers); // Reload conversations to get latest message timestamp
      setShouldScrollToBottom(true); // Scroll after sending
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    try {
      const messageData = {
        sender_name: currentUser.full_name,
        sender_email: currentUser.email,
        content: newMessage,
        type: selectedConversation.isGroup ? 'group' : 'direct'
      };

      if (selectedConversation.isGroup) {
        messageData.group_name = selectedConversation.name;
        messageData.group_members = selectedConversation.members;
      } else {
        messageData.recipient_email = selectedConversation.email;
      }

      await Message.create(messageData);
      setNewMessage("");
      await loadMessages();
      await loadConversations(allTeamMembers); // Reload conversations to get latest message timestamp
      setShouldScrollToBottom(true); // Scroll after sending
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleEditMessage = async (messageId) => {
    if (!editingContent.trim()) return;

    try {
      await Message.update(messageId, {
        content: editingContent,
        original_content: messages.find(m => m.id === messageId)?.content,
        edited_at: new Date().toISOString()
      });

      setEditingMessageId(null);
      setEditingContent("");
      await loadMessages();
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const startEditing = (message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const canEditMessage = (message) => {
    if (message.sender_email !== currentUser.email) return false;
    const hoursSinceSent = differenceInHours(new Date(), new Date(message.created_date));
    return hoursSinceSent < 1;
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedGroupMembers.length === 0) {
      alert("Please enter a group name and select at least one member.");
      return;
    }

    try {
      const groupData = {
        sender_name: currentUser.full_name,
        sender_email: currentUser.email,
        content: `${currentUser.full_name} created the group "${groupName}"`,
        type: 'group',
        group_name: groupName,
        group_members: [currentUser.email, ...selectedGroupMembers]
      };

      await Message.create(groupData);

      const newGroup = {
        id: `group_${groupName}`,
        name: groupName,
        isGroup: true,
        members: [currentUser.email, ...selectedGroupMembers],
        latestTimestamp: new Date().toISOString(), // Set creation time as latest timestamp
      };

      setTeamMembers(prev => [newGroup, ...prev]);
      setSelectedConversation(newGroup);
      setShowGroupDialog(false);
      setGroupName("");
      setSelectedGroupMembers([]);
      loadData(); // Reload data to get accurate conversations and messages
      setShouldScrollToBottom(true);
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("Error creating group. Please try again.");
    }
  };

  const handleUpdateGroup = async ({ originalName, newName, newMembers }) => {
    try {
      const groupMessagesToUpdate = messages.filter(m => m.group_name === originalName);

      await Promise.all(groupMessagesToUpdate.map(async (msg) => {
        await Message.update(msg.id, { group_name: newName, group_members: newMembers });
      }));

      await Message.create({
        sender_name: 'System',
        sender_email: 'system@app.com',
        content: `${currentUser.full_name} updated the group "${originalName}" to "${newName}". Members updated.`,
        type: 'group',
        group_name: newName,
        group_members: newMembers
      });

      await loadData();
      setShowEditGroupDialog(false);

      if (selectedConversation?.name === originalName) {
        setSelectedConversation({
            ...selectedConversation,
            name: newName,
            members: newMembers,
        });
      }

    } catch (error) {
      console.error("Failed to update group:", error);
      alert("Error updating group. Please try again.");
    }
  };

  const handleDeleteGroup = async (groupName) => {
    try {
        const creationMessage = messages.find(m => m.group_name === groupName && m.content.includes("created the group"));
        if (creationMessage) {
            await Message.update(creationMessage.id, { is_archived: true });
        }

        await Message.create({
            sender_name: "System",
            sender_email: "system@app.com",
            content: `The group "${groupName}" has been deleted by ${currentUser.full_name}. This group is now archived and will no longer appear.`,
            type: "group",
            group_name: groupName,
            group_members: selectedConversation.members // Keep original members for historical context if needed
        });

        await loadData();
        setSelectedConversation(null);
        setShowEditGroupDialog(false);
    } catch (error) {
        console.error("Failed to delete group:", error);
        alert("Error deleting group. Please try again.");
    }
  };

  const handleCreatePoll = async (pollData) => {
    if (!selectedConversation) return;

    try {
      const messagePayload = {
        sender_name: currentUser.full_name,
        sender_email: currentUser.email,
        content: `Poll: ${pollData.question}`,
        type: selectedConversation.isGroup ? 'group' : 'direct',
        is_poll: true,
        poll_question: pollData.question,
        poll_options: pollData.options,
        poll_votes: pollData.options.reduce((acc, option) => ({ ...acc, [option]: [] }), {}),
      };

      if (selectedConversation.isGroup) {
        messagePayload.group_name = selectedConversation.name;
        messagePayload.group_members = selectedConversation.members;
      } else {
        messagePayload.recipient_email = selectedConversation.email;
      }

      await Message.create(messagePayload);
      setShowPollDialog(false);
      await loadMessages();
      await loadConversations(allTeamMembers); // Reload conversations to get latest message timestamp
      setShouldScrollToBottom(true);
    } catch (error) {
      console.error("Failed to create poll:", error);
    }
  };

  const handleVote = async (messageId, option) => {
    try {
      const messageToUpdate = messages.find(m => m.id === messageId);
      if (!messageToUpdate) return;

      const newVotes = { ...(messageToUpdate.poll_votes || {}) };

      // Remove current user's vote from all options
      Object.keys(newVotes).forEach(key => {
        newVotes[key] = newVotes[key].filter(voter => voter !== currentUser.email);
      });

      // Add current user's vote to the selected option
      if (!newVotes[option]) newVotes[option] = [];
      newVotes[option].push(currentUser.email);

      await Message.update(messageId, { poll_votes: newVotes });
      // Optimistically update UI
      const updatedMessages = messages.map(m => m.id === messageId ? { ...m, poll_votes: newVotes } : m);
      setMessages(updatedMessages);

    } catch (error) {
      console.error("Failed to cast vote:", error);
    }
  };

  const currentChatMessages = selectedConversation ? messages.filter(m => {
    if (selectedConversation.isGroup) {
      return m.group_name === selectedConversation.name;
    }
    return (m.sender_email === currentUser.email && m.recipient_email === selectedConversation.email) ||
           (m.sender_email === selectedConversation.email && m.recipient_email === currentUser.email);
  }).sort((a, b) => new Date(a.created_date) - new Date(b.created_date)) : [];

  const filteredMessages = messageSearchTerm
    ? currentChatMessages.filter(m =>
        m.content.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
        m.sender_name.toLowerCase().includes(messageSearchTerm.toLowerCase())
      )
    : currentChatMessages;

  const filteredTeamMembers = teamMembers.filter(m =>
    (m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     m.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-100">
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <Card className="h-full w-full flex overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
          {/* Sidebar - Fixed Width */}
          <div className={`w-80 border-r border-slate-200 flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
            {/* Sidebar Header - Fixed */}
            <CardHeader className="p-4 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 truncate">
                  <Users className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">Conversations</span>
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGroupDialog(true)}
                  className="flex items-center gap-2 flex-shrink-0 bg-white border-slate-300 hover:bg-slate-50"
                >
                  <Plus className="w-4 h-4" />
                  Group
                </Button>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search team..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-white"
                />
              </div>
            </CardHeader>
            
            {/* Contacts List - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {filteredTeamMembers.map((member) => {
                  const groupMemberDetails = member.isGroup ?
                    member.members?.map(email => allTeamMembers.find(u => u.email === email)?.full_name || email)
                    : [];
                  return (
                    <div
                      key={member.id || member.email}
                      onClick={() => handleSelectConversation(member)}
                      className={`flex items-center gap-3 p-3 cursor-pointer border-b border-slate-100 hover:bg-amber-50 transition-colors ${selectedConversation?.id === member.id || selectedConversation?.email === member.email ? 'bg-amber-100' : ''}`}
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback className="bg-amber-200 text-amber-800">
                          {member.isGroup ? '👥' : (member.full_name || 'U').split(' ').map(n=>n[0]).join('').substring(0,2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                            <p className={`text-slate-800 truncate ${member.unreadCount > 0 ? 'font-bold' : 'font-semibold'}`}>
                                {member.isGroup ? member.name : (member.full_name || member.name)}
                            </p>
                            {member.unreadCount > 0 && (
                                <span className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0 animate-pulse"></span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {member.isGroup ? `${groupMemberDetails.join(', ')}` : member.email}
                        </p>
                        {member.isGroup && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Group Chat
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
              })}
            </div>
          </div>

          {/* Main Chat Area - Fixed Width */}
          <div className={`flex-1 flex-col ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header - Fixed */}
                <CardHeader className="p-4 border-b border-slate-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBackToList}
                        className="md:hidden flex items-center justify-center mr-2 h-8 w-8"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation.avatar_url} />
                        <AvatarFallback className="bg-slate-200 text-slate-800">
                          {selectedConversation.isGroup ? '👥' : (selectedConversation.full_name || 'U').split(' ').map(n=>n[0]).join('').substring(0,2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">
                          {selectedConversation.isGroup ? selectedConversation.name : selectedConversation.full_name}
                        </h3>
                        <p className="text-xs text-green-600">
                          {selectedConversation.isGroup ? `${selectedConversation.members?.length} members` : 'Online'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-slate-400" />
                        <Input
                          placeholder="Search..."
                          value={messageSearchTerm}
                          onChange={(e) => setMessageSearchTerm(e.target.value)}
                          className="pl-7 h-8 w-32 md:w-48 text-sm bg-white"
                        />
                      </div>
                      {selectedConversation.isGroup && isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => setShowEditGroupDialog(true)} className="h-8 w-8">
                          <Settings className="w-5 h-5 text-slate-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Messages Container - Fixed Height, Scrollable */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50"
                  style={{ height: 'calc(100vh - 200px)', maxHeight: 'calc(100vh - 200px)' }}
                >
                  {filteredMessages.map((message) => (
                    message.is_poll ? (
                      <PollMessage
                        key={message.id}
                        message={message}
                        currentUserEmail={currentUser.email}
                        onVote={handleVote}
                        senderName={message.sender_name}
                        senderAvatarUrl={allTeamMembers.find(m => m.email === message.sender_email)?.avatar_url}
                      />
                    ) : (
                      <div key={message.id} className={`flex items-end gap-2 group ${message.sender_email === currentUser.email ? 'justify-end' : 'justify-start'}`}>
                        {message.sender_email !== currentUser.email && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            {selectedConversation.isGroup ? (
                              <>
                                <AvatarImage src={allTeamMembers.find(member => member.email === message.sender_email)?.avatar_url} />
                                <AvatarFallback className="bg-slate-200 text-slate-800 text-xs">
                                  {allTeamMembers.find(member => member.email === message.sender_email)?.full_name?.split(' ').map(n=>n[0]).join('').substring(0,2) || 'U'}
                                </AvatarFallback>
                              </>
                            ) : (
                              <>
                                <AvatarImage src={selectedConversation.avatar_url} />
                                <AvatarFallback className="bg-slate-200 text-slate-800 text-xs">
                                  {(selectedConversation.full_name || 'U').split(' ').map(n=>n[0]).join('').substring(0,2)}
                                </AvatarFallback>
                              </>
                            )}
                          </Avatar>
                        )}
                        
                        {/* Edit button appears before the message bubble for sent messages */}
                        {message.sender_email === currentUser.email && canEditMessage(message) && editingMessageId !== message.id && (
                           <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEditing(message)}
                            className="h-6 w-6 p-0 opacity-30 hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-800"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        )}
                        
                        <div className={`max-w-xs lg:max-w-md p-3 rounded-2xl relative ${message.sender_email === currentUser.email ? 'bg-amber-500 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                          {selectedConversation.isGroup && message.sender_email !== currentUser.email && (
                            <p className="text-xs font-semibold mb-1 opacity-70">{message.sender_name}</p>
                          )}

                          {editingMessageId === message.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className={`min-h-[60px] ${message.sender_email === currentUser.email ? 'bg-amber-400 text-white border-amber-300' : 'bg-slate-100 text-slate-800 border-slate-200'}`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleEditMessage(message.id);
                                  }
                                }}
                              />
                              <div className="flex gap-1 justify-end">
                                <Button size="sm" variant="ghost" onClick={() => handleEditMessage(message.id)} className="h-6 w-6 p-0 text-white hover:bg-white/20">
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => {setEditingMessageId(null); setEditingContent("");}} className="h-6 w-6 p-0 text-white hover:bg-white/20">
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm break-words">{message.content}</p>
                              <MessageAttachment message={message} />
                              <div className="flex items-center justify-end mt-1">
                                <p className={`text-xs ${message.sender_email === currentUser.email ? 'opacity-75' : 'text-slate-500'}`}>
                                  {formatTimestamp(message.created_date)}
                                  {message.edited_at && <span className="ml-1 text-xs opacity-80">(edited)</span>}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input - Fixed */}
                <div className="p-4 border-t border-slate-200 bg-white flex-shrink-0">
                  <div className="relative">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="pr-32 bg-white"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        title="Attach file"
                      >
                        <Paperclip className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setShowPollDialog(true)} title="Create Poll">
                        <Users className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button size="icon" className="bg-amber-500 hover:bg-amber-600" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {uploadingFile && (
                    <p className="text-xs text-slate-500 mt-1">Uploading file...</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50">
                <MessageSquare className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-800">Select a conversation</h3>
                <p className="text-slate-500">Choose someone from the list to start chatting.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Group Creation Dialog */}
        {showGroupDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Create Group Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
                <div>
                  <p className="text-sm font-medium mb-2">Select Members:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {allTeamMembers.filter(m => !m.isGroup && m.approved && m.email !== currentUser.email).map(member => (
                      <label key={member.id || member.email} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedGroupMembers.includes(member.email)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGroupMembers(prev => [...prev, member.email]);
                            } else {
                              setSelectedGroupMembers(prev => prev.filter(email => email !== member.email));
                            }
                          }}
                        />
                        <span className="text-sm">{member.full_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowGroupDialog(false);
                      setGroupName("");
                      setSelectedGroupMembers([]);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateGroup}
                    className="flex-1 bg-amber-500 hover:bg-amber-600"
                  >
                    Create Group
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <CreatePollDialog open={showPollDialog} onOpenChange={setShowPollDialog} onSubmit={handleCreatePoll} />

        {selectedConversation?.isGroup && showEditGroupDialog && isAdmin && (
            <EditGroupDialog
              open={showEditGroupDialog}
              onOpenChange={setShowEditGroupDialog}
              group={selectedConversation}
              allUsers={allTeamMembers.filter(u => u.approved)}
              onUpdate={handleUpdateGroup}
              onDelete={handleDeleteGroup}
              currentUserEmail={currentUser.email}
            />
        )}
      </div>
    </div>
  );
}
