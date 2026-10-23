import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Inbox, Send as SentIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { messagesApi } from '@/api/messages';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Messages() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [recipientId, setRecipientId] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newContent, setNewContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const queryClient = useQueryClient();

  const { data: inboxData } = useQuery({
    queryKey: ['messages', 'inbox'],
    queryFn: () => messagesApi.getMessages({ type: 'inbox' }),
  });

  const { data: sentData } = useQuery({
    queryKey: ['messages', 'sent'],
    queryFn: () => messagesApi.getMessages({ type: 'sent' }),
  });
  const { data: contactsData } = useQuery({
    queryKey: ['messageContacts'],
    queryFn: () => messagesApi.getContacts(),
  });

  const markAsReadMutation = useMutation({
    mutationFn: messagesApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
  const sendMutation = useMutation({
    mutationFn: messagesApi.send,
    onSuccess: () => {
      toast.success('Message sent');
      setNewSubject('');
      setNewContent('');
      setRecipientId('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to send message');
    },
  });

  const replyMutation = useMutation({
    mutationFn: messagesApi.send,
    onSuccess: () => {
      toast.success('Reply sent');
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to send reply');
    },
  });

  const handleMessageClick = (message: any) => {
    setSelectedMessage(message);
    if (!message.isRead && activeTab === 'inbox') {
      markAsReadMutation.mutate(message.id);
    }
  };

  const inboxMessages = inboxData?.messages || [];
  const sentMessages = sentData?.messages || [];
  const contacts = contactsData?.contacts || [];

  const handleSendNewMessage = () => {
    if (!recipientId || !newSubject.trim() || !newContent.trim()) {
      toast.error('Recipient, subject and content are required');
      return;
    }
    sendMutation.mutate({
      recipientId,
      subject: newSubject.trim(),
      content: newContent.trim(),
    });
  };

  const handleReply = () => {
    if (!selectedMessage?.senderId || !replyContent.trim()) {
      toast.error('Reply content is required');
      return;
    }

    const normalizedSubject = selectedMessage.subject?.startsWith('Re:')
      ? selectedMessage.subject
      : `Re: ${selectedMessage.subject || 'Message'}`;

    replyMutation.mutate({
      recipientId: selectedMessage.senderId,
      subject: normalizedSubject,
      content: replyContent.trim(),
      parentId: selectedMessage.id,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500">Communicate with patients and staff</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName} ({contact.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Message subject"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write your message..."
              className="min-h-28"
            />
          </div>
          <Button onClick={handleSendNewMessage} disabled={sendMutation.isPending}>
            <Send className="mr-2 h-4 w-4" />
            {sendMutation.isPending ? 'Sending...' : 'Send Message'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="inbox">
                  <Inbox className="mr-2 h-4 w-4" />
                  Inbox
                  {inboxMessages.filter((m) => !m.isRead).length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {inboxMessages.filter((m) => !m.isRead).length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent">
                  <SentIcon className="mr-2 h-4 w-4" />
                  Sent
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(activeTab === 'inbox' ? inboxMessages : sentMessages).map(
                (message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedMessage?.id === message.id
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-50'
                    } ${!message.isRead && activeTab === 'inbox' ? 'font-semibold' : ''}`}
                    onClick={() => handleMessageClick(message)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {activeTab === 'inbox'
                          ? `${message.sender?.firstName} ${message.sender?.lastName}`
                          : `To: ${message.recipient?.firstName} ${message.recipient?.lastName}`}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(message.createdAt), 'MMM d')}
                      </span>
                    </div>
                    <p className="text-sm truncate">{message.subject}</p>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          {selectedMessage ? (
            <>
              <CardHeader>
                <CardTitle>{selectedMessage.subject}</CardTitle>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    From: {selectedMessage.sender?.firstName}{' '}
                    {selectedMessage.sender?.lastName}
                  </span>
                  <span>
                    {format(new Date(selectedMessage.createdAt), 'PPp')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose max-w-none">
                  <p>{selectedMessage.content}</p>
                </div>

                {activeTab === 'inbox' && (
                  <div className="border-t pt-4">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="mb-2"
                    />
                    <Button onClick={handleReply} disabled={replyMutation.isPending}>
                      <Send className="mr-2 h-4 w-4" />
                      {replyMutation.isPending ? 'Sending...' : 'Reply'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex h-96 items-center justify-center text-gray-500">
              <p>Select a message to view</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
