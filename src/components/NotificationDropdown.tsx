import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, CheckCheck, FileText, Users, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const typeIcons = {
  invoice: FileText,
  payment: DollarSign,
  client: Users,
  product: Package,
  system: Bell,
};

const typeColors = {
  invoice: 'text-info',
  payment: 'text-success',
  client: 'text-primary',
  product: 'text-warning',
  system: 'text-muted-foreground',
};

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteNotification.mutate(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-[380px] p-0 mx-4 sm:mx-0">
        <div className="flex items-center justify-between p-4 border-b">
          <DropdownMenuLabel className="p-0 font-semibold text-base">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8 text-xs gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type as keyof typeof typeIcons];
                const iconColor = typeColors[notification.type as keyof typeof typeColors];
                
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-3 p-4 cursor-pointer',
                      !notification.read && 'bg-muted/50'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={cn('mt-1', iconColor)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium leading-tight">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => handleDelete(e, notification.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-xs"
                onClick={() => {
                  setOpen(false);
                  // Could navigate to a dedicated notifications page
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
