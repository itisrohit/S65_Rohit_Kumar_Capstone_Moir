'use client';

import { useState } from 'react';
import { useFriend } from '@/hooks/useFriend';
import { Friend, FriendRequest } from '@/store/friendStore';
import { EmptyState } from '@/components/friend/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from "@/components/ui/skeleton"; 
import { IoPersonAdd } from 'react-icons/io5';
import { FiCheck, FiX, FiSearch, FiUsers, FiMail, FiSend } from 'react-icons/fi';
import { Check } from 'lucide-react';

export default function FriendsPage() {
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    error,
    sendFriendRequest,
    respondToRequest,
    markAllAsRead,
    unreadCounts,
  } = useFriend();

  const [newFriendInput, setNewFriendInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReadConfirmation, setShowReadConfirmation] = useState(false);

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newFriendInput.trim()) {
      await sendFriendRequest(newFriendInput.trim());
      setNewFriendInput('');
    }
  };

  // Function to handle marking all as read
  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setShowReadConfirmation(true);
    setTimeout(() => setShowReadConfirmation(false), 2000);
  };

  if (loading && friends.length === 0 && incomingRequests.length === 0 && outgoingRequests.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Friends</h1>
        
        {/* Skeleton for add friend form */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-20" />
            </div>
          </CardContent>
        </Card>
        
        {/* Skeleton for tabs */}
        <div className="mb-6">
          <Skeleton className="h-10 w-full" />
        </div>
        
        {/* Skeleton for search */}
        <div className="mb-4">
          <Skeleton className="h-10 w-full" />
        </div>
        
        {/* Skeleton for friend cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Title row with text-based mark all read button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Friends</h1>
        
        {/* Only show the button when there are unread items */}
        {unreadCounts?.total > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleMarkAllRead}
            className={`transition-colors flex items-center gap-2 ${
              showReadConfirmation ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : ''
            }`}
          >
            {showReadConfirmation ? (
              <>
                <Check className="h-4 w-4" />
                <span>Marked as read</span>
              </>
            ) : (
              <>
                <Badge 
                  variant="secondary" 
                  className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs"
                >
                  {unreadCounts.total}
                </Badge>
                <span>Mark all read</span>
              </>
            )}
          </Button>
        )}
      </div>
      
      {/* Add friend form */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSendRequest} className="flex gap-2">
            <Input
              value={newFriendInput}
              onChange={(e) => setNewFriendInput(e.target.value)}
              placeholder="Add friend by username or email"
              disabled={loading}
              className="flex-1"
            />
            <Button 
              type="submit"
              disabled={loading || !newFriendInput.trim()}
              className="gap-2"
            >
              <IoPersonAdd className="h-4 w-4" /> Add
            </Button>
          </form>
          
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Main content tabs */}
      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="all">
            All Friends 
            <Badge variant="outline" className="ml-2">{friends.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="incoming">
            Incoming 
            {unreadCounts?.incoming > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCounts.incoming}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            Outgoing 
            <Badge variant="outline" className="ml-2">{outgoingRequests.length}</Badge>
          </TabsTrigger>
        </TabsList>
        
        {/* All Friends Tab */}
        <TabsContent value="all" className="space-y-4">
          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search friends"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredFriends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredFriends.map((friend) => (
                <FriendCard key={friend.id} friend={friend} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FiUsers className="h-10 w-10 text-muted-foreground" />}
              title="No friends found"
              description={searchQuery ? "No friends match your search query" : "You haven't added any friends yet"}
              action={
                <Button variant="outline" className="mt-2" onClick={() => setSearchQuery('')}>
                  {searchQuery ? "Clear search" : "Add a friend"}
                </Button>
              }
            />
          )}
        </TabsContent>
        
        {/* Incoming Requests Tab */}
        <TabsContent value="incoming">
          {incomingRequests.length > 0 ? (
            <div className="space-y-3">
              {incomingRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onAccept={() => respondToRequest(request.id, true)}
                  onReject={() => respondToRequest(request.id, false)}
                />
              ))}
              
              {unreadCounts?.incoming > 0 && (
                <div className="flex justify-center mt-4">
                  <Button variant="ghost" onClick={() => markAllAsRead()}>
                    Mark all as read
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<FiMail className="h-10 w-10 text-muted-foreground" />}
              title="No incoming requests"
              description="When someone sends you a friend request, you'll see it here"
            />
          )}
        </TabsContent>
        
        {/* Outgoing Requests Tab */}
        <TabsContent value="outgoing">
          {outgoingRequests.length > 0 ? (
            <div className="space-y-3">
              {outgoingRequests.map((request) => (
                <OutgoingRequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FiSend className="h-10 w-10 text-muted-foreground" />}
              title="No outgoing requests"
              description="Friend requests you've sent will appear here"
              action={
                <Button variant="outline" className="mt-2" onClick={() => document.querySelector('input')?.focus()}>
                  Send a request
                </Button>
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Friend Card Component
const FriendCard = ({ friend }: { friend: Friend }) => (
  <Card>
    <CardContent className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={friend.image || '/default-avatar.png'} alt={friend.name} />
          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{friend.name}</p>
          <p className="text-sm text-muted-foreground">@{friend.username}</p>
        </div>
      </div>
      <Badge variant="outline" className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
        {friend.status === 'online' ? 'Online' : 'Offline'}
      </Badge>
    </CardContent>
  </Card>
);

// Request Card Component
const RequestCard = ({ 
  request, 
  onAccept, 
  onReject 
}: { 
  request: FriendRequest, 
  onAccept: () => void, 
  onReject: () => void 
}) => (
  <Card className={request.isRead ? '' : 'border-blue-500'}>
    <CardContent className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={request.user.image || '/default-avatar.png'} alt={request.user.name} />
          <AvatarFallback>{request.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{request.user.name}</p>
          <p className="text-sm text-muted-foreground">@{request.user.username}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onAccept} size="sm" className="h-9 w-9 p-0">
          <FiCheck className="h-4 w-4" />
          <span className="sr-only">Accept</span>
        </Button>
        <Button onClick={onReject} size="sm" variant="destructive" className="h-9 w-9 p-0">
          <FiX className="h-4 w-4" />
          <span className="sr-only">Reject</span>
        </Button>
      </div>
    </CardContent>
  </Card>
);

// Outgoing Request Card Component
const OutgoingRequestCard = ({ request }: { request: FriendRequest }) => (
  <Card>
    <CardContent className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={request.user.image || '/default-avatar.png'} alt={request.user.name} />
          <AvatarFallback>{request.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{request.user.name}</p>
          <p className="text-sm text-muted-foreground">@{request.user.username}</p>
        </div>
      </div>
      <Badge variant="secondary">Pending</Badge>
    </CardContent>
  </Card>
);