import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaskedView from '@react-native-masked-view/masked-view'; // <--- IMPORTANTE
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image, // <--- Adicionado
  Platform,
  ScrollView,
  StyleSheet, // <--- Adicionado
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- IMPORTAR DADOS E TIPOS ---
import {
  ACTIVITIES,
  Activity,
  Content,
  CONTENTS,
  Scenario,
  ScenarioDeviceState,
  SCENARIOS,
} from '@/constants/data';

// --- IMPORTAR DISPOSITIVOS ---
import { DeviceType, SMART_HOME_DEVICES } from '@/constants/devices';

// Helper para mapear tipo de dispositivo para ícone
const getDeviceIcon = (type: DeviceType, color: string) => {
  switch (type) {
    case 'light':
      return <MaterialIcons name="lightbulb-outline" size={20} color={color} />;
    case 'thermostat':
      return (
        <MaterialCommunityIcons name="thermometer" size={20} color={color} />
      );
    case 'speaker':
      return <MaterialIcons name="speaker" size={20} color={color} />;
    case 'blind':
      return <MaterialCommunityIcons name="blinds" size={20} color={color} />;
    case 'diffuser':
      return (
        <MaterialCommunityIcons name="air-humidifier" size={20} color={color} />
      );
    case 'purifier':
      return (
        <MaterialCommunityIcons name="air-filter" size={20} color={color} />
      );
    default:
      return <Feather name="cpu" size={20} color={color} />;
  }
};

export default function ActivityDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [mainItem, setMainItem] = useState<Activity | Scenario | null>(null);
  const [relatedScenario, setRelatedScenario] = useState<Scenario | null>(null);
  const [relatedContent, setRelatedContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);

  const isActivity = mainItem ? 'type' in mainItem : false;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let foundActivity = ACTIVITIES.find((a) => a.id === id);

      if (!foundActivity) {
        const stored = await AsyncStorage.getItem('@myActivities');
        if (stored) {
          const userActivities: Activity[] = JSON.parse(stored);
          foundActivity = userActivities.find((a) => a.id === id);
        }
      }

      if (foundActivity) {
        setMainItem(foundActivity);
        if (foundActivity.scenarioId) {
          const scen = SCENARIOS.find((s) => s.id === foundActivity.scenarioId);
          setRelatedScenario(scen || null);
        }
        if (foundActivity.contentId) {
          const cont = CONTENTS[foundActivity.contentId];
          setRelatedContent(cont || null);
        }
      } else {
        const foundScenario = SCENARIOS.find((s) => s.id === id);
        if (foundScenario) {
          setMainItem(foundScenario);
          setRelatedScenario(foundScenario);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F0F2EB]">
        <ActivityIndicator size="large" color="#548F53" />
      </View>
    );
  }

  if (!mainItem) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F0F2EB]">
        <Text>Item not found</Text>
      </View>
    );
  }

  const imageSource =
    typeof mainItem.image === 'string'
      ? { uri: mainItem.image }
      : mainItem.image;

  const devicesToShow: ScenarioDeviceState[] =
    relatedScenario?.devices || (mainItem as Scenario).devices || [];

  // --- NOVA LÓGICA DE ÁUDIO ---
  // 1. Procura se há algum speaker na lista de dispositivos deste cenário
  const activeSpeakerConfig = devicesToShow.find((config) => {
    const device = SMART_HOME_DEVICES[config.deviceId];
    return device?.type === 'speaker';
  });

  // 2. Define o texto a mostrar
  const audioStatusText = activeSpeakerConfig
    ? `Playlist will be played on ${SMART_HOME_DEVICES[activeSpeakerConfig.deviceId].name}` // Caso tenha speaker
    : 'Playlist will be played';

  const instructions = relatedContent?.instructions || [];
  const ingredients =
    relatedContent?.type === 'recipe' ? relatedContent.ingredients : [];
  const displayTime = isActivity
    ? relatedContent?.duration || 'Duration N/A'
    : null;

  return (
    <View className="flex-1 bg-[#F0F2EB]">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* --- HEADER COM EFEITO BLUR FADE --- */}
        <View className="w-full h-[450px] relative ">
          <View style={StyleSheet.absoluteFill}>
            <Image
              source={imageSource}
              // Forçamos a largura e altura totais
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              blurRadius={Platform.OS === 'ios' ? 70 : 50}
            />
            <View className="absolute inset-0" />
          </View>

          {/* CAMADA 2: Imagem Nítida com Máscara */}
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={
              <LinearGradient
                colors={['black', 'black', 'transparent']}
                locations={[0, 0.1, 0.7]}
                style={StyleSheet.absoluteFill}
              />
            }
          >
            <Image
              source={imageSource}
              // Forçamos a largura e altura totais aqui também
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover" // Crucial para não ficar pequena
            />
          </MaskedView>

          {/* CAMADA 3: Gradiente de Leitura (Overlay) */}
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* CAMADA 4: Texto e Botões */}
          <SafeAreaView style={StyleSheet.absoluteFill} edges={['top']}>
            {/* Top Bar */}
            <View className="flex-row justify-between items-center px-5 pt-2">
              {/* Botão Voltar (Esquerda) */}
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={28} color="white" />
              </TouchableOpacity>

              {/* Botão 3 Pontos (Direita) */}
              <TouchableOpacity onPress={() => console.log('Opções clicadas')}>
                <MaterialIcons name="more-vert" size={28} color="white" />
              </TouchableOpacity>
            </View>

            <View className="absolute bottom-10 px-6 w-full">
              <Text
                className="text-white text-xl tracking-wider capitalize mb-2 overflow-hidden"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                {isActivity ? (mainItem as Activity).type : 'Scenario'}
              </Text>

              <Text
                className="text-white text-4xl mt-1 shadow-sm"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                {mainItem.title}
              </Text>

              <View className="flex-row items-center mt-6 space-x-6">
                {isActivity && displayTime && (
                  <View className="flex-row items-center mr-4">
                    <Ionicons name="time-outline" size={22} color="white" />
                    <Text
                      className="text-white ml-2 text-lg"
                      style={{ fontFamily: 'Nunito_600SemiBold' }}
                    >
                      {displayTime}
                    </Text>
                  </View>
                )}
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="door" size={22} color="white" />
                  <Text
                    className="text-white ml-2 text-lg"
                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                  >
                    {mainItem.room}
                  </Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* --- RESTO DO CONTEÚDO DA PÁGINA --- */}
        <View className="px-6 pt-8">
          {/* SECÇÃO: DISPOSITIVOS */}
          {/* SECÇÃO: DISPOSITIVOS */}
          {devicesToShow.length > 0 && (
            <View className="mb-8">
              <Text
                className="text-[#354F52] text-xl mb-3"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Selected Devices
              </Text>

              {/* PAI: Define o layout flexível e o espaçamento (gap) */}
              <View className="flex-row flex-wrap gap-3">
                {devicesToShow.map((config, i) => {
                  const realDevice = SMART_HOME_DEVICES[config.deviceId];
                  if (!realDevice) return null;

                  const isLight = realDevice.type === 'light';
                  const isColorValue =
                    typeof config.value === 'string' &&
                    config.value.trim().startsWith('#');
                  const hasDetails = !!config.value;

                  return (
                    <View
                      key={i}
                      // AQUI ESTÁ O SEGREDO:
                      // w-[48%]: 48% + 48% + gap = ~100% (Cabe numa linha)
                      // grow: Se o card ficar sozinho na linha, estica para 100%
                      className="w-[48%] grow flex-row items-center px-3 py-3 rounded-xl border border-[#548f537f]"
                    >
                      {getDeviceIcon(realDevice.type, '#548F53')}

                      <View className="ml-3 justify-center flex-1">
                        <Text
                          className={`text-[#354F52] text-sm capitalise ${
                            hasDetails ? 'mb-0.5' : 'mb-0'
                          }`}
                          style={{ fontFamily: 'Nunito_700Bold' }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {realDevice.name}
                        </Text>

                        {hasDetails && (
                          <View className="flex-row items-center">
                            {isLight && isColorValue ? (
                              <>
                                <View
                                  style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: 7,
                                    backgroundColor: config.value as string,
                                    borderWidth: 1,
                                    borderColor: '#E5E5E5',
                                    marginRight: 6,
                                  }}
                                />
                                <Text
                                  className="text-[#548F53] text-sm"
                                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                                >
                                  {config.brightness || '100%'}
                                </Text>
                              </>
                            ) : (
                              <Text
                                className="text-[#548F53] text-sm"
                                style={{ fontFamily: 'Nunito_600SemiBold' }}
                              >
                                {config.value}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* DESCRIÇÃO */}
          <View className="mb-8">
            <Text
              className="text-[#354F52] text-xl mb-2"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Description
            </Text>
            <Text
              className="text-[#586963] text-[16px] leading-6"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              {mainItem.description}
            </Text>
          </View>

          {/* MEDIA */}
          {(relatedScenario?.playlist || relatedContent?.videoUrl) && (
            <View className="mb-8">
              <Text
                className="text-[#354F52] text-xl mb-3"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Selected Playlist
              </Text>
              <View className="flex-row items-center justify-between bg-[#F0F2EB] border border-[#548f537f] p-4 rounded-2xl">
                <View className="flex-1 pr-2">
                  <Text
                    className="text-[#354F52] text-lg"
                    numberOfLines={1}
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {relatedScenario?.playlist ||
                      relatedContent?.title ||
                      'Relaxing Sounds'}
                  </Text>
                  <Text
                    className="text-[#6A7D5B] text-xs mt-1"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {audioStatusText}
                  </Text>
                </View>
                <View className="bg-[#548F53] p-2 rounded-full">
                  <Ionicons name="musical-notes" size={24} color="white" />
                </View>
              </View>
            </View>
          )}

          {/* INGREDIENTES */}
          {ingredients && ingredients.length > 0 && (
            <View className="mb-8">
              <Text
                className="text-[#354F52] text-xl mb-3"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Ingredients
              </Text>
              <View className=" rounded-2xl p-4 border border-[#548f537f]">
                {ingredients.map((ing, i) => (
                  <View
                    key={i}
                    className="flex-row justify-between py-2 border-b border-[#d5d5d5] last:border-0"
                  >
                    <Text
                      className="text-[#354F52] "
                      style={{ fontFamily: 'Nunito_600SemiBold' }}
                    >
                      {ing.item}
                    </Text>
                    <Text
                      className="text-[#548F53]"
                      style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                      {ing.amount}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* INSTRUÇÕES */}
          {/* INSTRUÇÕES */}
          {instructions.length > 0 && (
            <View className="mb-4">
              <Text
                className="text-[#354F52] text-xl mb-4"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Instructions
              </Text>
              {instructions.map((step, i) => (
                <View key={i} className="flex-row mb-4">
                  {/* BOLINHA NUMERADA */}
                  {/* Removi o 'mt-0.5' daqui para simplificar o cálculo */}
                  <View className="bg-[#BBE6BA] w-8 h-8 rounded-full items-center justify-center mr-3">
                    <Text
                      className="text-[#354F52]"
                      style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                      {i + 1}
                    </Text>
                  </View>

                  {/* TEXTO DA INSTRUÇÃO */}
                  {/* Adicionei 'mt-1' (4px) para centrar perfeitamente a linha de 24px com a bola de 32px */}
                  <Text
                    className="text-[#354F52] text-[16px] flex-1 leading-6 mt-1"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* START BTN */}
      <View className="absolute bottom-10 left-0 right-0 items-center px-4">
        <TouchableOpacity
          activeOpacity={0.9}
          className="bg-[#548F53] w-52 py-4 rounded-full flex-row items-center justify-center shadow-lg shadow-[#548F53]/40"
          onPress={() =>
            router.push({
              pathname: '/LoadingActivity',
              params: {
                id: mainItem.id,
                title: mainItem.title,
                type: isActivity ? 'activity' : 'scenario',
              },
            })
          }
        >
          <Text
            className="text-white text-2xl mr-2"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            {isActivity ? 'Start Activity' : 'Activate Scenario'}
          </Text>
          <Ionicons
            name={isActivity ? 'play' : 'power'}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
