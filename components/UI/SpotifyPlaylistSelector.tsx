import React, { useCallback, useEffect, useState } from 'react';
import {
  ImageSourcePropType,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSpotify } from '../../context/SpotifyContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type PlaylistItem = {
  id: string;
  name: string;
  images?: { url?: string }[];
  uri?: string;
};

interface SpotifyPlaylistSelectorProps {
  onSelect: (playlist: PlaylistItem) => void;
  selectedId?: string;
  onBeforeConnect?: () => Promise<void> | void;
}

export default function SpotifyPlaylistSelector({
  onSelect,
  selectedId,
  onBeforeConnect,
}: SpotifyPlaylistSelectorProps) {
  const { getUserPlaylists, isAuthenticated, login } = useSpotify();
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    const items = await getUserPlaylists();
    setPlaylists(items);
    setLoading(false);
  }, [getUserPlaylists]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPlaylists();
    }
  }, [isAuthenticated, loadPlaylists]);

  if (!isAuthenticated) {
    return (
      <View className="p-6 items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm">
        <MaterialCommunityIcons name="spotify" size={48} color="#1DB954" />
        <Text style={{ fontFamily: 'Nunito_700Bold' }} className="text-lg text-center mt-4 text-[#3E545C]">
          Connect Spotify to use your music
        </Text>
        <TouchableOpacity
          onPress={async () => {
            await onBeforeConnect?.();
            await login();
          }}
          className="bg-[#1DB954] px-8 py-3 rounded-full mt-4"
        >
          <Text style={{ fontFamily: 'Nunito_700Bold' }} className="text-white">Connect Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="py-10 items-center">
        <ActivityIndicator color="#1DB954" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Text style={{ fontFamily: 'Nunito_700Bold' }} className="text-xl text-[#3E545C] mb-4 px-1">
        Your Spotify Playlists
      </Text>
      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selectedId === item.id;
          return (
            <TouchableOpacity
              onPress={() => onSelect(item)}
              activeOpacity={0.8}
              className={`mr-4 w-32 items-center`}
            >
              <View className={`p-1 rounded-2xl ${isSelected ? 'bg-[#1DB954]' : 'bg-transparent'}`}>
                {(() => {
                  const imageSource: ImageSourcePropType = {
                    uri: item.images?.[0]?.url || 'https://via.placeholder.com/150',
                  };

                  return (
                <Image
                  source={imageSource}
                  className="w-28 h-28 rounded-xl"
                />
                  );
                })()}
              </View>
              <Text
                numberOfLines={1}
                style={{ fontFamily: 'Nunito_600SemiBold' }}
                className={`text-sm mt-2 text-center ${isSelected ? 'text-[#1DB954]' : 'text-[#3E545C]'}`}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="py-10 px-4 items-center">
            <Text style={{ fontFamily: 'Nunito_400Regular' }} className="text-gray-400 text-center">
              No playlists found. Create some on Spotify first!
            </Text>
          </View>
        }
      />
    </View>
  );
}
