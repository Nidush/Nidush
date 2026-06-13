# Spotify Playback Snippet

Este snippet resume a integracao Spotify usada no projeto `Nidush`: autenticacao, leitura de playlists e controlo de playback.

## 1. Configuracao

```ts
import {
  makeRedirectUri,
  ResponseType,
  useAuthRequest,
} from 'expo-auth-session';

const SPOTIFY_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '',
  scheme: process.env.EXPO_PUBLIC_SPOTIFY_SCHEME ?? 'nidush',
  scopes: [
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'streaming',
    'playlist-read-private',
    'playlist-read-collaborative',
  ],
};

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

const redirectUri = makeRedirectUri({
  scheme: SPOTIFY_CONFIG.scheme,
  path: 'spotify-auth',
});
```

## 2. Login Spotify com PKCE

```ts
const [request, response, promptAsync] = useAuthRequest(
  {
    responseType: ResponseType.Code,
    clientId: SPOTIFY_CONFIG.clientId,
    scopes: SPOTIFY_CONFIG.scopes,
    usePKCE: true,
    redirectUri,
  },
  discovery,
);

const login = async () => {
  if (!request) return;
  await promptAsync();
};
```

## 3. Troca do codigo por access token

```ts
const exchangeCodeForToken = async (code: string, codeVerifier: string) => {
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirectUri);
  params.append('client_id', SPOTIFY_CONFIG.clientId);
  params.append('code_verifier', codeVerifier);

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json();

  if (data.access_token) {
    setToken(data.access_token);
  }
};
```

## 4. Ir buscar playlists do utilizador

```ts
const getUserPlaylists = async () => {
  if (!token) return [];

  const res = await fetch('https://api.spotify.com/v1/me/playlists', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.items || [];
};
```

## 5. Playback: tocar uma playlist

```ts
const playPlaylist = async (playlistId: string) => {
  if (!token) return;

  const context_uri = playlistId.startsWith('spotify:')
    ? playlistId
    : `spotify:playlist:${playlistId}`;

  await fetch('https://api.spotify.com/v1/me/player/play', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ context_uri }),
  });
};
```

## 6. Playback: pausa e retoma

```ts
const pausePlayback = async () => {
  if (!token) return;

  await fetch('https://api.spotify.com/v1/me/player/pause', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
};

const resumePlayback = async () => {
  if (!token) return;

  await fetch('https://api.spotify.com/v1/me/player/play', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
};
```

## 7. O que significa playback

`Playback` significa controlar a reproducao da musica:

- comecar a tocar
- pausar
- retomar
- escolher playlist
- escolher dispositivo onde vai tocar

## 8. Onde isto existe no projeto

O codigo real do projeto esta principalmente em:

- [context/SpotifyContext.tsx](/home/gabriel/Desktop/Nidush2/context/SpotifyContext.tsx:1)
- [components/UI/SpotifyPlaylistSelector.tsx](/home/gabriel/Desktop/Nidush2/components/UI/SpotifyPlaylistSelector.tsx:1)
- [app/ActiveSession.tsx](/home/gabriel/Desktop/Nidush2/app/ActiveSession.tsx:130)
- [constants/spotify-config.ts](/home/gabriel/Desktop/Nidush2/constants/spotify-config.ts:1)

## 9. Frase curta para explicar ao professor

> No nosso projeto, o snippet Spotify faz autenticacao OAuth com PKCE, le as playlists do utilizador e controla o playback, ou seja, tocar, pausar e retomar musica pela Spotify Web API.
