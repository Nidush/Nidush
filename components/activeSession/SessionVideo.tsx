import { Ionicons } from '@expo/vector-icons';
import { resolveCatalogImage } from '@/constants/data/catalogAssets';
import {
  useVideoPlayer,
  VideoView,
  type ContentType,
  type VideoSource,
} from 'expo-video';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  NativeModules,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import {
  default as GoogleCast,
  CastButton,
  MediaStreamType,
  type MediaStatus,
  type MediaLoadRequest,
  type RemoteMediaClient,
  useCastSession,
} from './googleCast';

interface SessionVideoProps {
  videoUrl?: string;
  poster?: any;
}

type CastPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
type CastLoadResult = 'started' | 'loaded' | 'failed';

const DEFAULT_MEDIA_RECEIVER_APP_ID = 'CC1AD845';
const CAST_COMPATIBLE_MP4_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4';
const FALLBACK_VIDEO_URL = CAST_COMPATIBLE_MP4_URL;
const CAST_FALLBACK_VIDEO_URLS = [CAST_COMPATIBLE_MP4_URL];
const CAST_STATUS_CHECK_ATTEMPTS = 3;

const DIRECT_VIDEO_PATTERN = /\.(mp4|m3u8|webm|mov)(\?|#|$)/i;
const HLS_VIDEO_PATTERN = /\.m3u8(\?|#|$)/i;

const isGoogleCastNativeAvailable = () =>
  Boolean(
    NativeModules.RNGCCastContext &&
      UIManager.getViewManagerConfig?.('RNGoogleCastButton'),
  );

const isYouTubeUrl = (url?: string) =>
  /(?:youtube\.com|youtu\.be)/i.test(url ?? '');

const getCastContentType = (url: string) => {
  if (HLS_VIDEO_PATTERN.test(url)) return 'application/vnd.apple.mpegurl';
  if (/\.webm(\?|#|$)/i.test(url)) return 'video/webm';
  if (/\.mov(\?|#|$)/i.test(url)) return 'video/quicktime';
  return 'video/mp4';
};

const getVideoContentType = (url: string): ContentType => {
  if (HLS_VIDEO_PATTERN.test(url)) return 'hls';
  return DIRECT_VIDEO_PATTERN.test(url) ? 'progressive' : 'auto';
};

const getCastCandidateUrls = (mediaUrl: string) =>
  Array.from(new Set([mediaUrl, ...CAST_FALLBACK_VIDEO_URLS]));

const createCastMediaInfo = (url: string) => ({
  contentId: url,
  contentUrl: url,
  contentType: getCastContentType(url),
  streamType: MediaStreamType.BUFFERED,
});

const openExternalVideo = async (url?: string) => {
  if (!url) return;

  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    Linking.openURL(url).catch((error) => {
      console.error('Could not open video URL:', error);
    });
  }
};

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const withTimeout = async <T,>(
  promise: Promise<T>,
  milliseconds: number,
  label: string,
) =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(
        () => reject(new Error(`[Cast] ${label} timed out`)),
        milliseconds,
      );
    }),
  ]);

const isNoSessionError = (error: unknown) =>
  String(error).toLowerCase().includes('no session');

const hasLoadedCastMedia = (mediaStatus: MediaStatus | null) =>
  Boolean(mediaStatus?.mediaInfo && mediaStatus.currentItemId);

const isPlayingCastStatus = (mediaStatus: MediaStatus | null) =>
  Boolean(
    mediaStatus?.mediaInfo &&
      (mediaStatus.playerState === 'playing' ||
        mediaStatus.playerState === 'buffering'),
  );

const getLoadedCastMediaStatus = async (client: RemoteMediaClient) => {
  await withTimeout(client.requestStatus(), 1200, 'requestStatus').catch(
    () => {},
  );
  return withTimeout(client.getMediaStatus(), 1200, 'getMediaStatus');
};

const CastControls = ({
  mediaUrl,
}: {
  mediaUrl: string;
}) => {
  const castSession = useCastSession();
  const castClient = castSession?.getClient() ?? null;
  const autoLoadKeyRef = useRef<string | null>(null);
  const [castStatus, setCastStatus] = useState<CastPlaybackState>('idle');
  const [receiverAppId, setReceiverAppId] = useState<string | null>(null);

  useEffect(() => {
    if (!castSession) {
      setCastStatus('idle');
      autoLoadKeyRef.current = null;
    }
  }, [castSession]);

  useEffect(() => {
    if (!castSession) return;

    Promise.all([
      castSession.getApplicationMetadata().catch(() => null),
      castSession.getApplicationStatus().catch(() => null),
      castSession.getCastDevice().catch(() => null),
    ]).then(([metadata, applicationStatus, device]) => {
      setReceiverAppId(metadata?.applicationId ?? null);
      console.log('[Cast] Session connected:', {
        applicationId: metadata?.applicationId,
        applicationName: metadata?.name,
        applicationStatus,
        deviceName: device?.friendlyName,
        mediaUrl,
      });
    });
  }, [castSession, mediaUrl]);

  const getReadyCastClient = useCallback(
    async (showAlerts = true): Promise<RemoteMediaClient | null> => {
      const sessionManager = GoogleCast.getSessionManager();

      for (let attempt = 0; attempt < 12; attempt += 1) {
        const activeSession =
          (await sessionManager.getCurrentCastSession().catch(() => null)) ??
          castSession;

        if (activeSession) {
          try {
            const metadata = await activeSession
              .getApplicationMetadata()
              .catch(() => null);
            const applicationId = metadata?.applicationId ?? null;
            setReceiverAppId(applicationId);

            if (
              applicationId &&
              applicationId !== DEFAULT_MEDIA_RECEIVER_APP_ID
            ) {
              await sessionManager.endCurrentSession(true);
              setCastStatus('idle');

              if (showAlerts) {
                Alert.alert(
                  'TV connection was reset',
                  'The TV was using another Cast receiver. Tap the Cast icon again and choose your TV; Nidush will send the video automatically.',
                );
              }

              return null;
            }

            const client = activeSession.getClient();
            await withTimeout(
              client.requestStatus(),
              1200,
              'requestStatus',
            ).catch((error) => {
              if (isNoSessionError(error)) throw error;
              console.warn('[Cast] Status request was not ready:', error);
            });

            console.log('[Cast] Media client ready:', {
              attempt,
              applicationId,
              sessionId: activeSession.id,
            });

            return client;
          } catch (error) {
            if (!isNoSessionError(error)) {
              console.warn('[Cast] Media client not ready yet:', error);
            }
          }
        }

        await sleep(attempt < 3 ? 500 : 850);
      }

      if (showAlerts) {
        Alert.alert(
          'TV is still connecting',
          'The TV was selected, but the Cast media session is not ready yet. Try the Cast icon again in a few seconds.',
        );
      }

      return null;
    },
    [castSession],
  );

  const getPlayableCastStatus = useCallback(
    async (client = castClient) => {
      if (!client) return false;

      try {
        const mediaStatus = await getLoadedCastMediaStatus(client);
        return isPlayingCastStatus(mediaStatus) || hasLoadedCastMedia(mediaStatus);
      } catch {
        return false;
      }
    },
    [castClient],
  );

  const waitForPlayableCastStatus = useCallback(async (client = castClient): Promise<CastLoadResult> => {
    if (!client) return 'failed';

    let askedReceiverToPlay = false;
    let loadedMediaSeen = false;

    for (let attempt = 0; attempt < CAST_STATUS_CHECK_ATTEMPTS; attempt += 1) {
      await sleep(attempt === 0 ? 500 : 850);

      try {
        await withTimeout(
          client.requestStatus(),
          1200,
          'requestStatus',
        ).catch((error) => {
          console.warn('[Cast] Status request timed out or failed:', error);
        });
        const mediaStatus = await withTimeout(
          client.getMediaStatus(),
          1200,
          'getMediaStatus',
        );
        console.log('[Cast] Media status:', {
          attempt,
          keys: mediaStatus ? Object.keys(mediaStatus) : null,
          playerState: mediaStatus?.playerState,
          idleReason: mediaStatus?.idleReason,
          currentItemId: mediaStatus?.currentItemId,
          queueItems: mediaStatus?.queueItems?.length,
          contentUrl: mediaStatus?.mediaInfo?.contentUrl,
          contentType: mediaStatus?.mediaInfo?.contentType,
        });

        if (isPlayingCastStatus(mediaStatus)) return 'started';

        if (hasLoadedCastMedia(mediaStatus)) {
          if (!askedReceiverToPlay) {
            loadedMediaSeen = true;
            askedReceiverToPlay = true;
            console.log('[Cast] Forcing receiver play:', {
              attempt,
              contentUrl: mediaStatus?.mediaInfo?.contentUrl,
            });

            await withTimeout(client.play(), 2000, 'play').catch((error) => {
              console.warn('[Cast] Receiver play command failed:', error);
            });
            await withTimeout(
              client.setStreamMuted(false),
              1200,
              'setStreamMuted',
            ).catch(() => {});
            await withTimeout(
              client.setStreamVolume(1),
              1200,
              'setStreamVolume',
            ).catch(() => {});
          }
        }

        if (mediaStatus === null) {
          return 'failed';
        }

        if (
          mediaStatus?.playerState === 'idle' &&
          ['error', 'cancelled'].includes(String(mediaStatus.idleReason))
        ) {
          return 'failed';
        }
      } catch (error) {
        console.warn('[Cast] Could not read media status:', error);
      }
    }

    return loadedMediaSeen ? 'loaded' : 'failed';
  }, [castClient]);

  const loadMediaOnTv = useCallback(
    async (showAlerts = true) => {
      if (!castSession) {
        if (showAlerts) {
          Alert.alert(
            'Choose your TV',
            'Tap the Cast icon first and select your Chromecast, Google TV, or Android TV.',
          );
        }
        return false;
      }

      if (!DIRECT_VIDEO_PATTERN.test(mediaUrl)) {
        if (showAlerts) {
          Alert.alert(
            'This video cannot be sent to the TV',
            'Nidush can cast direct video files such as .mp4 and .m3u8.',
          );
        }
        return false;
      }

      try {
        const readyClient = await getReadyCastClient(showAlerts);
        if (!readyClient) return false;

        setCastStatus('loading');

        const castUrls = getCastCandidateUrls(mediaUrl);

        for (const castUrl of castUrls) {
          const mediaInfo = createCastMediaInfo(castUrl);
          const loadRequests: {
            label: string;
            request: MediaLoadRequest;
          }[] = [
            {
              label: HLS_VIDEO_PATTERN.test(castUrl) ? 'hls' : 'direct',
              request: {
                autoplay: true,
                startTime: 0,
                mediaInfo,
              },
            },
          ];

          for (const { label, request } of loadRequests) {
            const activeClient = readyClient;

            if (!activeClient) continue;

            try {
              console.log('[Cast] Loading media:', {
                label,
                receiverAppId,
                mediaUrl: castUrl,
                originalMediaUrl: mediaUrl,
              });

              await withTimeout(
                activeClient.loadMedia(request),
                3500,
                'loadMedia',
              );
              console.log('[Cast] loadMedia accepted:', {
                label,
                mediaUrl: castUrl,
              });

              await sleep(350);
              await withTimeout(activeClient.play(), 2000, 'play').catch(
                (error) => {
                  console.warn('[Cast] Initial play command failed:', error);
                },
              );

              const loadResult =
                await waitForPlayableCastStatus(activeClient);
              if (loadResult === 'started') {
                setCastStatus('playing');
                return true;
              }

              console.warn(
                '[Cast] Receiver accepted load but did not render playback:',
                {
                  label,
                  mediaUrl: castUrl,
                  loadResult,
                },
              );
            } catch (error) {
              if (!isNoSessionError(error)) throw error;

              console.warn('[Cast] Media session was not ready:', { label });
            }
          }
        }

        setCastStatus('error');
        await GoogleCast.getSessionManager().endCurrentSession(true).catch(
          () => {},
        );

        if (showAlerts) {
          Alert.alert(
            'TV video did not start',
            `The Sony TV accepted the Cast request but did not render video or audio. The video will keep playing in the app. Receiver: ${receiverAppId ?? 'unknown'}.`,
          );
        }

        return false;
      } catch (error) {
        console.error('Could not cast video:', error);
        setCastStatus('error');
        if (showAlerts) {
          Alert.alert(
            'Could not play on TV',
            'Please check that the TV is on and connected to the same Wi-Fi.',
          );
        }
        return false;
      }
    },
    [
      castSession,
      getReadyCastClient,
      mediaUrl,
      receiverAppId,
      waitForPlayableCastStatus,
    ],
  );

  useEffect(() => {
    if (!castClient || !castSession) return;

    const sessionKey = `${castSession.id ?? 'cast-session'}:${mediaUrl}`;
    const loadingSessionKey = `${sessionKey}:loading`;
    const failedSessionKey = `${sessionKey}:failed`;
    if (
      autoLoadKeyRef.current === sessionKey ||
      autoLoadKeyRef.current === loadingSessionKey ||
      autoLoadKeyRef.current === failedSessionKey
    ) {
      return;
    }

    console.log('[Cast] Auto load scheduled:', {
      sessionId: castSession.id,
      mediaUrl,
    });

    const timer = setTimeout(() => {
      if (
        autoLoadKeyRef.current === sessionKey ||
        autoLoadKeyRef.current === loadingSessionKey ||
        autoLoadKeyRef.current === failedSessionKey
      ) {
        return;
      }

      autoLoadKeyRef.current = loadingSessionKey;
      console.log('[Cast] Auto load fired:', {
        sessionId: castSession.id,
        mediaUrl,
      });
      loadMediaOnTv(false).then((didStart) => {
        autoLoadKeyRef.current = didStart ? sessionKey : failedSessionKey;
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [castClient, castSession, loadMediaOnTv, mediaUrl]);

  const handleToggleCastPlayback = async () => {
    if (!castSession) return;

    try {
      const activeClient = await getReadyCastClient(true);
      if (!activeClient) return;

      const mediaStatus = await getLoadedCastMediaStatus(activeClient).catch(
        () => null,
      );
      if (!hasLoadedCastMedia(mediaStatus)) {
        const didStart = await loadMediaOnTv(true);
        if (!didStart) setCastStatus('idle');
        return;
      }

      if (
        castStatus === 'paused' ||
        mediaStatus?.playerState !== 'playing'
      ) {
        await withTimeout(activeClient.play(), 2000, 'play');
        await withTimeout(
          activeClient.setStreamMuted(false),
          1200,
          'setStreamMuted',
        ).catch(() => {});
        await withTimeout(
          activeClient.setStreamVolume(1),
          1200,
          'setStreamVolume',
        ).catch(() => {});
        setCastStatus('playing');
      } else {
        await withTimeout(activeClient.pause(), 2000, 'pause');
        setCastStatus('paused');
      }
    } catch (error) {
      console.error('Could not control cast playback:', error);
      setCastStatus('error');
      Alert.alert(
        'TV control unavailable',
        'The TV is not ready for media controls yet. Choose it from the Cast icon again.',
      );
    }
  };

  const handleStopCast = async () => {
    if (!castSession) return;

    try {
      const activeClient = await getReadyCastClient(false);
      if (!activeClient) return;

      const hasMedia = await getPlayableCastStatus(activeClient);
      if (hasMedia) await withTimeout(activeClient.stop(), 2000, 'stop');
    } catch (error) {
      console.error('Could not stop cast playback:', error);
    } finally {
      setCastStatus('idle');
    }
  };

  const handleResetCast = async () => {
    try {
      await GoogleCast.getSessionManager().endCurrentSession(true);
    } catch (error) {
      console.error('Could not reset cast session:', error);
    } finally {
      setReceiverAppId(null);
      autoLoadKeyRef.current = null;
      setCastStatus('idle');
    }
  };

  const showTransportControls =
    castStatus === 'playing' || castStatus === 'paused';
  const statusText = castClient
    ? castStatus === 'loading'
      ? 'Sending video to TV'
      : castStatus === 'error'
        ? 'TV video did not start'
        : 'Connected to TV'
    : 'Tap the Cast icon to choose your TV';

  return (
    <View className="mt-5 w-full px-6">
      <View className="flex-row items-center justify-center gap-3">
        <View className="h-12 w-12 rounded-full bg-white border border-[#DDE8D8] items-center justify-center">
          <CastButton
            style={{ width: 28, height: 28, tintColor: '#354F52' }}
            tintColor="#354F52"
          />
        </View>

        {showTransportControls && (
          <>
            <TouchableOpacity
              className="h-12 w-12 rounded-full bg-white border border-[#DDE8D8] items-center justify-center"
              onPress={handleToggleCastPlayback}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={
                castStatus === 'paused' ? 'Resume TV video' : 'Pause TV video'
              }
            >
              <Ionicons
                name={castStatus === 'paused' ? 'play' : 'pause'}
                size={22}
                color="#354F52"
              />
            </TouchableOpacity>

            <TouchableOpacity
              className="h-12 w-12 rounded-full bg-white border border-[#DDE8D8] items-center justify-center"
              onPress={handleStopCast}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Stop TV video"
            >
              <Ionicons name="stop" size={20} color="#D9534F" />
            </TouchableOpacity>
          </>
        )}

        {castClient && (
          <TouchableOpacity
            className="h-12 w-12 rounded-full bg-white border border-[#DDE8D8] items-center justify-center"
            onPress={handleResetCast}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Reset TV connection"
          >
            <Ionicons name="close-circle" size={21} color="#D9534F" />
          </TouchableOpacity>
        )}
      </View>
      <Text
        maxFontSizeMultiplier={1.2}
        className="mt-3 text-center text-[#6A7D5B] text-sm"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        {statusText}
      </Text>
      {receiverAppId && (
        <Text
          maxFontSizeMultiplier={1.2}
          className="mt-1 text-center text-[#8A9A7B] text-xs"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          Receiver {receiverAppId}
        </Text>
      )}
    </View>
  );
};

const DirectVideoPlayer = ({
  playbackUrl,
  poster,
  title,
}: {
  playbackUrl: string;
  poster?: any;
  title: string;
}) => {
  const [hasFirstFrame, setHasFirstFrame] = useState(false);
  const posterSource = useMemo(() => resolveCatalogImage(poster), [poster]);
  const castAvailable = isGoogleCastNativeAvailable();
  const source = useMemo<VideoSource>(
    () => ({
      uri: playbackUrl,
      contentType: getVideoContentType(playbackUrl),
      metadata: {
        title,
        artist: 'Nidush',
      },
    }),
    [playbackUrl, title],
  );
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = false;
    p.volume = 1;
    p.audioMixingMode = 'doNotMix';
  });

  useEffect(() => {
    setHasFirstFrame(false);
    const timer = setTimeout(() => {
      try {
        player.play();
      } catch (error) {
        console.error('Could not start video playback:', error);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [player, playbackUrl]);

  return (
    <View className="flex-1 justify-center items-center px-5">
      <View className="w-full max-w-[360px] aspect-video bg-black rounded-[28px] overflow-hidden shadow-lg border-2 border-white">
        <VideoView
          player={player}
          nativeControls
          contentFit="contain"
          fullscreenOptions={{ enable: true }}
          onFirstFrameRender={() => setHasFirstFrame(true)}
          style={StyleSheet.absoluteFill}
        />

        {!hasFirstFrame && (
          <Image
            source={posterSource}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            blurRadius={1}
            accessible={false}
          />
        )}

        <View className="absolute top-4 left-4 z-20 bg-white/90 rounded-full px-3 py-1">
          <Text
            className="text-[#354F52] text-sm"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            Nidush
          </Text>
        </View>
      </View>

      {castAvailable && <CastControls mediaUrl={playbackUrl} />}
    </View>
  );
};

const YouTubeFallback = ({
  videoUrl,
  poster,
}: {
  videoUrl: string;
  poster?: any;
}) => {
  const posterSource = useMemo(() => resolveCatalogImage(poster), [poster]);

  return (
    <View className="flex-1 justify-center items-center px-5">
      <View className="w-full max-w-[360px] aspect-video bg-black rounded-[28px] overflow-hidden justify-center items-center shadow-lg relative border-2 border-white">
        <Image
          source={posterSource}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={2}
          accessible={false}
        />
        <View className="absolute inset-0 bg-black/45" />
        <View className="absolute top-4 left-4 bg-white/90 rounded-full px-3 py-1">
          <Text
            className="text-[#354F52] text-sm"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            Nidush
          </Text>
        </View>

        <TouchableOpacity
          className="bg-[#ff0000] px-6 py-3 rounded-full flex-row items-center"
          onPress={() => openExternalVideo(videoUrl)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Watch on YouTube"
        >
          <Ionicons
            name="logo-youtube"
            size={20}
            color="white"
            importantForAccessibility="no"
          />
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-white font-bold ml-2"
          >
            Watch on YouTube
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const SessionVideo = ({ videoUrl, poster }: SessionVideoProps) => {
  const trimmedVideoUrl = videoUrl?.trim();
  const isYouTube = isYouTubeUrl(trimmedVideoUrl);
  const playbackUrl =
    trimmedVideoUrl && !isYouTube ? trimmedVideoUrl : FALLBACK_VIDEO_URL;

  if (trimmedVideoUrl && isYouTube) {
    return <YouTubeFallback videoUrl={trimmedVideoUrl} poster={poster} />;
  }

  return (
    <DirectVideoPlayer
      playbackUrl={playbackUrl}
      poster={poster}
      title="Nidush video session"
    />
  );
};
