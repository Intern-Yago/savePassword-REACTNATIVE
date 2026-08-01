import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TouchableOpacity, TextInput } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard";
import useStorage from '../../hooks/useStorage';
import { calculatePasswordStrength } from "../../utils/security";
import { SavedPassword } from "../../types/password";

interface ModalPasswordProps {
  password: string;
  handleClose: () => void;
  onSavedSuccess?: () => void;
  onCopySuccess?: () => void;
}

export function ModalPassword({ password, handleClose, onSavedSuccess, onCopySuccess }: ModalPasswordProps) {
  const { saveItem } = useStorage();
  const [title, setTitle] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const strengthInfo = calculatePasswordStrength(password);

  const handleCopyPassword = async () => {
    await Clipboard.setStringAsync(password);
    if (onCopySuccess) onCopySuccess();
  };

  const handleSavePassword = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const defaultTitle = title.trim() || 'Nova Senha';
      const newItem: SavedPassword = {
        id: `pwd_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        title: defaultTitle,
        password: password,
        length: password.length,
        strength: strengthInfo.strength,
        createdAt: new Date().toISOString(),
        totpSecret: totpSecret.trim() ? totpSecret.trim() : undefined,
      };

      await saveItem('@pass', newItem);
      if (onSavedSuccess) onSavedSuccess();
      handleClose();
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialIcons name="lock" size={24} color="#392de9" />
          <Text style={styles.title}>Senha Gerada</Text>
        </View>

        {/* Strength Indicator */}
        <View style={styles.strengthContainer}>
          <View style={styles.strengthHeader}>
            <Text style={styles.strengthLabel}>Força da Senha:</Text>
            <Text style={[styles.strengthBadge, { color: strengthInfo.color }]}>
              {strengthInfo.label} ({strengthInfo.score}%)
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

        {/* Title Input */}
        <Text style={styles.inputLabel}>Título / Identificador (opcional):</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: GitHub, Email, Instagram..."
          placeholderTextColor="#6C6C8A"
          value={title}
          onChangeText={setTitle}
          maxLength={30}
        />

        {/* 2FA Secret Key Input */}
        <Text style={styles.inputLabel}>Chave Secreta 2FA / Autenticador (opcional):</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: JBSWY3DPEHPK3PXP ou URL otpauth://"
          placeholderTextColor="#6C6C8A"
          value={totpSecret}
          onChangeText={setTotpSecret}
          autoCapitalize="characters"
        />

        {/* Password Display Box */}
        <View style={styles.innerPassword}>
          <Text style={styles.passwordText} numberOfLines={2}>
            {isVisible ? password : '•'.repeat(password.length)}
          </Text>
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setIsVisible(!isVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons
              name={isVisible ? "visibility-off" : "visibility"}
              size={22}
              color="#A0A0B2"
            />
          </TouchableOpacity>
        </View>

        <Pressable style={styles.copyQuickBtn} onPress={handleCopyPassword}>
          <MaterialIcons name="content-copy" size={16} color="#392de9" />
          <Text style={styles.copyQuickText}>Copiar para a área de transferência</Text>
        </Pressable>

        {/* Action Buttons */}
        <View style={styles.buttonArea}>
          <TouchableOpacity style={styles.buttonCancel} onPress={handleClose}>
            <Text style={styles.buttonCancelText}>Voltar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonSave, isSaving && { opacity: 0.7 }]}
            onPress={handleSavePassword}
            disabled={isSaving}
          >
            <MaterialIcons name="bookmark" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.buttonSaveText}>
              {isSaving ? 'Salvando...' : 'Salvar Senha'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(10, 10, 16, 0.75)",
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    backgroundColor: "#1E1E2C",
    width: "100%",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A3C',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: "#FFFFFF",
    marginLeft: 8,
  },
  strengthContainer: {
    marginBottom: 16,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  strengthLabel: {
    color: '#A0A0B2',
    fontSize: 12,
  },
  strengthBadge: {
    fontSize: 12,
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
  inputLabel: {
    color: '#A0A0B2',
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#12121A',
    color: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#2A2A3C',
    marginBottom: 12,
  },
  innerPassword: {
    backgroundColor: "#12121A",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#392de940',
    marginTop: 4,
  },
  passwordText: {
    color: "#00FFAD",
    fontSize: 16,
    fontFamily: 'SpaceMono',
    flex: 1,
    marginRight: 8,
  },
  eyeBtn: {
    padding: 4,
  },
  copyQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 6,
  },
  copyQuickText: {
    color: '#392de9',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  buttonArea: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  buttonCancel: {
    flex: 1,
    alignItems: "center",
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2A2A3C',
  },
  buttonCancelText: {
    color: '#A0A0B2',
    fontWeight: '600',
    fontSize: 15,
  },
  buttonSave: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#392de9",
    borderRadius: 10,
    paddingVertical: 12,
  },
  buttonSaveText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 15,
  },
});