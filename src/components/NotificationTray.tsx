import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Mail, MessageSquare, AlertCircle, 
  CheckCircle2, Clock, ChevronRight, Inbox
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationTray = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (n: any) => {
    try {
      if (!n.is_read) {
        await markNotificationAsRead(n.id);
      }
      setIsOpen(false);
      
      if (n.rfq_id) {
        navigate(`/communication-hub?rfq=${n.rfq_id}`);
      } else if (n.link) {
        navigate(n.link);
      }
      
      // Refresh local state to show as read
      loadNotifications();
    } catch (error) {
      console.error('Error handling notification click:', error);
      // Fallback navigation even if marking read fails
      if (n.rfq_id) navigate(`/communication-hub?rfq=${n.rfq_id}`);
      else if (n.link) navigate(n.link);
    }
  };

  const handleClearAll = async () => {
    try {
      await markAllNotificationsAsRead();
      loadNotifications();
    } catch (error) {
       console.error('Failed to clear notifications', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'rfq_sent': return <Mail className="w-4 h-4 text-blue-500" />;
      case 'rfq_viewed': return <Clock className="w-4 h-4 text-purple-500" />;
      case 'quote_received': return <MessageSquare className="w-4 h-4 text-amber-500" />;
      case 'rfq_accepted': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'rfq_rejected': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default: return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] text-white flex items-center justify-center rounded-full border-2 border-card font-bold">
            {unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-transparent" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 z-50 origin-top-right"
            >
              <Card className="shadow-2xl border-primary/10 overflow-hidden">
                <div className="p-4 bg-primary/5 border-b flex items-center justify-between">
                  <h3 className="font-bold text-sm">Notifications</h3>
                  <Badge variant="outline" className="text-[10px]">{unreadCount} New</Badge>
                </div>
                
                <ScrollArea className="h-96">
                  {notifications.length === 0 && !loading ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Inbox className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">All caught up!</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/[0.02]' : ''}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className="flex gap-3">
                            <div className="mt-0.5">
                              {getIcon(n.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className={`text-xs leading-relaxed ${!n.is_read ? 'font-semibold' : 'text-muted-foreground'}`}>
                                {n.message}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase font-medium">
                                {format(new Date(n.created_at), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {loading && (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Loading...
                    </div>
                  )}
                </ScrollArea>
                
                <div className="p-2 border-t bg-muted/30">
                  <Button variant="ghost" size="sm" className="w-full text-[10px] uppercase font-bold tracking-wider" onClick={handleClearAll}>
                    Clear All Notifications
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationTray;
