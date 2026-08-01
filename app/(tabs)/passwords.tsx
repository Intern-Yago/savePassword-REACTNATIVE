import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import useStorage from '../../hooks/useStorage';
import PasswordItem from "../../components/passwordItem";
import { Toast } from "../../components/ui/Toast";
import { SavedPassword } from "../../types/password";
import { authenticateWithBiometrics, getBiometricStatus, BiometricStatus } from "../../utils/biometrics";
import { exportBackup, importBackup } from "../../utils/backup";
import { AddCredentialModal } from "../../components/modal/AddCredentialModal";
import { GoogleDriveModal } from "../../components/modal/GoogleDriveModal";

export default function Passwords() {
  const [listPasswords, setListPasswords] = useState<SavedPassword[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Security states
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinModalVisible, setPinModalVisible] = useState<boolean>(false);
  const [pinMode, setPinMode] = useState<'unlock' | 'create'>('unlock');

  // Biometrics
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus>({
    hasHardware: false,
    isEnrolled: false,
    biometricType: 'Nenhuma',
  });
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(false);

  // Modals
  const [settingsModalVisible, setSettingsModalVisible] = useState<boolean>(false);
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [googleDriveModalVisible, setGoogleDriveModalVisible] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);

  const focused = useIsFocused();
  const {
    getItem,
    setAllItems,
    removeItem,
    getPin,
    setPin,
    removePin,
    getBiometricEnabled,
    setBiometricEnabled,
  } = useStorage();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const pin = await getPin();
      setSavedPin(pin);

      const bioStatus = await getBiometricStatus();
      setBiometricStatus(bioStatus);

      const bioPref = await getBiometricEnabled();
      setIsBiometricEnabled(bioPref);

      const passwords = await getItem("@pass");
      setListPasswords(passwords);

      if (pin || bioPref) {
        setIsUnlocked(false);
      } else {
        setIsUnlocked(true);
      }
    } catch (err) {
      console.error("Erro ao carregar:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (focused) {
      loadData();
    }
  }, [focused]);

  useEffect(() => {
    if (focused && !isUnlocked && (savedPin || isBiometricEnabled) && biometricStatus.hasHardware) {
      handleBiometricUnlock();
    }
  }, [focused, isUnlocked, savedPin, isBiometricEnabled]);

  const handleBiometricUnlock = async () => {
    const success = await authenticateWithBiometrics(
      'Autentique-se com biometria ou senha do celular para desbloquear'
    );
    if (success) {
      setIsUnlocked(true);
      setPinModalVisible(false);
      showToast('Desbloqueado com biometria!');
    }
  };

  const handleDeletePassword = async (item: SavedPassword) => {
    Alert.alert(
      "Excluir Senha",
      `Deseja realmente remover "${item.title || 'esta senha'}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const updated = await removeItem("@pass", item);
            setListPasswords(updated);
            showToast("Senha removida com sucesso!");
          },
        },
      ]
    );
  };

  const handlePinSubmit = async () => {
    if (pinMode === 'unlock') {
      if (enteredPin === savedPin) {
        setIsUnlocked(true);
        setPinModalVisible(false);
        setEnteredPin('');
      } else {
        Alert.alert("PIN Incorreto", "O código PIN digitado está incorreto.");
        setEnteredPin('');
      }
    } else if (pinMode === 'create') {
      if (enteredPin.length < 4) {
        Alert.alert("PIN Inválido", "O PIN deve ter 4 dígitos.");
        return;
      }
      await setPin(enteredPin);
      setSavedPin(enteredPin);
      setIsUnlocked(true);
      setPinModalVisible(false);
      setEnteredPin('');
      showToast("Bloqueio por PIN ativado!");
    }
  };

  const handleRemovePinLock = async () => {
    Alert.alert(
      "Remover PIN",
      "Deseja remover a proteção por PIN da aba de senhas?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          onPress: async () => {
            await removePin();
            setSavedPin(null);
            showToast("Proteção por PIN removida!");
          },
        },
      ]
    );
  };

  const handleToggleBiometricPref = async (val: boolean) => {
    if (val && !biometricStatus.hasHardware) {
      Alert.alert(
        "Biometria Indisponível",
        "Seu dispositivo não possui biometria ou senha de tela configurada."
      );
      return;
    }
    await setBiometricEnabled(val);
    setIsBiometricEnabled(val);
    showToast(val ? 'Autenticação biométrica ativada!' : 'Autenticação biométrica desativada.');
  };

  const handleExportBackup = async () => {
    const res = await exportBackup(listPasswords);
    if (res.success) {
      showToast(res.message);
    } else {
      Alert.alert("Exportar Backup", res.message);
    }
  };

  const handleImportBackup = async () => {
    Alert.alert(
      "Restaurar Backup",
      "Deseja importar um arquivo de backup (.json)? Isso irá restaurar suas senhas salvas.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Selecionar Arquivo",
          onPress: async () => {
            const res = await importBackup();
            if (res.success && res.passwords) {
              await setAllItems(res.passwords);
              setListPasswords(res.passwords);
              showToast(res.message);
            } else if (res.message && !res.message.includes('cancelada')) {
              Alert.alert("Erro ao Restaurar", res.message);
            }
          },
        },
      ]
    );
  };

  const filteredPasswords = useMemo(() => {
    if (!searchQuery.trim()) return listPasswords;
    const query = searchQuery.toLowerCase();
    return listPasswords.filter(
      (p) =>
        (p.title && p.title.toLowerCase().includes(query)) ||
        (p.password && p.password.toLowerCase().includes(query))
    );
  }, [listPasswords, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Minhas Senhas</Text>
            <Text style={styles.subtitle}>
              {listPasswords.length} {listPasswords.length === 1 ? 'item salvo' : 'itens salvos'}
            </Text>
          </View>

          <View style={styles.headerRightBtns}>
            <TouchableOpacity
              style={styles.addBtnHeader}
              onPress={() => setAddModalVisible(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="add" size={20} color="#FFF" />
              <Text style={styles.addBtnHeaderText}>Novo / 2FA</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setSettingsModalVisible(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="settings" size={22} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.lockBtn}
              onPress={() => {
                if (savedPin) {
                  handleRemovePinLock();
                } else {
                  setPinMode('create');
                  setEnteredPin('');
                  setPinModalVisible(true);
                }
              }}
            >
              <MaterialIcons
                name={savedPin ? "lock" : "lock-open"}
                size={18}
                color={savedPin ? "#2ECC71" : "#A0A0B2"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Input */}
        {listPasswords.length > 0 && isUnlocked && (
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color="#6C6C8A" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por título ou serviço..."
              placeholderTextColor="#6C6C8A"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={18} color="#6C6C8A" />
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>

      {/* Screen Content */}
      <View style={styles.content}>
        {(savedPin || isBiometricEnabled) && !isUnlocked ? (
          <View style={styles.lockedContainer}>
            <View style={styles.shieldIconCircle}>
              <MaterialIcons name="security" size={48} color="#392de9" />
            </View>
            <Text style={styles.lockedTitle}>Acesso Protegido</Text>
            <Text style={styles.lockedText}>
              Autentique-se via Biometria, Digital ou PIN para visualizar suas senhas salvas.
            </Text>

            {biometricStatus.hasHardware && (
              <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometricUnlock}>
                <MaterialIcons name="fingerprint" size={24} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.biometricBtnText}>
                  Entrar com {biometricStatus.biometricType}
                </Text>
              </TouchableOpacity>
            )}

            {savedPin && (
              <TouchableOpacity
                style={styles.unlockButton}
                onPress={() => {
                  setPinMode('unlock');
                  setEnteredPin('');
                  setPinModalVisible(true);
                }}
              >
                <MaterialIcons name="dialpad" size={20} color="#392de9" style={{ marginRight: 8 }} />
                <Text style={styles.unlockButtonText}>Entrar com PIN de 4 Dígitos</Text>
              </TouchableOpacity>
            )}

            {savedPin && (
              <TouchableOpacity style={styles.forgotPinBtn} onPress={handleBiometricUnlock}>
                <Text style={styles.forgotPinText}>
                  Esqueceu o PIN? Desbloquear com Biometria / Celular
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : filteredPasswords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name={searchQuery ? "search-off" : "folder-open"}
              size={64}
              color="#2A2A3C"
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Nenhuma credencial encontrada' : 'Nenhuma credencial ou 2FA salvo'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Tente pesquisar por outro termo'
                : 'Toque no botão "+ Novo / 2FA" para escanear um QR Code ou salvar uma credencial manualmente!'}
            </Text>

            <TouchableOpacity
              style={styles.addFirstBtn}
              onPress={() => setAddModalVisible(true)}
            >
              <MaterialIcons name="add" size={20} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.addFirstBtnText}>Adicionar Credencial / 2FA</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            style={{ flex: 1, paddingTop: 14 }}
            contentContainerStyle={{ paddingBottom: 80 }}
            data={filteredPasswords}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PasswordItem
                data={item}
                removePassword={() => handleDeletePassword(item)}
                onCopySuccess={(msg) => showToast(msg || 'Copiado!')}
              />
            )}
          />
        )}

        {/* Floating Action Button (+ FAB) */}
        {isUnlocked && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.85}
          >
            <MaterialIcons name="add" size={28} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* PIN Entry / Create Modal */}
      <Modal visible={pinModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <MaterialIcons name="phonelink-lock" size={40} color="#392de9" style={{ marginBottom: 12 }} />
            <Text style={styles.modalTitle}>
              {pinMode === 'unlock' ? 'Digite seu PIN' : 'Criar PIN de Segurança'}
            </Text>
            <Text style={styles.modalSub}>
              {pinMode === 'unlock'
                ? 'Informe o código PIN de 4 dígitos para acessar suas senhas.'
                : 'Digite um PIN numérico de 4 dígitos para proteger suas senhas.'}
            </Text>

            <TextInput
              style={styles.pinInput}
              keyboardType="number-pad"
              secureTextEntry={true}
              maxLength={4}
              value={enteredPin}
              onChangeText={setEnteredPin}
              placeholder="••••"
              placeholderTextColor="#6C6C8A"
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handlePinSubmit}>
                <Text style={styles.modalConfirmText}>
                  {pinMode === 'unlock' ? 'Entrar' : 'Salvar PIN'}
                </Text>
              </TouchableOpacity>
            </View>

            {pinMode === 'unlock' && biometricStatus.hasHardware && (
              <TouchableOpacity
                style={styles.biometricModalOption}
                onPress={handleBiometricUnlock}
              >
                <MaterialIcons name="fingerprint" size={20} color="#2ECC71" style={{ marginRight: 6 }} />
                <Text style={styles.biometricModalText}>
                  Usar {biometricStatus.biometricType} ao invés do PIN
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Settings & Backup Modal */}
      <Modal visible={settingsModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.settingsHeader}>
              <MaterialIcons name="shield" size={26} color="#392de9" />
              <Text style={styles.settingsTitle}>Segurança & Backup</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.settingLabel}>Autenticação Biométrica</Text>
                <Text style={styles.settingSub}>
                  Desbloquear com Impressão Digital / Face ID
                </Text>
              </View>
              <Switch
                value={isBiometricEnabled}
                onValueChange={handleToggleBiometricPref}
                trackColor={{ false: '#2A2A3C', true: '#392de9' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.settingsDivider} />

            <Text style={styles.sectionHeader}>Backup & Sincronização</Text>

            {/* Google Drive AppData Cloud Sync Option */}
            <TouchableOpacity
              style={styles.googleDriveBtn}
              onPress={() => {
                setSettingsModalVisible(false);
                setGoogleDriveModalVisible(true);
              }}
            >
              <MaterialIcons name="cloud-sync" size={22} color="#FFF" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.googleDriveBtnTitle}>Google Drive AppData (Nuvem Oculta)</Text>
                <Text style={styles.googleDriveBtnSub}>Backup isolado, criptografado e invisível</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backupBtn} onPress={handleExportBackup}>
              <MaterialIcons name="cloud-upload" size={22} color="#FFF" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.backupBtnTitle}>Exportar Backup Local (.json)</Text>
                <Text style={styles.backupBtnSub}>Compartilhar / Salvar arquivo criptografado</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.restoreBtn} onPress={handleImportBackup}>
              <MaterialIcons name="cloud-download" size={22} color="#392de9" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.restoreBtnTitle}>Restaurar Backup Local</Text>
                <Text style={styles.restoreBtnSub}>Importar arquivo de senhas e 2FA</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeSettingsBtn}
              onPress={() => setSettingsModalVisible(false)}
            >
              <Text style={styles.closeSettingsText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Credential / 2FA Manual & Camera Modal */}
      <AddCredentialModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSavedSuccess={() => {
          loadData();
          showToast('Credencial / 2FA adicionado!');
        }}
      />

      {/* Google Drive AppData Cloud Sync Modal */}
      <GoogleDriveModal
        visible={googleDriveModalVisible}
        onClose={() => setGoogleDriveModalVisible(false)}
        passwords={listPasswords}
        onRestoredSuccess={(newPasswords) => {
          setListPasswords(newPasswords);
        }}
        onShowToast={showToast}
      />

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F17',
  },
  header: {
    backgroundColor: "#161622",
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3C',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 22,
  },
  subtitle: {
    color: "#A0A0B2",
    fontSize: 13,
    marginTop: 2,
  },
  headerRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#392de9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addBtnHeaderText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  headerIconBtn: {
    backgroundColor: '#1E1E2C',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2C',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F17',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    position: 'relative',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    color: '#6C6C8A',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#392de9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addFirstBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#392de9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#392de9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 99,
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  shieldIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E1E2C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#392de940',
  },
  lockedTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lockedText: {
    color: '#A0A0B2',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#392de9',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  biometricBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E2C',
    borderWidth: 1,
    borderColor: '#392de9',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  unlockButtonText: {
    color: '#392de9',
    fontWeight: 'bold',
    fontSize: 15,
  },
  forgotPinBtn: {
    paddingVertical: 8,
  },
  forgotPinText: {
    color: '#6C6C8A',
    fontSize: 13,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 16, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E2C',
    width: '100%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalSub: {
    color: '#A0A0B2',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  pinInput: {
    backgroundColor: '#0F0F17',
    color: '#00FFAD',
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center',
    width: '60%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#392de9',
    marginBottom: 24,
    fontFamily: 'SpaceMono',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2A2A3C',
  },
  modalCancelText: {
    color: '#A0A0B2',
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#392de9',
  },
  modalConfirmText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  biometricModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  biometricModalText: {
    color: '#2ECC71',
    fontSize: 13,
    fontWeight: '600',
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingsTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 10,
  },
  settingLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  settingSub: {
    color: '#6C6C8A',
    fontSize: 12,
    marginTop: 2,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#2A2A3C',
    width: '100%',
    marginVertical: 16,
  },
  sectionHeader: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  googleDriveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 10,
  },
  googleDriveBtnTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  googleDriveBtnSub: {
    color: '#E8FAEB',
    fontSize: 11,
    marginTop: 2,
  },
  backupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#392de9',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 10,
  },
  backupBtnTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  backupBtnSub: {
    color: '#D1D1E0',
    fontSize: 11,
    marginTop: 2,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F17',
    borderWidth: 1,
    borderColor: '#392de9',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 20,
  },
  restoreBtnTitle: {
    color: '#392de9',
    fontWeight: 'bold',
    fontSize: 14,
  },
  restoreBtnSub: {
    color: '#6C6C8A',
    fontSize: 11,
    marginTop: 2,
  },
  closeSettingsBtn: {
    backgroundColor: '#2A2A3C',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeSettingsText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
