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
  playlistId?: string;
  playlistName?: string;
  instructions?: unknown[];
  ingredients?: { item: string; amount: string }[];
};

type FetchAiActivityIdeasOptions = {
  mood?: string;
  activeFilter?: string;
  prompt?: string;
  source?: string;
  spotifyPlaylists?: Array<{
    id: string;
    name: string;
  }>;
};

type SpotifyPlaylistOption = {
  id: string;
  name: string;
};

const PLAYLIST_KEYWORDS: Record<AiActivityIdea['type'], string[]> = {
  Cooking: ['cook', 'kitchen', 'dinner', 'coffee', 'food', 'chill', 'jazz'],
  Meditation: ['meditation', 'calm', 'peace', 'ambient', 'focus', 'sleep', 'breath'],
  Workout: ['workout', 'gym', 'run', 'power', 'energy', 'training', 'cardio'],
  Audiobooks: ['focus', 'reading', 'books', 'study', 'instrumental', 'deep focus'],
  Yoga: ['yoga', 'stretch', 'flow', 'zen', 'calm', 'balance'],
  Reading: ['reading', 'focus', 'study', 'quiet', 'instrumental', 'ambient'],
  other: ['mood', 'daily', 'mix', 'favorites', 'chill'],
};

const scorePlaylistForIdea = (
  playlist: SpotifyPlaylistOption,
  idea: AiActivityIdea,
) => {
  const haystack = `${idea.title} ${idea.description} ${idea.reason}`.toLowerCase();
  const playlistName = playlist.name.toLowerCase();
  const keywords = PLAYLIST_KEYWORDS[idea.type] ?? PLAYLIST_KEYWORDS.other;

  let score = 0;

  if (haystack.includes('morning') && playlistName.includes('morning')) score += 5;
  if (haystack.includes('night') && (playlistName.includes('night') || playlistName.includes('sleep'))) score += 5;
  if (haystack.includes('focus') && playlistName.includes('focus')) score += 5;
  if (haystack.includes('relax') && (playlistName.includes('relax') || playlistName.includes('calm'))) score += 5;

  for (const keyword of keywords) {
    if (playlistName.includes(keyword)) score += 3;
    if (haystack.includes(keyword) && playlistName.includes(keyword)) score += 4;
  }

  if (playlistName.includes('liked songs')) score += 1;
  if (playlistName.includes('favorites')) score += 2;

  return score;
};

const pickPlaylistForIdea = (
  idea: AiActivityIdea,
  spotifyPlaylists: SpotifyPlaylistOption[],
) => {
  if (!spotifyPlaylists.length) return null;

  const ranked = [...spotifyPlaylists]
    .map((playlist) => ({
      playlist,
      score: scorePlaylistForIdea(playlist, idea),
    }))
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.playlist ?? spotifyPlaylists[0];
};

const attachSpotifyPlaylistsToIdeas = (
  ideas: AiActivityIdea[],
  spotifyPlaylists: SpotifyPlaylistOption[],
) =>
  ideas.map((idea) => {
    if (idea.playlistId && idea.playlistName) return idea;

    const selectedPlaylist = pickPlaylistForIdea(idea, spotifyPlaylists);
    if (!selectedPlaylist) return idea;

    return {
      ...idea,
      playlistId: idea.playlistId || selectedPlaylist.id,
      playlistName: idea.playlistName || selectedPlaylist.name,
    };
  });

export const fetchAiActivityIdeas = async ({
  mood,
  activeFilter = 'All',
  prompt = '',
  source = 'app',
  spotifyPlaylists = [],
}: FetchAiActivityIdeasOptions = {}) => {
  const { data, error } = await supabase.functions.invoke('generate-activity-ideas', {
    body: {
      mood,
      activeFilter,
      prompt,
      source,
      localTime: new Date().toLocaleString(),
      spotifyPlaylists,
    },
  });

  if (error) throw error;

  const ideas = Array.isArray(data?.ideas) ? (data.ideas as AiActivityIdea[]) : [];
  return attachSpotifyPlaylistsToIdeas(ideas, spotifyPlaylists);
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

type FunctionErrorLike = {
  message?: string;
  context?: { json?: () => Promise<unknown> };
  response?: { json?: () => Promise<unknown> };
};

const normalizeErrorText = (value: unknown) => String(value || '').toLowerCase();

export const getFunctionErrorMessage = async (error: unknown) => {
  const normalizedError = error as FunctionErrorLike | undefined;
  const response = normalizedError?.context || normalizedError?.response;

  if (response && typeof response.json === 'function') {
    try {
      const body = await response.json();
      if (body && typeof body === 'object') {
        const typedBody = body as { error?: unknown; message?: unknown };
        if (typedBody.error) return String(typedBody.error);
        if (typedBody.message) return String(typedBody.message);
      }
    } catch {
      // Fall through to the generic message.
    }
  }

  return normalizedError?.message || 'Check that the Gemini function is deployed and configured.';
};

export const isAiRateLimitError = async (error: unknown) => {
  const message = await getFunctionErrorMessage(error);
  const normalized = normalizeErrorText(message);
  const fallback = normalizeErrorText((error as FunctionErrorLike | undefined)?.message);

  return (
    normalized.includes('429') ||
    normalized.includes('rate limit') ||
    normalized.includes('limit reached') ||
    normalized.includes('too many requests') ||
    fallback.includes('429') ||
    fallback.includes('rate limit')
  );
};

export const getNidushAiErrorMessage = async (error: unknown) => {
  if (await isAiRateLimitError(error)) {
    return 'Our AI guide is taking a short pause right now. Try again in about an hour.';
  }

  return 'We could not create an AI suggestion right now. Please try again in a little while.';
};
