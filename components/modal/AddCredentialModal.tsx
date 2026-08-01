import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import useStorage from '../../hooks/useStorage';
import { calculatePasswordStrength, generateSecurePassword } from '../../utils/security';
import { SavedPassword } from '../../types/password';
import { QRScannerModal } from './QRScannerModal';

interface AddCredentialModalProps {
  visible: boolean;
  onClose: () => void;
  onSavedSuccess?: () => void;
}

export function AddCredentialModal({ visible, onClose, onSavedSuccess }: AddCredentialModalProps) {
  const { saveItem } = useStorage();
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isQrScannerVisible, setIsQrScannerVisible] = useState(false);

  if (!visible) return null;

  const handleGenerateQuickPassword = () => {
    const quickPassword = generateSecurePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: false,
    });
    setPassword(quickPassword);
  };

  const handleSave = async () => {
    if (!title.trim() && !password.trim() && !totpSecret.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const itemTitle = title.trim() || 'Nova Credencial';
      const itemPassword = password || '';
      const strInfo = calculatePasswordStrength(itemPassword);

      const newItem: SavedPassword = {
        id: `pwd_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        title: itemTitle,
        password: itemPassword,
        length: itemPassword.length,
        strength: strInfo.strength,
        createdAt: new Date().toISOString(),
        totpSecret: totpSecret.trim() ? totpSecret.trim() : undefined,
      };

      await saveItem('@pass', newItem);
      if (onSavedSuccess) onSavedSuccess();
      handleResetAndClose();
    } catch (err) {
      console.error('Erro ao salvar credencial:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAndClose = () => {
    setTitle('');
    setPassword('');
    setTotpSecret('');
    onClose();
  };

  const handleScanResult = (result: { secret: string; title?: string }) => {
    setTotpSecret(result.secret);
    if (result.title && !title) {
      setTitle(result.title);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalBg}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
            <View style={styles.header}>
              <MaterialIcons name="add-circle" size={28} color="#392de9" />
              <Text style={styles.headerTitle}>Adicionar Credencial / 2FA</Text>
            </View>

            {/* Title / Service Name */}
            <Text style={styles.label}>Título / Nome do Serviço *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: GitHub, Google, Instagram, Banco..."
              placeholderTextColor="#6C6C8A"
              value={title}
              onChangeText={setTitle}
              maxLength={35}
            />

            {/* 2FA Secret Key + QR Camera Scanner Button */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>Chave Secreta 2FA / Autenticador (opcional)</Text>
            </View>

            <View style={styles.totpInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                placeholder="Ex: JBSWY3DPEHPK3PXP"
                placeholderTextColor="#6C6C8A"
                value={totpSecret}
                onChangeText={setTotpSecret}
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={styles.qrScanBtn}
                onPress={() => setIsQrScannerVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="qr-code-scanner" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.qrScanFullBtn}
              onPress={() => setIsQrScannerVisible(true)}
            >
              <MaterialIcons name="camera-alt" size={18} color="#392de9" style={{ marginRight: 6 }} />
              <Text style={styles.qrScanFullText}>Escanear QR Code com a Câmera</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Password Input + Quick Generate */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>Senha (opcional)</Text>
              <TouchableOpacity onPress={handleGenerateQuickPassword}>
                <Text style={styles.generateQuickText}>+ Gerar Senha Forte</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Digite a senha..."
              placeholderTextColor="#6C6C8A"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={false}
            />

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleResetAndClose}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <MaterialIcons name="check" size={20} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      <QRScannerModal
        visible={isQrScannerVisible}
        onClose={() => setIsQrScannerVisible(false)}
        onScanSuccess={handleScanResult}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 16, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#1E1E2C',
    width: '100%',
    maxHeight: '90%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 19,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  label: {
    color: '#A0A0B2',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#12121A',
    color: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2A2A3C',
    marginBottom: 14,
  },
  totpInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrScanBtn: {
    backgroundColor: '#392de9',
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrScanFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141420',
    borderWidth: 1,
    borderColor: '#392de940',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  qrScanFullText: {
    color: '#392de9',
    fontWeight: 'bold',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A3C',
    marginVertical: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  generateQuickText: {
    color: '#392de9',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#2A2A3C',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#A0A0B2',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: '#392de9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
