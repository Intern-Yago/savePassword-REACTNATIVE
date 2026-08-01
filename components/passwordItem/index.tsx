import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard";
import { SavedPassword } from "../../types/password";
import { generateTOTP, TOTPResult } from "../../utils/totp";

interface PasswordItemProps {
  data: SavedPassword;
  removePassword: () => void;
  onCopySuccess?: (text: string) => void;
}

export default function PasswordItem({ data, removePassword, onCopySuccess }: PasswordItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [totpInfo, setTotpInfo] = useState<TOTPResult | null>(null);

  // Live TOTP generator timer if totpSecret is present
  useEffect(() => {
    if (!data.totpSecret) {
      setTotpInfo(null);
      return;
    }

    const updateTotp = () => {
      const res = generateTOTP(data.totpSecret!);
      setTotpInfo(res);
    };

    updateTotp();
    const interval = setInterval(updateTotp, 1000);
    return () => clearInterval(interval);
  }, [data.totpSecret]);

  const handleCopyPassword = async () => {
    await Clipboard.setStringAsync(data.password);
    if (onCopySuccess) {
      onCopySuccess('Senha copiada!');
    }
  };

  const handleCopyTotp = async () => {
    if (totpInfo?.code) {
      await Clipboard.setStringAsync(totpInfo.code);
      if (onCopySuccess) {
        onCopySuccess('Código 2FA copiado!');
      }
    }
  };

  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case 'very-strong':
        return { label: 'Excelente', bg: '#1E3A2B', text: '#2ECC71' };
      case 'strong':
        return { label: 'Forte', bg: '#1B3828', text: '#27AE60' };
      case 'medium':
        return { label: 'Média', bg: '#3D3019', text: '#F39C12' };
      default:
        return { label: 'Fraca', bg: '#3D1D1D', text: '#E74C3C' };
    }
  };

  const badge = getStrengthBadge(data.strength);
  const formattedDate = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('pt-BR')
    : '';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="security" size={18} color="#392de9" style={styles.keyIcon} />
          <Text style={styles.titleText} numberOfLines={1}>
            {data.title || 'Senha Salva'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Password Row */}
      <View style={styles.passwordRow}>
        <Text style={styles.passwordText} numberOfLines={1}>
          {isVisible ? data.password : '•'.repeat(Math.min(data.password.length, 16))}
        </Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsVisible(!isVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons
              name={isVisible ? "visibility-off" : "visibility"}
              size={20}
              color="#A0A0B2"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleCopyPassword}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="content-copy" size={20} color="#392de9" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={removePassword}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="delete-outline" size={20} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Live 2FA / TOTP Authenticator Code Box */}
      {totpInfo && (
        <View style={styles.totpContainer}>
          <View style={styles.totpHeader}>
            <View style={styles.totpTag}>
              <MaterialIcons name="vibration" size={14} color="#392de9" style={{ marginRight: 4 }} />
              <Text style={styles.totpTagText}>Código 2FA / Autenticador</Text>
            </View>

            <TouchableOpacity style={styles.copyTotpBtn} onPress={handleCopyTotp}>
              <MaterialIcons name="content-copy" size={14} color="#00FFAD" style={{ marginRight: 4 }} />
              <Text style={styles.copyTotpText}>Copiar 2FA</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.totpCodeRow}>
            <Text style={styles.totpCodeText}>{totpInfo.formattedCode}</Text>
            <Text style={styles.timerText}>{totpInfo.remainingSeconds}s</Text>
          </View>

          {/* 30-Second Live Countdown Bar */}
          <View style={styles.totpProgressTrack}>
            <View
              style={[
                styles.totpProgressBar,
                { width: `${(totpInfo.remainingSeconds / 30) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      {formattedDate ? (
        <Text style={styles.dateText}>Criado em: {formattedDate}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E2C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A3C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  keyIcon: {
    marginRight: 6,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#12121A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  passwordText: {
    color: '#00FFAD',
    fontSize: 15,
    fontFamily: 'SpaceMono',
    flex: 1,
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
    marginLeft: 4,
  },
  totpContainer: {
    backgroundColor: '#141420',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#392de940',
  },
  totpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totpTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totpTagText: {
    color: '#A0A0B2',
    fontSize: 11,
    fontWeight: '600',
  },
  copyTotpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyTotpText: {
    color: '#00FFAD',
    fontSize: 11,
    fontWeight: 'bold',
  },
  totpCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totpCodeText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    letterSpacing: 2,
  },
  timerText: {
    color: '#392de9',
    fontSize: 12,
    fontWeight: 'bold',
  },
  totpProgressTrack: {
    height: 4,
    backgroundColor: '#2A2A3C',
    borderRadius: 2,
    overflow: 'hidden',
  },
  totpProgressBar: {
    height: '100%',
    backgroundColor: '#392de9',
    borderRadius: 2,
  },
  dateText: {
    color: '#6C6C8A',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'right',
  },
});
