import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import useStorage from '../../hooks/useStorage';
import { SavedPassword } from '../../types/password';
import {
  saveToGoogleDriveAppData,
  restoreFromGoogleDriveAppData,
  findGoogleDriveBackup,
  GoogleDriveBackupMeta,
} from '../../utils/googleDrive';

interface GoogleDriveModalProps {
  visible: boolean;
  onClose: () => void;
  passwords: SavedPassword[];
  onRestoredSuccess: (passwords: SavedPassword[]) => void;
  onShowToast: (msg: string) => void;
}

export function GoogleDriveModal({
  visible,
  onClose,
  passwords,
  onRestoredSuccess,
  onShowToast,
}: GoogleDriveModalProps) {
  const { setAllItems, getGoogleClientId, setGoogleClientId } = useStorage();
  const [webClientId, setWebClientId] = useState<string>('');
  const [isEditingClientId, setIsEditingClientId] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [backupMeta, setBackupMeta] = useState<GoogleDriveBackupMeta | null>(null);

  // Load saved Google Web Client ID on mount
  useEffect(() => {
    async function loadClientId() {
      const savedId = await getGoogleClientId();
      if (savedId) {
        setWebClientId(savedId);
        configureGoogleSignin(savedId);
      } else {
        configureGoogleSignin();
      }
    }
    loadClientId();
  }, []);

  const configureGoogleSignin = (clientIdToUse?: string) => {
    try {
      GoogleSignin.configure({
        scopes: ['https://www.googleapis.com/auth/drive.appdata', 'email', 'profile'],
        webClientId: clientIdToUse || 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
        offlineAccess: true,
      });
    } catch (e) {
      console.error('GoogleSignin configure error:', e);
    }
  };

  const handleSaveClientId = async () => {
    if (!webClientId.trim()) {
      Alert.alert('Web Client ID Vazio', 'Informe o seu Web Client ID do Google Cloud Console.');
      return;
    }
    await setGoogleClientId(webClientId.trim());
    configureGoogleSignin(webClientId.trim());
    setIsEditingClientId(false);
    onShowToast('Web Client ID salvo com sucesso!');
  };

  const checkBackup = async (token: string) => {
    setIsLoading(true);
    try {
      const meta = await findGoogleDriveBackup(token);
      setBackupMeta(meta);
    } catch {
      // quiet check
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  const handleNativeGoogleSignIn = async () => {
    if (!webClientId || webClientId.includes('YOUR_')) {
      setIsEditingClientId(true);
      setShowGuide(true);
      Alert.alert(
        'Configurar Web Client ID',
        'Para utilizar o Login Oficial do Google, informe o seu Web Client ID gerado no Google Cloud Console.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      const tokens = await GoogleSignin.getTokens();
      const token = tokens.accessToken;

      setAccessToken(token);
      setUserEmail(response.data?.user.email || 'Conta Google');

      onShowToast('Autenticado com o Google!');
      checkBackup(token);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Operation in progress
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Play Services Indisponível', 'Google Play Services não está disponível no dispositivo.');
      } else {
        Alert.alert('Erro no Login Google', error?.message || 'Falha ao autenticar.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToDrive = async () => {
    if (!accessToken) {
      Alert.alert('Faça Login com o Google', 'Você precisa se conectar à sua conta do Google primeiro.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await saveToGoogleDriveAppData(accessToken, passwords);
      if (res.success) {
        onShowToast(res.message);
        checkBackup(accessToken);
      } else {
        Alert.alert('Erro no Backup', res.message);
      }
    } catch {
      Alert.alert('Erro', 'Falha ao comunicar com o Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    if (!accessToken) {
      Alert.alert('Faça Login com o Google', 'Você precisa se conectar à sua conta do Google primeiro.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await restoreFromGoogleDriveAppData(accessToken);
      if (res.success && res.passwords) {
        await setAllItems(res.passwords);
        onRestoredSuccess(res.passwords);
        onShowToast(res.message);
        onClose();
      } else {
        Alert.alert('Erro na Restauração', res.message);
      }
    } catch {
      Alert.alert('Erro', 'Falha ao restaurar backup da nuvem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      // quiet
    }
    setAccessToken(null);
    setUserEmail(null);
    setBackupMeta(null);
    onShowToast('Desconectado da Conta Google.');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalBg}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
            <View style={styles.header}>
              <MaterialIcons name="cloud-sync" size={32} color="#392de9" />
              <Text style={styles.headerTitle}>Google Sign-In AppData Backup</Text>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialIcons name="security" size={18} color="#2ECC71" style={{ marginRight: 6 }} />
                <Text style={styles.infoTitle}>Backup 100% Oculto no Google Drive</Text>
              </View>
              <Text style={styles.infoText}>
                Utiliza a biblioteca oficial `@react-native-google-signin`. O arquivo fica em uma pasta restrita (`appDataFolder`) **invisível na nuvem comum** e encriptada com **AES-256 de Hardware**.
              </Text>
            </View>

            {/* Web Client ID Config Box */}
            <View style={styles.clientIdBox}>
              <TouchableOpacity
                style={styles.clientIdHeaderRow}
                onPress={() => setIsEditingClientId(!isEditingClientId)}
              >
                <MaterialIcons name="key" size={18} color="#392de9" style={{ marginRight: 6 }} />
                <Text style={styles.clientIdTitle}>
                  {webClientId ? 'Web Client ID (Configurado)' : 'Configurar Web Client ID'}
                </Text>
                <MaterialIcons
                  name={isEditingClientId ? 'expand-less' : 'expand-more'}
                  size={22}
                  color="#A0A0B2"
                />
              </TouchableOpacity>

              {isEditingClientId && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>Cole o seu Web Client ID do Google Cloud Console:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 123456789-abc.apps.googleusercontent.com"
                    placeholderTextColor="#6C6C8A"
                    value={webClientId}
                    onChangeText={setWebClientId}
                    autoCapitalize="none"
                  />

                  <TouchableOpacity style={styles.saveClientIdBtn} onPress={handleSaveClientId}>
                    <Text style={styles.saveClientIdText}>Salvar Client ID</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.guideToggleBtn}
                    onPress={() => setShowGuide(!showGuide)}
                  >
                    <MaterialIcons name="help-outline" size={16} color="#392de9" style={{ marginRight: 4 }} />
                    <Text style={styles.guideToggleText}>
                      {showGuide ? 'Ocultar guia de configuração' : 'Como obter o Client ID e testar na build dev?'}
                    </Text>
                  </TouchableOpacity>

                  {showGuide && (
                    <View style={styles.guideBox}>
                      <Text style={styles.guideTitle}>📋 Passos para Build Dev e Google SSO:</Text>
                      <Text style={styles.guideStep}>
                        1. Acesse <Text style={{ color: '#392de9' }}>console.cloud.google.com</Text> e ative a <Text style={{ color: '#2ECC71' }}>Google Drive API</Text>.
                      </Text>
                      <Text style={styles.guideStep}>
                        2. Crie credenciais do tipo <Text style={{ color: '#FFF' }}>Web Application</Text> e <Text style={{ color: '#FFF' }}>Android</Text> (com o pacote <Text style={{ color: '#00FFAD' }}>com.savepassword.app</Text>).
                      </Text>
                      <Text style={styles.guideStep}>
                        3. Para testar código nativo com Google Sign-In, execute no terminal:
                      </Text>
                      <Text style={styles.codeSnippet}>npx expo run:android</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Login or User Profile */}
            {!accessToken ? (
              <View style={styles.loginContainer}>
                <TouchableOpacity
                  style={styles.googleLoginBtn}
                  onPress={handleNativeGoogleSignIn}
                  activeOpacity={0.85}
                >
                  <View style={styles.googleIconBg}>
                    <Text style={styles.googleGText}>G</Text>
                  </View>
                  <Text style={styles.googleLoginBtnText}>Entrar com o Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.directTokenOption} onPress={() => setIsEditingClientId(true)}>
                  <Text style={styles.directTokenText}>Configurar Client ID no app.json / código</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.profileBox}>
                <View style={styles.profileHeader}>
                  <MaterialIcons name="account-circle" size={32} color="#392de9" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.profileLabel}>Conectado como:</Text>
                    <Text style={styles.profileEmail} numberOfLines={1}>
                      {userEmail || 'Conta Google'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Sair</Text>
                  </TouchableOpacity>
                </View>

                {backupMeta && (
                  <View style={styles.metaBox}>
                    <MaterialIcons name="check-circle" size={18} color="#2ECC71" style={{ marginRight: 6 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.metaTitle}>Backup Oculto Existente</Text>
                      <Text style={styles.metaSub}>
                        Última atualização:{' '}
                        {backupMeta.modifiedTime
                          ? new Date(backupMeta.modifiedTime).toLocaleString('pt-BR')
                          : 'Recente'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#392de9" />
                <Text style={styles.loadingText}>Conectando ao Google Drive...</Text>
              </View>
            ) : accessToken ? (
              <View style={styles.actionColumn}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveToDrive}>
                  <MaterialIcons name="cloud-upload" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>Salvar Backup Oculto Agora</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.restoreBtn} onPress={handleRestoreFromDrive}>
                  <MaterialIcons name="cloud-download" size={20} color="#392de9" style={{ marginRight: 8 }} />
                  <Text style={styles.restoreBtnText}>Restaurar Senhas do Google Drive</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
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
    marginBottom: 14,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#141420',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2ECC7140',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoTitle: {
    color: '#2ECC71',
    fontWeight: 'bold',
    fontSize: 13,
  },
  infoText: {
    color: '#A0A0B2',
    fontSize: 12,
    lineHeight: 17,
  },
  clientIdBox: {
    backgroundColor: '#141420',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  clientIdHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clientIdTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  label: {
    color: '#A0A0B2',
    fontSize: 11,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0F0F17',
    color: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#2A2A3C',
    marginBottom: 8,
  },
  saveClientIdBtn: {
    backgroundColor: '#392de9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveClientIdText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  guideToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  guideToggleText: {
    color: '#392de9',
    fontSize: 12,
    fontWeight: '600',
  },
  guideBox: {
    backgroundColor: '#0F0F17',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#392de940',
  },
  guideTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 6,
  },
  guideStep: {
    color: '#A0A0B2',
    fontSize: 11,
    marginBottom: 4,
    lineHeight: 16,
  },
  codeSnippet: {
    color: '#00FFAD',
    fontFamily: 'SpaceMono',
    fontSize: 12,
    backgroundColor: '#1E1E2C',
    padding: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  loginContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  googleLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    width: '100%',
    justifyContent: 'center',
  },
  googleIconBg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleGText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  googleLoginBtnText: {
    color: '#1F1F1F',
    fontSize: 15,
    fontWeight: 'bold',
  },
  directTokenOption: {
    paddingVertical: 8,
    marginTop: 6,
  },
  directTokenText: {
    color: '#6C6C8A',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  profileBox: {
    backgroundColor: '#141420',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileLabel: {
    color: '#6C6C8A',
    fontSize: 11,
  },
  profileEmail: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: '#2A2A3C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    color: '#E74C3C',
    fontSize: 12,
    fontWeight: '600',
  },
  metaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B3828',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  metaTitle: {
    color: '#2ECC71',
    fontWeight: 'bold',
    fontSize: 12,
  },
  metaSub: {
    color: '#D1D1E0',
    fontSize: 11,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    color: '#A0A0B2',
    fontSize: 13,
    marginTop: 10,
  },
  actionColumn: {
    gap: 10,
    marginBottom: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#392de9',
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: '#392de9',
    paddingVertical: 12,
    borderRadius: 10,
  },
  restoreBtnText: {
    color: '#392de9',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeBtn: {
    backgroundColor: '#2A2A3C',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  closeBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
