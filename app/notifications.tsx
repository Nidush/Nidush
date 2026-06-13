import { MaterialIcons } from '@expo/vector-icons';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppNotification, useNotifications } from '@/context/NotificationsContext';
import { FeedbackState } from '@/components/UI/FeedbackState';

export default function NotificationsScreen() {
  const { notifications, markAllAsRead, clearAll, loadMore, hasMore, isLoading, refreshNotifications } = useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  React.useEffect(() => {
    if (notifications.length === 0) {
      void refreshNotifications();
    }
  }, [notifications.length, refreshNotifications]);

  const handleClose = React.useCallback(() => {
    void markAllAsRead();
    router.replace('/(tabs)');
  }, [markAllAsRead]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

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
      className={`flex-row items-center p-4 mb-3 rounded-[28px] border ${item.read ? 'bg-white border-[#E6E8E0]' : 'bg-[#F6FBF2] border-[#BFD9B9]'}`}
    >
      <View className={`p-3 rounded-2xl ${item.read ? 'bg-[#F3F4EF]' : 'bg-[#E0EFE0]'}`}>
        <MaterialIcons name={getIcon(item.type)} size={24} color={item.read ? '#8E8E8E' : '#548F53'} />
      </View>
      <View className="flex-1 ml-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-lg text-[#354F52] flex-1 mr-2" style={{ fontFamily: 'Nunito_700Bold' }}>{item.title}</Text>
          <Text className="text-xs text-[#6B7280]" style={{ fontFamily: 'Nunito_600SemiBold' }}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text className="text-[#354F52]/80" style={{ fontFamily: 'Nunito_400Regular' }}>{item.message}</Text>
      </View>
    </View>
  );

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2EB]" edges={['top', 'bottom']}>
      <View className="px-5 pt-4 pb-3">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={handleClose}
            className="h-12 w-12 items-center justify-center rounded-full bg-white border border-[#DDE4D6]"
            accessibilityRole="button"
            accessibilityLabel="Close notifications"
            hitSlop={10}
          >
            <MaterialIcons name="chevron-left" size={30} color="#354F52" />
          </TouchableOpacity>

          <View className="flex-1 px-4">
            <Text className="text-3xl text-[#354F52] text-center" style={{ fontFamily: 'Nunito_700Bold' }}>
              Notifications
            </Text>
          </View>

          <TouchableOpacity
            onPress={clearAll}
            className="rounded-full bg-[#FFFFFF] border border-[#E7D2D2] px-4 py-2.5 min-w-[78px] items-center"
            accessibilityRole="button"
            accessibilityLabel="Clear all notifications"
          >
            <Text className="text-[#C85C5C]" style={{ fontFamily: 'Nunito_600SemiBold' }}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-[#354F52]/70 text-base" style={{ fontFamily: 'Nunito_400Regular' }}>
          Updates about your home, routines and wellbeing.
        </Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, flexGrow: 1 }}
        onEndReached={() => {
          if (!hasMore || isLoading) return;
          loadMore();
        }}
        onEndReachedThreshold={0.3}
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
          <FeedbackState
            icon="notifications-off"
            title="No notifications yet"
            message="When Nidush has updates about your home, routines, or wellbeing, they will appear here."
            compact
          />
        }
      />
    </SafeAreaView>
  );
} 
