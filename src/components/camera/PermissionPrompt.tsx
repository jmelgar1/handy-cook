import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Linking } from 'react-native';

type PermissionPromptProps = {
  type: 'camera' | 'microphone' | 'both';
  onRequestPermission: () => void;
};

export function PermissionPrompt({ type, onRequestPermission }: PermissionPromptProps) {
  const getTitle = () => {
    switch (type) {
      case 'camera':
        return 'Camera Access Required';
      case 'microphone':
        return 'Microphone Access Required';
      case 'both':
        return 'Camera & Microphone Access Required';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'camera':
        return 'HandyCook needs access to your camera to scan food items and barcodes.';
      case 'microphone':
        return 'HandyCook needs microphone access to record videos with audio.';
      case 'both':
        return 'HandyCook needs camera and microphone access to scan food items and record videos.';
    }
  };

  const getEmoji = () => {
    switch (type) {
      case 'camera':
        return '📷';
      case 'microphone':
        return '🎤';
      case 'both':
        return '📹';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{getEmoji()}</Text>
      <Text style={styles.title}>{getTitle()}</Text>
      <Text style={styles.description}>{getDescription()}</Text>

      <TouchableOpacity style={styles.button} onPress={onRequestPermission} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Grant Permission</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => Linking.openSettings()}
        activeOpacity={0.8}
      >
        <Text style={styles.settingsButtonText}>Open Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#AA4A44',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  settingsButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  settingsButtonText: {
    color: '#AA4A44',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
