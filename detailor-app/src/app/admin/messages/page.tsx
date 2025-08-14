"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeAdminUpdates } from '@/lib/realtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Input } from '@/ui/input';
import { MessageCircle, Send, Search, Plus, Phone, Mail } from 'lucide-react';

interface Message {
  id: string;
  customer_name: string;
  customer_email: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  channel: 'sms' | 'email' | 'chat';
  status: 'active' | 'resolved' | 'pending';
}

export default function AdminMessagesPage() {
  const [tenantId, setTenantId] = React.useState('');
  React.useEffect(() => {
    try {
      const cookie = document.cookie.split('; ').find(c => c.startsWith('df-tenant='));
      if (cookie) setTenantId(decodeURIComponent(cookie.split('=')[1]));
    } catch {}
  }, []);
  useRealtimeAdminUpdates(tenantId || '', true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [channelFilter, setChannelFilter] = React.useState<string>('all');
  const [selectedConversation, setSelectedConversation] = React.useState<string | null>(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async (): Promise<Message[]> => {
      const res = await fetch('/api/messages', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.error?.message || 'Failed to load messages');
      return json.data?.conversations || json.conversations || [];
    },
  });

  const { data: smsCredits } = useQuery({
    queryKey: ['sms-credits'],
    queryFn: async () => {
      const res = await fetch('/api/billing/usage', { cache: 'no-store' });
      const json = await res.json();
      return json.data?.usage?.sms_credits || json.usage?.sms_credits || 0;
    },
  });

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = channelFilter === 'all' || conv.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const getChannelIcon = (channel: Message['channel']) => {
    switch (channel) {
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'chat': return <MessageCircle className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Message['status']) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <RoleGuard allowed={['admin', 'staff']}>
      <DashboardShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">Messages</h1>
              <p className="text-[var(--color-text-secondary)]">Manage customer communications</p>
            </div>
            <div className="flex gap-3">
              <Button intent="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <Phone className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {smsCredits} SMS credits
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="px-3 py-2 border border-[var(--color-border-strong)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="all">All Channels</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="chat">Chat</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Conversations</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="space-y-4 p-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-medium text-[var(--color-text)] mb-2">No conversations</h3>
                      <p className="text-[var(--color-text-secondary)] text-sm">Start messaging customers to see conversations here.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedConversation === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                          }`}
                          onClick={() => setSelectedConversation(conversation.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {getChannelIcon(conversation.channel)}
                                <p className="font-medium text-[var(--color-text)] truncate">
                                  {conversation.customer_name}
                                </p>
                                {conversation.unread_count > 0 && (
                                  <Badge className="bg-red-500 text-white text-xs">
                                    {conversation.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-[var(--color-text-secondary)] truncate">
                                {conversation.last_message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(conversation.last_message_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={`ml-2 ${getStatusColor(conversation.status)}`}>
                              {conversation.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Message Thread */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col">
                {selectedConversation ? (
                  <>
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {filteredConversations.find(c => c.id === selectedConversation)?.customer_name}
                          </CardTitle>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            {filteredConversations.find(c => c.id === selectedConversation)?.customer_email}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button intent="outline" size="sm">
                            Mark Resolved
                          </Button>
                          <Button intent="outline" size="sm">
                            View Customer
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 bg-gray-50">
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-[var(--color-text-secondary)]">Message thread will be displayed here</p>
                          <p className="text-sm text-gray-500 mt-2">Select a conversation to view messages</p>
                        </div>
                      </div>
                    </CardContent>
                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Input placeholder="Type your message..." className="flex-1" />
                        <Button>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-medium text-[var(--color-text)] mb-2">Select a conversation</h3>
                      <p className="text-[var(--color-text-secondary)]">Choose a conversation from the list to view messages</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </DashboardShell>
    </RoleGuard>
  );
}