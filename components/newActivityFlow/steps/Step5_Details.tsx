import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StepWrapper } from '../StepWrapper';

interface Step5Props {
  name: string;
  setName: (t: string) => void;
  desc: string;
  setDesc: (t: string) => void;
  image: any;
  setImage: (img: any) => void;
  defaultImage: any;
}

export const Step5_Details = ({
  name,
  setName,
  desc,
  setDesc,
  image,
  setImage,
  defaultImage,
}: Step5Props) => {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Gallery permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleResetImage = () => {
    setImage(defaultImage);
  };

  const hasChangedImage = image !== defaultImage;

  const imageSource = typeof image === 'string' ? { uri: image } : image;

  return (
    <StepWrapper
      title="Last details"
      subtitle="Select an image, name and description for the activity."
    >
      <Text
        maxFontSizeMultiplier={1.2}
        className="text-lg text-[#2F4F4F] mb-2 mt-2.5"
        style={{ fontFamily: 'Nunito_700Bold' }}
        importantForAccessibility="no"
      >
        Image
      </Text>

      <View
        className="w-full aspect-square bg-[#C8E2C8] rounded-3xl justify-center items-center overflow-hidden border border-[#DDE5D7]"
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel={
          image ? 'Selected activity cover image' : 'No image selected'
        }
      >
        {image ? (
          <Image
            source={imageSource}
            className="w-full h-full"
            resizeMode="cover"
            importantForAccessibility="no"
          />
        ) : (
          <MaterialIcons
            name="image"
            size={60}
            color="#354F52"
            importantForAccessibility="no"
          />
        )}
      </View>

      <View className="mt-4 mb-6 flex-row justify-center items-center gap-3">
        <TouchableOpacity
          onPress={pickImage}
          className="bg-[#E8F3E8] px-4 py-2.5 rounded-xl border border-[#C8E2C8] flex-row items-center"
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Change image"
          accessibilityHint="Opens your device gallery to select a new cover image"
        >
          <View
            importantForAccessibility="no"
            accessibilityElementsHidden={true}
          >
            <MaterialIcons name="edit" size={16} color="#548F53" />
          </View>
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-[#548F53] text-sm ml-2"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            Change image
          </Text>
        </TouchableOpacity>

        {hasChangedImage && defaultImage && (
          <TouchableOpacity
            onPress={handleResetImage}
            className="bg-[#FFE5E5] px-4 py-2.5 rounded-xl border border-[#FFC8C8] flex-row items-center"
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Reset image"
            accessibilityHint="Reverts to the default activity image"
          >
            <View
              importantForAccessibility="no"
              accessibilityElementsHidden={true}
            >
              <Ionicons name="refresh" size={16} color="#D32F2F" />
            </View>

            <Text
              maxFontSizeMultiplier={1.2}
              className="text-[#D32F2F] text-sm ml-2"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Reset
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text
        maxFontSizeMultiplier={1.2}
        className="text-lg text-[#2F4F4F] mb-2"
        style={{ fontFamily: 'Nunito_700Bold' }}
        importantForAccessibility="no"
      >
        Activity Name
      </Text>
      <TextInput
        maxFontSizeMultiplier={1.2}
        placeholder=""
        className="bg-[#F1F5F0] rounded-2xl p-4 text-base border border-[#DDE5D7] mb-4"
        style={{ fontFamily: 'Nunito_400Regular' }}
        value={name}
        onChangeText={setName}
        accessibilityLabel="Activity Name, required field"
      />

      <Text
        maxFontSizeMultiplier={1.2}
        className="text-lg text-[#2F4F4F] mb-2"
        style={{ fontFamily: 'Nunito_700Bold' }}
        importantForAccessibility="no"
      >
        Description
      </Text>
      <TextInput
        maxFontSizeMultiplier={1.2}
        placeholder=""
        className="bg-[#F1F5F0] rounded-2xl p-4 text-base border border-[#DDE5D7] h-[120px]"
        style={{ fontFamily: 'Nunito_400Regular', textAlignVertical: 'top' }}
        multiline
        value={desc}
        onChangeText={setDesc}
        accessibilityLabel="Activity Description, required field"
      />
    </StepWrapper>
  );
};
