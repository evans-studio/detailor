"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Avatar, AvatarFallback } from '@/ui/avatar';
import { twMerge } from 'tailwind-merge';

// Activity Types
export type ActivityType = 
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_started'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'customer_registered'
  | 'service_added'
  | 'review_received'
  | 'system_notification';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    initials: string;
    avatar?: string;
  };
  metadata?: {
    amount?: number;
    currency?: string;
    bookingReference?: string;
    customerName?: string;
    serviceName?: string;
    rating?: number;
    status?: string;
  };
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  read?: boolean;
  actionable?: boolean;
  onClick?: () => void;
}

// Activity Icons
const icons = {
  booking_created: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  booking_confirmed: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
    </svg>
  ),
  booking_started: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293L12 11l.707-.707A1 1 0 0113.414 10H15M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  booking_completed: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
    </svg>
  ),
  booking_cancelled: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  payment_received: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  ),
  payment_failed: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  customer_registered: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  service_added: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  review_received: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  system_notification: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// Activity color scheme
const getActivityColor = (type: ActivityType, priority?: string) => {
  if (priority === 'urgent') return 'var(--color-error)';
  if (priority === 'high') return 'var(--color-warning)';
  
  switch (type) {
    case 'booking_created':
    case 'booking_confirmed':
    case 'customer_registered':
    case 'service_added':
      return 'var(--color-primary)';
    case 'booking_started':
      return 'var(--color-warning)';
    case 'booking_completed':
    case 'payment_received':
    case 'review_received':
      return 'var(--color-success)';
    case 'booking_cancelled':
    case 'payment_failed':
      return 'var(--color-error)';
    case 'system_notification':
    default:
      return 'var(--color-text-muted)';
  }
};

// Format relative time
const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};

// Single Activity Item Component
function ActivityItemComponent({ activity, showAvatar = true }: { 
  activity: ActivityItem; 
  showAvatar?: boolean;
}) {
  const IconComponent = icons[activity.type];
  const activityColor = getActivityColor(activity.type, activity.priority);

  return (
    <div 
      className={`
        group relative flex gap-4 p-4 rounded-xl transition-all duration-200
        ${activity.onClick ? 'cursor-pointer hover:bg-[var(--color-hover-surface)] hover:shadow-sm' : ''}
        ${!activity.read ? 'bg-[var(--color-primary-50)] border-l-4 border-[var(--color-primary-500)]' : 'border-l-4 border-transparent'}
        ${activity.priority === 'urgent' ? 'ring-1 ring-[var(--color-error-100)] bg-[var(--color-error-50)]' : ''}
      `}
      onClick={activity.onClick}
    >
      {/* Modern Timeline indicator */}
      <div className="flex flex-col items-center">
        <div 
          className="flex items-center justify-center w-10 h-10 rounded-full shadow-sm transition-all duration-200 group-hover:scale-110"
          style={{ backgroundColor: activityColor, color: 'white' }}
        >
          <IconComponent />
        </div>
        <div className="w-px h-full bg-[var(--color-border)] mt-2 group-last:hidden" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold text-[var(--color-text)] truncate">
                {activity.title}
              </h4>
              {activity.priority && activity.priority !== 'low' && (
                <Badge 
                  variant={activity.priority === 'urgent' ? 'error' : 'warning'}
                  size="sm"
                  className="font-medium px-2 py-0.5"
                >
                  {activity.priority}
                </Badge>
              )}
              {!activity.read && (
                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
              )}
            </div>
            
            <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">
              {activity.description}
            </p>

            {/* Metadata */}
            {activity.metadata && (
              <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
                {activity.metadata.bookingReference && (
                  <span className="bg-gray-100 px-2 py-1 rounded font-medium">
                    {activity.metadata.bookingReference}
                  </span>
                )}
                {activity.metadata.customerName && (
                  <span className="font-medium">{activity.metadata.customerName}</span>
                )}
                {activity.metadata.amount && (
                  <span className="font-semibold text-[var(--color-success)]">
                    {activity.metadata.currency || '£'}{activity.metadata.amount.toFixed(2)}
                  </span>
                )}
                {activity.metadata.rating && (
                  <span className="flex items-center gap-1 font-medium">
                    ⭐ {activity.metadata.rating}/5
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <time className="font-medium">{formatRelativeTime(activity.timestamp)}</time>
          </div>
        </div>

        {/* User info - Mobile Optimized */}
        {showAvatar && activity.user && (
          <div className="flex items-center gap-2 mt-3">
            <Avatar size="sm">
              <AvatarFallback className="text-xs">
                {activity.user.initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-[var(--color-text-muted)] truncate">
              {activity.user.name}
            </span>
          </div>
        )}

        {/* Quick actions */}
        {activity.actionable && (
          <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <Button size="sm" intent="ghost" className="text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] font-medium">
              View
            </Button>
            <Button size="sm" intent="ghost" className="text-[var(--color-text-muted)] hover:bg-[var(--color-hover-surface)] font-medium">
              Mark Read
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Activity Feed Component
interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  showHeader?: boolean;
  showAvatar?: boolean;
  maxItems?: number;
  className?: string;
  loading?: boolean;
  onLoadMore?: () => void;
  onMarkAllRead?: () => void;
}

export function ActivityFeed({
  activities,
  title = "Recent Activity",
  showHeader = true,
  showAvatar = true,
  maxItems,
  className,
  loading = false,
  onLoadMore,
  onMarkAllRead,
}: ActivityFeedProps) {
  const displayedActivities = maxItems ? activities.slice(0, maxItems) : activities;
  const unreadCount = activities.filter(a => !a.read).length;

  if (loading) {
    return <ActivityFeedSkeleton className={className} />;
  }

  return (
    <Card className={twMerge('border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white', className)}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {title}
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="primary" size="sm" className="bg-blue-100 text-blue-700 border-blue-200 font-medium px-2.5 py-1">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && onMarkAllRead && (
              <Button size="sm" intent="ghost" onClick={onMarkAllRead} className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                Mark all read
              </Button>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className={`p-6 ${showHeader ? '' : 'pt-6'}`}>
        {displayedActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
            <p className="text-gray-600 text-sm">
              Recent activity will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2 stagger-children">
            {displayedActivities.map((activity, index) => (
              <div 
                key={activity.id} 
                className="animate-fade-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ActivityItemComponent 
                  activity={activity} 
                  showAvatar={showAvatar}
                />
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {maxItems && activities.length > maxItems && onLoadMore && (
          <div className="mt-6 text-center border-t border-gray-100 pt-4">
            <Button intent="ghost" size="sm" onClick={onLoadMore} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium">
              Load More Activity →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Modern Activity Feed Loading Skeleton
export function ActivityFeedSkeleton({ className }: { className?: string }) {
  return (
    <Card className={twMerge('border-gray-200 bg-white', className)}>
      <CardHeader className="border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
            <div className="h-6 bg-gray-300 rounded w-32 animate-pulse" />
          </div>
          <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-3 bg-gray-200 rounded w-16" />
                  <div className="h-3 bg-gray-200 rounded w-12" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Sample data generator for testing
export function generateSampleActivities(count: number = 10): ActivityItem[] {
  const types: ActivityType[] = [
    'booking_created', 'booking_confirmed', 'booking_started', 'booking_completed',
    'payment_received', 'customer_registered', 'review_received'
  ];
  
  const customers = ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Emma Brown', 'David Lee'];
  const services = ['Premium Detail', 'Express Wash', 'Paint Correction', 'Ceramic Coating'];

  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const service = services[Math.floor(Math.random() * services.length)];
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);

    return {
      id: `activity-${i}`,
      type,
      title: `${type.replace('_', ' ')} - ${customer}`,
      description: `${service} booking for ${customer}`,
      timestamp: timestamp.toISOString(),
      user: {
        name: customer,
        initials: customer.split(' ').map(n => n[0]).join(''),
      },
      metadata: {
        customerName: customer,
        serviceName: service,
        bookingReference: `DET-${1000 + i}`,
        amount: Math.random() * 200 + 50,
        currency: '£',
      },
      priority: Math.random() > 0.8 ? 'high' : 'medium',
      read: Math.random() > 0.3,
      actionable: Math.random() > 0.5,
    };
  });
}