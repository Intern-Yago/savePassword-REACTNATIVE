import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { ModalPassword } from '@/components/modal';
import { Toast } from '@/components/ui/Toast';
import { generateSecurePassword, calculatePasswordStrength } from '@/utils/security';
import { PasswordGeneratorOptions } from '@/types/password';

export default function Home() {
  const [size, setSize] = useState<number>(16);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState<boolean>(false);

  const [passwordValue, setPasswordValue] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const options: PasswordGeneratorOptions = useMemo(
    () => ({
      length: size,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
      excludeAmbiguous,
    }),
    [size, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeAmbiguous]
  );

  // Live strength preview based on current options
  const previewPassword = useMemo(() => {
    return generateSecurePassword(options);
  }, [options]);

  const strengthInfo = useMemo(() => {
    return calculatePasswordStrength(previewPassword);
  }, [previewPassword]);

  const handleGeneratePassword = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics fallback on web/unsupported platforms
    }

    const newPassword = generateSecurePassword(options);
    setPasswordValue(newPassword);
    setModalVisible(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.mainContainer}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="shield" size={40} color="#392de9" />
        </View>
        <Text style={styles.headerTitle}>SavePassword</Text>
        <Text style={styles.headerSubtitle}>Gerador Seguro de Senhas Fortes</Text>
      </View>

      {/* Main Generator Card */}
      <View style={styles.card}>
        <View style={styles.lengthHeader}>
          <Text style={styles.cardTitle}>Tamanho da Senha</Text>
          <Text style={styles.lengthBadge}>{size} caracteres</Text>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={6}
          maximumValue={32}
          step={1}
          maximumTrackTintColor="#2A2A3C"
          minimumTrackTintColor="#392de9"
          thumbTintColor="#392de9"
          value={size}
          onValueChange={(val) => setSize(Math.round(val))}
        />

        {/* Live Strength Meter */}
        <View style={styles.strengthBox}>
          <View style={styles.strengthRow}>
            <Text style={styles.strengthLabel}>Estimativa de Segurança:</Text>
            <Text style={[styles.strengthValue, { color: strengthInfo.color }]}>
              {strengthInfo.label}
            </Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.bar,
                { width: `${Math.max(10, strengthInfo.score)}%`, backgroundColor: strengthInfo.color },
              ]}
            />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Option Toggles */}
        <Text style={styles.optionsHeader}>Caracteres Incluídos</Text>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Maiúsculas (A-Z)</Text>
          <Switch
            value={includeUppercase}
            onValueChange={setIncludeUppercase}
            trackColor={{ false: '#2A2A3C', true: '#392de9' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Minúsculas (a-z)</Text>
          <Switch
            value={includeLowercase}
            onValueChange={setIncludeLowercase}
            trackColor={{ false: '#2A2A3C', true: '#392de9' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Números (0-9)</Text>
          <Switch
            value={includeNumbers}
            onValueChange={setIncludeNumbers}
            trackColor={{ false: '#2A2A3C', true: '#392de9' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Símbolos (!@#$%...)</Text>
          <Switch
            value={includeSymbols}
            onValueChange={setIncludeSymbols}
            trackColor={{ false: '#2A2A3C', true: '#392de9' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.optionRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.optionLabel}>Evitar caracteres ambíguos</Text>
            <Text style={styles.optionSubtext}>(1, l, I, 0, O, o)</Text>
          </View>
          <Switch
            value={excludeAmbiguous}
            onValueChange={setExcludeAmbiguous}
            trackColor={{ false: '#2A2A3C', true: '#392de9' }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      {/* Generate Button */}
      <TouchableOpacity style={styles.button} onPress={handleGeneratePassword} activeOpacity={0.85}>
        <MaterialIcons name="vpn-key" size={22} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>Gerar Senha Segura</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <ModalPassword
          password={passwordValue}
          handleClose={() => setModalVisible(false)}
          onSavedSuccess={() => showToast('Senha salva com sucesso!', 'success')}
          onCopySuccess={() => showToast('Senha copiada para a área de transferência!', 'info')}
        />
      </Modal>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0F0F17',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E1E2C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#392de940',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#A0A0B2',
    marginTop: 4,
  },
  card: {
    width: '100%',
    backgroundColor: '#1E1E2C',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A3C',
    marginBottom: 20,
  },
  lengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lengthBadge: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#392de9',
    backgroundColor: '#392de920',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  strengthBox: {
    marginTop: 10,
    marginBottom: 16,
  },
  strengthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  strengthLabel: {
    color: '#A0A0B2',
    fontSize: 13,
  },
  strengthValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  track: {
    height: 6,
    backgroundColor: '#12121A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A3C',
    marginVertical: 14,
  },
  optionsHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  optionLabel: {
    color: '#D1D1E0',
    fontSize: 14,
  },
  optionSubtext: {
    color: '#6C6C8A',
    fontSize: 11,
  },
  button: {
    backgroundColor: '#392de9',
    width: '100%',
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    shadowColor: '#392de9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
