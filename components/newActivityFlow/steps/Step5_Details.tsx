import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, Text, TextInput, TouchableOpacity } from 'react-native';
import { StepWrapper } from '../StepWrapper';

interface Step5Props {
  name: string;
  setName: (t: string) => void;
  desc: string;
  setDesc: (t: string) => void;
  image: string | null;
  setImage: (uri: string) => void;
}

export const Step5_Details = ({
  name,
  setName,
  desc,
  setDesc,
  image,
  setImage,
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
      // Mantemos o recorte quadrado
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  return (
    <StepWrapper
      title="Last details"
      subtitle="Select an image, name and description for the activity."
    >
      {/* Label Image */}
      <Text
        className="text-lg text-[#2F4F4F] mb-2 mt-2.5"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        Image
      </Text>

      {/* ALTERAÇÃO PRINCIPAL: 
         - w-full: ocupa a largura toda disponível
         - aspect-square: força a altura a ser igual à largura (ratio 1:1)
      */}
      <TouchableOpacity
        className="w-full aspect-square bg-[#C8E2C8] rounded-2xl justify-center items-center mb-5 overflow-hidden border border-[#DDE5D7]"
        activeOpacity={0.7}
        onPress={pickImage}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <MaterialIcons name="add-photo-alternate" size={60} color="#354F52" />
        )}
      </TouchableOpacity>

      {/* Label Name */}
      <Text
        className="text-lg text-[#2F4F4F] mb-2"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        Activity Name
      </Text>
      <TextInput
        placeholder=""
        className="bg-[#F1F5F0] rounded-2xl p-4 text-base border border-[#DDE5D7] mb-4"
        style={{ fontFamily: 'Nunito_400Regular' }}
        value={name}
        onChangeText={setName}
      />

      {/* Label Description */}
      <Text
        className="text-lg text-[#2F4F4F] mb-2"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        Description
      </Text>
      <TextInput
        placeholder=""
        className="bg-[#F1F5F0] rounded-2xl p-4 text-base border border-[#DDE5D7] h-[120px]"
        style={{ fontFamily: 'Nunito_400Regular', textAlignVertical: 'top' }}
        multiline
        value={desc}
        onChangeText={setDesc}
      />
    </StepWrapper>
  );
};
