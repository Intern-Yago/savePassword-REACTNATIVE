import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (data: { secret: string; title?: string }) => void;
}

export function QRScannerModal({ visible, onClose, onScanSuccess }: QRScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!visible) return null;

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics fallback
    }

    let secret = data.trim();
    let title: string | undefined = undefined;

    // Parse otpauth://totp/Issuer:account?secret=JBSWY3DPEHPK3PXP&issuer=Issuer
    if (secret.startsWith('otpauth://')) {
      try {
        const urlObj = new URL(secret);
        const secretParam = urlObj.searchParams.get('secret');
        if (secretParam) secret = secretParam;

        const issuerParam = urlObj.searchParams.get('issuer');
        let label = urlObj.pathname.replace(/^\/\/?(totp|hotp)\//i, '');
        if (label.includes(':')) {
          const parts = label.split(':');
          title = issuerParam || parts[0] || parts[1];
        } else if (label) {
          title = issuerParam || label;
        } else if (issuerParam) {
          title = issuerParam;
        }

        if (title) {
          title = decodeURIComponent(title);
        }
      } catch {
        // Fallback regex if URL parsing fails
        const secretMatch = secret.match(/secret=([A-Za-z2-7]+)/i);
        if (secretMatch) secret = secretMatch[1];
      }
    }

    onScanSuccess({ secret, title });
    setScanned(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {!permission ? (
          <View style={styles.permissionBox}>
            <Text style={styles.text}>Solicitando permissão da câmera...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionBox}>
            <MaterialIcons name="videocam-off" size={64} color="#E74C3C" style={{ marginBottom: 16 }} />
            <Text style={styles.permissionTitle}>Permissão da Câmera Necessária</Text>
            <Text style={styles.permissionSub}>
              Precisamos de acesso à câmera para escanear os QR Codes dos seus autenticadores 2FA.
            </Text>
            <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
              <Text style={styles.grantBtnText}>Conceder Permissão</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraWrapper}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            {/* Overlay Viewfinder Target */}
            <View style={styles.overlay}>
              <View style={styles.topOverlay}>
                <Text style={styles.instructionText}>Posicione o QR Code no centro</Text>
              </View>

              <View style={styles.middleRow}>
                <View style={styles.sideOverlay} />
                <View style={styles.viewfinder}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <View style={styles.sideOverlay} />
              </View>

              <View style={styles.bottomOverlay}>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <MaterialIcons name="close" size={24} color="#FFF" />
                  <Text style={styles.closeBtnText}>Fechar Câmera</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F17',
  },
  cameraWrapper: {
    flex: 1,
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#0F0F17',
  },
  permissionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSub: {
    color: '#A0A0B2',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  grantBtn: {
    backgroundColor: '#392de9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  grantBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelBtn: {
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: '#A0A0B2',
    fontSize: 14,
  },
  text: {
    color: '#FFF',
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 16, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(30, 30, 44, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  middleRow: {
    flexDirection: 'row',
    height: 260,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 16, 0.7)',
  },
  viewfinder: {
    width: 260,
    height: 260,
    borderRadius: 16,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#392de9',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  bottomOverlay: {
    flex: 1.5,
    backgroundColor: 'rgba(10, 10, 16, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  closeBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
});
