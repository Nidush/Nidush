import { Activity } from '@/constants/data';
import { mapUserActivity } from '@/utils/catalogTemplates';
import { supabase } from '@/utils/supabase';

export type AiActivityIdea = {
  id: string;
  title: string;
  description: string;
  type: 'Cooking' | 'Meditation' | 'Workout' | 'Audiobooks' | 'Yoga' | 'Reading' | 'other';
  roomId: number | null;
  roomName: string;
  durationMinutes: number;
  image: string;
  reason: string;
  devicePlan: string[];
  contentTitle?: string;
  contentType?: string;
  contentCategory?: string;
  instructions?: unknown[];
  ingredients?: { item: string; amount: string }[];
};

type FetchAiActivityIdeasOptions = {
  mood?: string;
  activeFilter?: string;
  prompt?: string;
  source?: string;
};

export const fetchAiActivityIdeas = async ({
  mood,
  activeFilter = 'All',
  prompt = '',
  source = 'app',
}: FetchAiActivityIdeasOptions = {}) => {
  const { data, error } = await supabase.functions.invoke('generate-activity-ideas', {
    body: {
      mood,
      activeFilter,
      prompt,
      source,
      localTime: new Date().toLocaleString(),
    },
  });

  if (error) throw error;

  return Array.isArray(data?.ideas) ? (data.ideas as AiActivityIdea[]) : [];
};

export const saveAiActivityIdea = async (idea: AiActivityIdea): Promise<Activity> => {
  const { data, error } = await supabase.functions.invoke('generate-activity-ideas', {
    body: {
      action: 'save',
      idea,
    },
  });

  if (error) throw error;
  if (!data?.activity) throw new Error('AI activity was not saved.');

  return {
    ...mapUserActivity(data.activity),
    room: idea.roomName,
    room_id: idea.roomName,
  };
};

export const getFunctionErrorMessage = async (error: any) => {
  const response = error?.context || error?.response;

  if (response && typeof response.json === 'function') {
    try {
      const body = await response.json();
      if (body?.error) return String(body.error);
      if (body?.message) return String(body.message);
    } catch {
      // Fall through to the generic message.
    }
  }

  return error?.message || 'Check that the Gemini function is deployed and configured.';
};
