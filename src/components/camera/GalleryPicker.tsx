import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

type GalleryPickerProps = {
  onImageSelected: (uri: string) => void;
};

export function GalleryPicker({ onImageSelected }: GalleryPickerProps) {
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    loadLastPhoto();
  }, []);

  const loadLastPhoto = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return;

      const { assets } = await MediaLibrary.getAssetsAsync({
        first: 1,
        mediaType: 'photo',
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      if (assets.length > 0) {
        setLastPhotoUri(assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to load last photo:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={pickImage} activeOpacity={0.7}>
      {lastPhotoUri ? (
        <Image source={{ uri: lastPhotoUri }} style={styles.thumbnail} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>📷</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 20,
  },
});
