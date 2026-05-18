import React from 'react';

export type MediaStatus = {
  mediaInfo?: unknown;
  currentItemId?: unknown;
  playerState?: string;
} | null;

export type MediaLoadRequest = {
  autoplay?: boolean | null;
  startTime?: number;
  mediaInfo?: unknown;
};

export type RemoteMediaClient = {
  requestStatus: () => Promise<unknown>;
  getMediaStatus: () => Promise<MediaStatus>;
  loadMedia: (request: MediaLoadRequest) => Promise<unknown>;
  play: () => Promise<unknown>;
  pause: () => Promise<unknown>;
  stop: () => Promise<unknown>;
};

export const MediaStreamType = {
  BUFFERED: 'buffered',
} as const;

export const CastButton = () => null;

export const useCastSession = () => null;

const GoogleCast = {
  getSessionManager: () => ({
    getCurrentCastSession: async () => null,
    endCurrentSession: async () => undefined,
  }),
};

export default GoogleCast;
