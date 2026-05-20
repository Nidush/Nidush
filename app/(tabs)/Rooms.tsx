import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../utils/supabase';

import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';

import AddRoomDevice from '../../components/rooms/AddRoomDevice';
import CategoryPill from '../../components/rooms/CategoryPill';
import DeviceCard from '../../components/rooms/device-card';
import {
  AppDevice,
  DeviceRecord,
  isRealHomeDevice,
  mapDeviceRecordToAppDevice,
  subscribeToHomeDeviceChanges,
} from '../../utils/devices';

interface Room {
  id: number;
  name: string;
}

type Device = AppDevice;

interface ActivityItem {
  id: number;
  title: string;
  description: string;
  type: string;
  image: string;
}

export default function Rooms() {
  const router = useRouter();
  
  // --- Fonts ---
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  // --- States ---
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [allActivities, setAllActivities] = useState<ActivityItem[]>([]);
  const [junctions, setJunctions] = useState<{ activity_id: number; device_id: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userHomeId, setUserHomeId] = useState<number | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Add Device Modal State ---
  const [isAddDeviceModalVisible, setIsAddDeviceModalVisible] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<'light' | 'speaker' | 'difuser' | 'purifier'>('light');
  const [isAdding, setIsAdding] = useState(false);

  // --- Manage Linked Devices Modal State ---
  const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [tempLinkedDeviceIds, setTempLinkedDeviceIds] = useState<number[]>([]);
  const [isSavingLinks, setIsSavingLinks] = useState(false);

  // --- Load Data from Database ---
  const loadDatabaseData = useCallback(async (options?: { showLoader?: boolean }) => {
    const showLoader = options?.showLoader ?? !hasLoadedOnce;

    if (showLoader) {
      setLoading(true);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Get current user's home ID
      const { data: homeAssoc } = await supabase
        .from('user_homes')
        .select('home_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!homeAssoc?.home_id) {
        setLoading(false);
        return;
      }
      
      const homeId = homeAssoc.home_id;
      setUserHomeId(homeId);

      // 2. Fetch Rooms
      const { data: roomsData, error: roomsErr } = await supabase
        .from('rooms')
        .select('id, name')
        .eq('home_id', homeId)
        .order('id', { ascending: true });

      if (roomsErr) throw roomsErr;
      
      const loadedRooms = roomsData || [];
      setRooms(loadedRooms);

      // Set first room as active if none is active
      setActiveRoomId((currentRoomId) => currentRoomId ?? loadedRooms[0]?.id ?? null);

      // 3. Fetch Devices
      const { data: devicesData, error: devicesErr } = await supabase
        .from('devices')
        .select('*')
        .eq('home_id', homeId);

      if (devicesErr) throw devicesErr;

      const mappedDevices: Device[] = (devicesData || [])
        .filter((device: DeviceRecord) => isRealHomeDevice(device))
        .map((device: DeviceRecord) => mapDeviceRecordToAppDevice(device));
      setAllDevices(mappedDevices);

      // 4. Fetch Activities
      const { data: activitiesData, error: activitiesErr } = await supabase
        .from('activities')
        .select('*')
        .eq('home_id', homeId);

      if (activitiesErr) throw activitiesErr;
      setAllActivities(activitiesData || []);

      // 5. Fetch Activity Devices Junctions
      try {
        const { data: junctionsData, error: junctionsErr } = await supabase
          .from('activity_devices')
          .select('activity_id, device_id');

        if (junctionsErr) {
          const isMissingJunctionTable =
            junctionsErr.code === 'PGRST205' ||
            junctionsErr.code === '42P01' ||
            /activity_devices/i.test(junctionsErr.message || '');

          if (isMissingJunctionTable) {
            console.log(
              'activity_devices table is not available yet; continuing without linked devices.',
            );
            setJunctions([]);
            return;
          }

          throw junctionsErr;
        }

        setJunctions(junctionsData || []);
      } catch (err) {
        console.log('activity_devices junction table not fully migrated or empty:', err);
      }

    } catch (error) {
      console.error('Error fetching room/device details:', error);
    } finally {
      setHasLoadedOnce(true);
      setLoading(false);
    }
  }, [hasLoadedOnce]);

  // Reload data when page gets focused
  useFocusEffect(
    useCallback(() => {
      loadDatabaseData({ showLoader: !hasLoadedOnce });
    }, [hasLoadedOnce, loadDatabaseData])
  );

  useEffect(() => {
    if (!userHomeId) return;

    const channel = subscribeToHomeDeviceChanges(userHomeId, () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        loadDatabaseData({ showLoader: false });
      }, 250);
    });

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [loadDatabaseData, userHomeId]);

  // --- Real-time Updates ---
  const toggleDevice = async (deviceId: number) => {
    // Optimistic UI Update
    const device = allDevices.find(d => d.id === deviceId);
    if (!device) return;

    const nextStatus = device.status === 'On' ? 'Off' : 'On';
    
    setAllDevices(prev => prev.map(d => 
      d.id === deviceId ? { ...d, status: nextStatus } : d
    ));

    try {
      const { error } = await supabase
        .from('devices')
        .update({ status: nextStatus })
        .eq('id', deviceId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to toggle device status:', err);
      // Revert status on failure
      setAllDevices(prev => prev.map(d => 
        d.id === deviceId ? { ...d, status: device.status } : d
      ));
      Alert.alert('Control Error', 'Could not sync device status to server.');
    }
  };

  const updateDeviceLevel = async (deviceId: number, newLevel: number) => {
    const roundedLevel = Math.round(newLevel);
    
    setAllDevices(prev => prev.map(d => 
      d.id === deviceId ? { ...d, level: roundedLevel, status_level: roundedLevel } : d
    ));

    try {
      const { error } = await supabase
        .from('devices')
        .update({ status_level: roundedLevel })
        .eq('id', deviceId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update device level:', err);
    }
  };

  // --- Add Device Handler ---
  const handleAddDevice = async () => {
    if (!newDeviceName.trim()) {
      Alert.alert('Error', 'Please enter a device name.');
      return;
    }

    if (!activeRoomId || !userHomeId) {
      Alert.alert('Error', 'No active room or home found.');
      return;
    }

    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload = {
        name: newDeviceName.trim(),
        type: newDeviceType,
        source: 'network',
        status: 'Off',
        connectivity_status: 'online',
        discovery_method: 'manual',
        sync_source: 'manual',
        status_level: newDeviceType === 'light' ? 100 : 50,
        room_id: activeRoomId,
        home_id: userHomeId,
        user_id: user?.id || null,
        external_id: `room_dev:${Date.now()}`,
      };
      const legacyPayload = {
        name: newDeviceName.trim(),
        type: newDeviceType,
        source: 'network',
        status: 'Off',
        status_level: newDeviceType === 'light' ? 100 : 50,
        room_id: activeRoomId,
        home_id: userHomeId,
        user_id: user?.id || null,
        external_id: payload.external_id,
      };

      let { data, error } = await supabase
        .from('devices')
        .insert(payload)
        .select()
        .single();

      if (error?.code === '42703') {
        const fallbackResult = await supabase
          .from('devices')
          .insert(legacyPayload)
          .select()
          .single();
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) throw error;

      if (data) {
        setAllDevices(prev => [...prev, {
          ...mapDeviceRecordToAppDevice(data as DeviceRecord),
        }]);
        
        setIsAddDeviceModalVisible(false);
        setNewDeviceName('');
        Alert.alert('Success', `"${data.name}" added to this room.`);
      }
    } catch (err: any) {
      console.error('Failed to add device:', err);
      Alert.alert('Error', 'Could not create new smart device: ' + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  // --- Manage Linked Devices Handler ---
  const openManageDevicesModal = (activity: ActivityItem) => {
    setSelectedActivity(activity);
    
    const linkedIds = junctions
      .filter(j => j.activity_id === activity.id)
      .map(j => j.device_id);

    setTempLinkedDeviceIds(linkedIds);
    setIsManageModalVisible(true);
  };

  const toggleLinkDevice = (deviceId: number) => {
    setTempLinkedDeviceIds(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId) 
        : [...prev, deviceId]
    );
  };

  const handleSaveLinks = async () => {
    if (!selectedActivity) return;
    setIsSavingLinks(true);
    
    try {
      const { error: deleteErr } = await supabase
        .from('activity_devices')
        .delete()
        .eq('activity_id', selectedActivity.id);

      if (deleteErr) throw deleteErr;

      if (tempLinkedDeviceIds.length > 0) {
        const payload = tempLinkedDeviceIds.map(devId => ({
          activity_id: selectedActivity.id,
          device_id: devId
        }));

        const { error: insertErr } = await supabase
          .from('activity_devices')
          .insert(payload);

        if (insertErr) throw insertErr;
      }

      setJunctions(prev => {
        const filtered = prev.filter(j => j.activity_id !== selectedActivity.id);
        const added = tempLinkedDeviceIds.map(devId => ({
          activity_id: selectedActivity.id,
          device_id: devId
        }));
        return [...filtered, ...added];
      });

      setIsManageModalVisible(false);
      setSelectedActivity(null);
      Alert.alert('Success', 'Linked devices updated successfully.');
    } catch (err: any) {
      console.error('Failed to save activity-device links:', err);
      Alert.alert('Error', 'Failed to update linked devices: ' + err.message);
    } finally {
      setIsSavingLinks(false);
    }
  };

  // --- Filtering & Memoized room elements ---
  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId),
    [activeRoomId, rooms],
  );

  const roomDevices = useMemo(
    () => allDevices.filter((device) => device.room_id === activeRoomId),
    [activeRoomId, allDevices],
  );

  const roomActivities = useMemo(
    () => allActivities.filter((activity) => (activity as any).room_id === activeRoomId),
    [activeRoomId, allActivities],
  );

  const filteredDevices = useMemo(() => {
    return roomDevices.filter((device) => {
      const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [roomDevices, searchQuery]);

  const menuActions = [
    { 
      label: 'Device',
      onPress: () => setIsAddDeviceModalVisible(true)
    },
    { 
      label: 'Room',
      onPress: () => {
        if (activeRoom) {
          router.push({
            pathname: '/new-activity',
            params: { preselectedRoom: activeRoom.name }
          });
        } else {
          router.push('/new-activity');
        }
      }
    }
  ];

  if (!fontsLoaded || loading) {
    return (
      <View className="flex-1 bg-[#F1F3EA] justify-center items-center">
        <ActivityIndicator size="large" color="#548F53" />
        <Text className="mt-4 text-[#354F52]" style={{ fontFamily: 'Nunito_600SemiBold' }}>
          Loading your smart home...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-[#F1F3EA]"
      edges={['top']}
      accessibilityLanguage="en-US"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F2F5F0" />

      {/* Header (Original unmodified format & title) */}
      <View className="items-center mt-2 mb-6">
        <Text
          maxFontSizeMultiplier={1.2}
          className="text-3xl font-semibold text-[#354F52]"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
          accessibilityRole="header"
        >
          Rooms
        </Text>
      </View>

      {/* Search Bar (Original style: bg-transparent) */}
      <View className="px-5 mb-6">
        <View className="flex-row items-center justify-center border border-[#BDC7C2] rounded-full px-4 h-12 bg-transparent">
          <MaterialIcons
            name="search"
            size={24}
            color="#7A8C85"
            style={{ marginRight: 10 }}
            accessible={false}
          />
          <TextInput
            maxFontSizeMultiplier={1.2}
            placeholder="Search devices..."
            accessibilityLabel="Search devices"
            accessibilityRole="search"
            accessibilityHint="Type to filter devices by name."
            placeholderTextColor="#7A8C85"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 h-full text-base text-[#2C3A35]"
            style={{
              fontFamily: 'Nunito_600SemiBold',
              paddingVertical: 0,
            }}
            textAlignVertical="center"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              accessibilityHint="Clears the current search text."
              hitSlop={10}
            >
              <MaterialIcons
                name="close"
                size={20}
                color="#7A8C85"
                accessible={false}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories (Original style: h-10 mb-9) */}
      <View className="h-10 mb-9 flex justify-center items-center">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {rooms.map((room) => (
            <CategoryPill
              key={room.id}
              item={{ id: room.id, name: room.name }}
              isActive={activeRoomId === room.id}
              onPress={() => {
                setActiveRoomId(room.id);
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Main FlatList rendering Devices in 2 columns (Original structural grid) */}
      <FlatList
        data={filteredDevices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <DeviceCard
            item={item}
            onToggle={() => toggleDevice(item.id)}
            onUpdateLevel={(newLevel) => updateDeviceLevel(item.id, newLevel)}
          />
        )}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        
        // Render statistical widgets & activities in ListHeaderComponent
        ListHeaderComponent={
          activeRoom ? (
            <View className="mb-6">
              {/* 1. Room Activities Layer */}
              <View className="mb-6">
                <Text className="text-xl font-bold text-[#354F52] mb-3" style={{ fontFamily: 'Nunito_700Bold' }}>
                  Atmospheric Activities here ({roomActivities.length})
                </Text>

                {roomActivities.length > 0 ? (
                  <View className="gap-y-4">
                    {roomActivities.map((activity) => {
                      const activityLinks = junctions.filter(j => j.activity_id === activity.id);
                      const linkedDevices = allDevices.filter(d => 
                        activityLinks.some(link => link.device_id === d.id)
                      );

                      return (
                        <View 
                          key={activity.id} 
                          className="bg-white/80 border border-[#D8DFD5] rounded-3xl p-4 flex-row items-center justify-between"
                        >
                          <TouchableOpacity 
                            className="flex-1 mr-4"
                            onPress={() => router.push({
                              pathname: '/activity-details',
                              params: { id: activity.id.toString() }
                            })}
                          >
                            <Text className="text-lg font-bold text-[#354F52] mb-1" style={{ fontFamily: 'Nunito_700Bold' }}>
                              {activity.title}
                            </Text>
                            <Text className="text-xs text-gray-500 mb-2" numberOfLines={2} style={{ fontFamily: 'Nunito_400Regular' }}>
                              {activity.description || 'No description provided.'}
                            </Text>
                            
                            <View className="flex-row flex-wrap gap-1">
                              {linkedDevices.length > 0 ? (
                                linkedDevices.map(d => (
                                  <View key={d.id} className="bg-[#E9ECE6] px-2 py-0.5 rounded-full flex-row items-center">
                                    <MaterialIcons 
                                      name={d.type === 'light' ? 'lightbulb' : d.type === 'speaker' ? 'speaker' : 'devices'} 
                                      size={11} 
                                      color="#548F53" 
                                    />
                                    <Text className="text-[10px] text-[#4A5D4E] ml-1" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                                      {d.name}
                                    </Text>
                                  </View>
                                ))
                              ) : (
                                <Text className="text-[11px] text-gray-400 italic" style={{ fontFamily: 'Nunito_400Regular' }}>
                                  No smart devices linked
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            onPress={() => openManageDevicesModal(activity)}
                            className="bg-[#548F53] px-3.5 py-2.5 rounded-2xl flex-row items-center justify-center"
                            accessibilityRole="button"
                            accessibilityLabel="Link smart devices"
                          >
                            <Ionicons name="link" size={16} color="white" />
                            <Text className="text-white text-xs font-bold ml-1.5" style={{ fontFamily: 'Nunito_700Bold' }}>
                              Link
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View className="w-full bg-white/40 border border-dashed border-[#BDC7C2] p-6 rounded-2xl items-center justify-center">
                    <MaterialCommunityIcons name="calendar-blank" size={32} color="#7A8C85" />
                    <Text className="text-[#7A8C85] text-center mt-2 text-sm" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                      No wellness activities linked to this room
                    </Text>
                  </View>
                )}
              </View>

              {/* 2. Devices Section Title */}
              <Text className="text-xl font-bold text-[#354F52] mb-1" style={{ fontFamily: 'Nunito_700Bold' }}>
                Smart Home Devices ({filteredDevices.length})
              </Text>
            </View>
          ) : null
        }

        ListEmptyComponent={
          <View className="items-center mt-12 justify-center px-10">
            <MaterialCommunityIcons
              name={searchQuery ? 'selection-search' : 'home-plus'}
              size={80}
              color="#354F52"
              accessible={false}
            />
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-[#7A8C85] mt-5 text-lg text-center"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              {searchQuery
                ? `No devices found for "${searchQuery}"`
                : 'Your devices will live here.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          activeRoom ? (
            <View className="mt-4 mb-6 rounded-3xl border border-[#D8DFD5] bg-white/70 p-5">
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  className="text-lg text-[#354F52] font-bold"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  {activeRoom.name} Summary
                </Text>
                <MaterialCommunityIcons
                  name="sofa-single"
                  size={22}
                  color="#548F53"
                  accessible={false}
                />
              </View>
              <Text
                className="text-[#6C7A74] text-sm mb-3"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                {filteredDevices.length} device{filteredDevices.length === 1 ? '' : 's'}, with {roomActivities.length} activity
                {roomActivities.length === 1 ? '' : 'ies'} linked to this room.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Floating menu FAB with Add room / device actions */}
      <AddRoomDevice actions={menuActions} />

      {/* --- ADD NEW SMART DEVICE DIALOG MODAL --- */}
      <Modal
        visible={isAddDeviceModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAddDeviceModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-[36px] p-6 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-[#354F52]" style={{ fontFamily: 'Nunito_700Bold' }}>
                Add new smart device
              </Text>
              <TouchableOpacity onPress={() => setIsAddDeviceModalVisible(false)} hitSlop={15}>
                <Ionicons name="close" size={24} color="#7A8C85" />
              </TouchableOpacity>
            </View>

            <Text className="text-[#354F52] text-sm mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
              Device Name
            </Text>
            <TextInput
              placeholder="e.g. Atmosphere Diffuser"
              value={newDeviceName}
              onChangeText={setNewDeviceName}
              className="bg-[#F1F3EA] border border-[#BDC7C2] rounded-2xl px-4 py-3 text-base text-[#2C3A35] mb-5"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            />

            <Text className="text-[#354F52] text-sm mb-3" style={{ fontFamily: 'Nunito_600SemiBold' }}>
              Device Category Type
            </Text>
            <View className="flex-row justify-between mb-8 gap-x-2">
              {(['light', 'speaker', 'difuser', 'purifier'] as const).map(type => {
                const isSelected = newDeviceType === type;
                const label = type.charAt(0).toUpperCase() + type.slice(1);

                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setNewDeviceType(type)}
                    className={`w-[23%] py-3 rounded-2xl border items-center justify-center ${
                      isSelected 
                        ? 'bg-[#BBE6BA] border-transparent' 
                        : 'bg-transparent border-[#BDC7C2]'
                    }`}
                  >
                    {type === 'difuser' ? (
                      <MaterialCommunityIcons name="air-purifier" size={22} color={isSelected ? '#354F52' : '#7A8C85'} />
                    ) : type === 'light' ? (
                      <MaterialIcons name="lightbulb" size={22} color={isSelected ? '#354F52' : '#7A8C85'} />
                    ) : type === 'speaker' ? (
                      <MaterialIcons name="speaker" size={22} color={isSelected ? '#354F52' : '#7A8C85'} />
                    ) : (
                      <MaterialIcons name="air" size={22} color={isSelected ? '#354F52' : '#7A8C85'} />
                    )}
                    <Text className="text-[10px] mt-1 text-[#354F52] font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setIsAddDeviceModalVisible(false)}
                className="w-[48%] py-4 bg-[#F1F3EA] rounded-full items-center"
              >
                <Text className="text-[#354F52] text-lg font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddDevice}
                disabled={isAdding}
                className="w-[48%] py-4 bg-[#548F53] rounded-full items-center flex-row justify-center"
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white text-lg font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                    Confirm & Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MANAGE LINKED DEVICES DIALOG MODAL --- */}
      <Modal
        visible={isManageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsManageModalVisible(false)}
      >
        <View className="flex-1 justify-center bg-black/50 px-5">
          <View className="bg-white rounded-[32px] p-6 max-h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-[#354F52] flex-1 mr-4" style={{ fontFamily: 'Nunito_700Bold' }} numberOfLines={1}>
                Devices for: {selectedActivity?.title}
              </Text>
              <TouchableOpacity onPress={() => setIsManageModalVisible(false)} hitSlop={15}>
                <Ionicons name="close" size={24} color="#7A8C85" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-gray-500 mb-4" style={{ fontFamily: 'Nunito_400Regular' }}>
              Select the devices in this room that should turn on or activate when this activity is started.
            </Text>

            <ScrollView className="mb-6 gap-y-3" showsVerticalScrollIndicator={false}>
              {roomDevices.length > 0 ? (
                roomDevices.map(d => {
                  const isChecked = tempLinkedDeviceIds.includes(d.id);
                  return (
                    <TouchableOpacity
                      key={d.id}
                      onPress={() => toggleLinkDevice(d.id)}
                      className={`flex-row items-center justify-between p-4 rounded-2xl border ${
                        isChecked 
                          ? 'bg-[#BBE6BA]/40 border-[#548F53]' 
                          : 'bg-white border-[#E9ECE6]'
                      }`}
                    >
                      <View className="flex-row items-center">
                        <View className="bg-[#548F53]/20 p-2 rounded-full mr-3">
                          <MaterialIcons 
                            name={d.type === 'light' ? 'lightbulb' : d.type === 'speaker' ? 'speaker' : 'devices'} 
                            size={20} 
                            color="#548F53" 
                          />
                        </View>
                        <Text className="text-[#354F52] font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                          {d.name}
                        </Text>
                      </View>
                      
                      <Switch
                        value={isChecked}
                        onValueChange={() => toggleLinkDevice(d.id)}
                        trackColor={{ false: '#D8DFD5', true: '#BBE6BA' }}
                        thumbColor={isChecked ? '#548F53' : '#F4F3F0'}
                      />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text className="text-center text-gray-400 italic py-6">
                  Add smart devices to this room first to link them!
                </Text>
              )}
            </ScrollView>

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setIsManageModalVisible(false)}
                className="w-[48%] py-3 bg-[#F1F3EA] rounded-full items-center"
              >
                <Text className="text-[#354F52] font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveLinks}
                disabled={isSavingLinks}
                className="w-[48%] py-3 bg-[#548F53] rounded-full items-center flex-row justify-center"
              >
                {isSavingLinks ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                    Save Links
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
