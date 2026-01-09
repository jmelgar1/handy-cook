import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

type ScanMode = 'barcode' | 'camera';

export default function ScanScreen() {
  const [scanMode, setScanMode] = useState<ScanMode>('barcode');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, scanMode === 'barcode' && styles.modeButtonActive]}
          onPress={() => setScanMode('barcode')}
        >
          <Text style={[styles.modeButtonText, scanMode === 'barcode' && styles.modeButtonTextActive]}>
            Barcode
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, scanMode === 'camera' && styles.modeButtonActive]}
          onPress={() => setScanMode('camera')}
        >
          <Text style={[styles.modeButtonText, scanMode === 'camera' && styles.modeButtonTextActive]}>
            Camera
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.scannerPlaceholder}>
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.scannerText}>
          {scanMode === 'barcode'
            ? 'Point at a barcode to scan'
            : 'Take a photo of your food'}
        </Text>
        <Text style={styles.scannerSubtext}>
          Camera permissions required
        </Text>
      </View>

      <View style={styles.recentScans}>
        <Text style={styles.sectionTitle}>Recent Scans</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyText}>No items scanned yet</Text>
          <Text style={styles.emptySubtext}>
            Scan food items to add them to your pantry
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.scanButton}>
        <Text style={styles.scanButtonText}>
          {scanMode === 'barcode' ? 'Scan Barcode' : 'Take Photo'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  modeToggle: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#22c55e',
  },
  modeButtonText: {
    color: '#9ca3af',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  scannerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    marginBottom: 24,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#22c55e',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  scannerSubtext: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 8,
  },
  recentScans: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 180,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4,
  },
  scanButton: {
    backgroundColor: '#22c55e',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
