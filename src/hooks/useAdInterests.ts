import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdInterestTopicSummary {
  topicId: string;
  topicName: string;
  avgInterestScore: number;
  userCount: number;
}

export interface TopicBasic {
  topicId: string;
  topicName: string;
}

export interface AdUserInterestRow {
  userIdHash: string;
  topTopics: {
    topicId: string;
    topicName: string;
    interestScore: number;
  }[];
  totalTopicsWithInterest: number;
}

export const useAdInterests = () => {
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const recalculateInterests = async () => {
    setRecalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-ad-interests-recalculate', {
        method: 'POST',
      });

      if (error) throw error;

      toast.success(`Frissítve: ${data.processedUserTopicPairs} rekord feldolgozva`);
      return data;
    } catch (error) {
      console.error('Error recalculating ad interests:', error);
      toast.error('Hiba a reklámprofil újraszámításakor');
      throw error;
    } finally {
      setRecalculating(false);
    }
  };

  const fetchAllTopics = async (): Promise<TopicBasic[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-ad-interests-all-topics', {
        method: 'GET',
      });

      if (error) throw error;

      return data.topics || [];
    } catch (error) {
      console.error('Error fetching all topics:', error);
      toast.error('Hiba az összes témakör betöltésekor');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicSummary = async (): Promise<AdInterestTopicSummary[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-ad-interests-summary', {
        method: 'GET',
      });

      if (error) throw error;

      return data.topics || [];
    } catch (error) {
      console.error('Error fetching topic summary:', error);
      toast.error('Hiba a témakör összefoglaló betöltésekor');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInterests = async (page = 1, pageSize = 50, topicId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (topicId) {
        params.append('topicId', topicId);
      }

      const { data, error } = await supabase.functions.invoke(
        `admin-ad-interests-users?${params.toString()}`,
        { method: 'GET' }
      );

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching user interests:', error);
      toast.error('Hiba a felhasználói érdeklődési lista betöltésekor');
      return { items: [], page, pageSize, totalItems: 0, totalPages: 0 };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    recalculating,
    recalculateInterests,
    fetchAllTopics,
    fetchTopicSummary,
    fetchUserInterests,
  };
};