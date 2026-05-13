import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppNotification, useNotifications } from '@/context/NotificationsContext';

export default function NotificationsScreen() {
  const { notifications, markAsRead, markAllAsRead, clearAll, loadMore, hasMore, isLoading, refreshNotifications } = useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  React.useEffect(() => {
    return () => markAllAsRead();
  }, []);

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'state_change':
        return 'psychology';
      case 'creation':
        return 'add-circle-outline';
      case 'system':
        return 'info-outline';
      default:
        return 'notifications-none';
    }
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <View 
      className={`flex-row items-center p-4 mb-3 rounded-3xl border ${item.read ? 'bg-white border-[#E8E8E8]' : 'bg-[#F2F8F2] border-[#C8E0C4]'}`}
    >
      <View className={`p-3 rounded-2xl ${item.read ? 'bg-gray-100' : 'bg-[#E0EFE0]'}`}>
        <MaterialIcons name={getIcon(item.type)} size={24} color={item.read ? '#8E8E8E' : '#548F53'} />
      </View>
      <View className="flex-1 ml-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-lg font-bold text-[#354F52] flex-1 mr-2" style={{ fontFamily: 'Nunito_700Bold' }}>{item.title}</Text>
          <Text className="text-xs text-gray-400">{formatTime(item.timestamp)}</Text>
        </View>
        <Text className="text-[#354F52]/80" style={{ fontFamily: 'Nunito_400Regular' }}>{item.message}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAF7]" edges={['top']}>
      <View className="flex-row justify-between items-center px-6 py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={32} color="#354F52" />
        </TouchableOpacity>
        <Text className="text-2xl text-[#354F52]" style={{ fontFamily: 'Nunito_700Bold' }}>Notifications</Text>
        <TouchableOpacity onPress={clearAll}>
          <Text className="text-[#E06B6B] font-bold" style={{ fontFamily: 'Nunito_600SemiBold' }}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        onEndReached={() => {
          if (!hasMore || isLoading) return;
          console.log('[UI] Chegou ao fundo da lista. A carregar mais...');
          loadMore();
        }}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#548F53']} tintColor="#548F53" />
        }
        ListFooterComponent={
          isLoading && hasMore ? (
            <View className="py-4">
              <ActivityIndicator color="#548F53" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20">
            <MaterialIcons name="notifications-off" size={64} color="#D1D1D1" />
            <Text className="text-gray-400 mt-4 text-center" style={{ fontFamily: 'Nunito_600SemiBold' }}>No notifications yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
} 
