import { useState, useCallback } from 'react';
import { useOptimizedRealtime } from './useOptimizedRealtime';

interface AdminData {
  users: any[];
  purchases: any[];
  reports: any[];
  invitations: any[];
  totalUsers: number;
  totalRevenue: string;
}

/**
 * Optimized admin realtime hook with incremental updates
 * Instead of refetching all data on every change, updates only affected records
 */
export const useAdminRealtimeOptimized = (initialData: AdminData) => {
  const [data, setData] = useState<AdminData>(initialData);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const handleProfileUpdate = useCallback((payload: any) => {
    console.log('[Admin RT] Profile update:', payload);
    
    if (payload.eventType === 'INSERT') {
      setData(prev => ({
        ...prev,
        users: [...prev.users, payload.new],
        totalUsers: prev.totalUsers + 1
      }));
    } else if (payload.eventType === 'UPDATE') {
      setData(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === payload.new.id ? payload.new : u)
      }));
    } else if (payload.eventType === 'DELETE') {
      setData(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== payload.old.id),
        totalUsers: prev.totalUsers - 1
      }));
    }
    
    setLastUpdate(new Date());
  }, []);

  const handlePurchaseUpdate = useCallback((payload: any) => {
    console.log('[Admin RT] Purchase update:', payload);
    
    if (payload.eventType === 'INSERT') {
      const newPurchase = payload.new;
      setData(prev => ({
        ...prev,
        purchases: [newPurchase, ...prev.purchases],
        totalRevenue: newPurchase.status === 'completed' && newPurchase.amount_usd
          ? (parseFloat(prev.totalRevenue) + parseFloat(newPurchase.amount_usd)).toFixed(2)
          : prev.totalRevenue,
      }));
    } else if (payload.eventType === 'UPDATE') {
      setData(prev => ({
        ...prev,
        purchases: prev.purchases.map(p => p.id === payload.new.id ? payload.new : p),
      }));
    }
    
    setLastUpdate(new Date());
  }, []);

  const handleReportUpdate = useCallback((payload: any) => {
    console.log('[Admin RT] Report update:', payload);
    
    if (payload.eventType === 'INSERT') {
      setData(prev => ({
        ...prev,
        reports: [payload.new, ...prev.reports],
      }));
    } else if (payload.eventType === 'UPDATE') {
      setData(prev => ({
        ...prev,
        reports: prev.reports.map(r => r.id === payload.new.id ? payload.new : r),
      }));
    } else if (payload.eventType === 'DELETE') {
      setData(prev => ({
        ...prev,
        reports: prev.reports.filter(r => r.id !== payload.old.id),
      }));
    }
    
    setLastUpdate(new Date());
  }, []);

  const handleInvitationUpdate = useCallback((payload: any) => {
    console.log('[Admin RT] Invitation update:', payload);
    
    if (payload.eventType === 'INSERT') {
      setData(prev => ({
        ...prev,
        invitations: [payload.new, ...prev.invitations],
      }));
    } else if (payload.eventType === 'UPDATE') {
      setData(prev => ({
        ...prev,
        invitations: prev.invitations.map(i => i.id === payload.new.id ? payload.new : i),
      }));
    }
    
    setLastUpdate(new Date());
  }, []);

  // Single channel for all admin updates
  useOptimizedRealtime([
    { table: 'profiles', onUpdate: handleProfileUpdate },
    { table: 'purchases', onUpdate: handlePurchaseUpdate },
    { table: 'reports', onUpdate: handleReportUpdate },
    { table: 'invitations', onUpdate: handleInvitationUpdate },
  ], 'admin-optimized');

  return { data, lastUpdate };
};
