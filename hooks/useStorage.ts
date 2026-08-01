import AsyncStorage from "@react-native-async-storage/async-storage";
import { SavedPassword } from "../types/password";
import { calculatePasswordStrength, decryptPayload, encryptPayload } from "../utils/security";

const STORAGE_KEY = "@pass";
const PIN_KEY = "@app_pin";
const BIOMETRIC_KEY = "@biometric_enabled";
const GOOGLE_CLIENT_ID_KEY = "@google_client_id";

export const useStorage = () => {

  /**
   * Normalize item so legacy raw string passwords automatically become SavedPassword objects.
   */
  const normalizeItem = (item: any, index: number): SavedPassword => {
    if (typeof item === 'string') {
      const strengthObj = calculatePasswordStrength(item);
      return {
        id: `legacy_${Date.now()}_${index}`,
        title: `Senha ${index + 1}`,
        password: item,
        length: item.length,
        strength: strengthObj.strength,
        createdAt: new Date().toISOString(),
      };
    }
    // Object format
    return {
      id: item.id || `id_${Date.now()}_${Math.random()}`,
      title: item.title || 'Sem título',
      password: item.password || '',
      length: item.length || (item.password ? item.password.length : 0),
      strength: item.strength || calculatePasswordStrength(item.password || '').strength,
      createdAt: item.createdAt || new Date().toISOString(),
    };
  };

  /**
   * Retrieves all saved passwords (decrypting payload).
   */
  const getItem = async (key: string = STORAGE_KEY): Promise<SavedPassword[]> => {
    try {
      const rawData = await AsyncStorage.getItem(key);
      if (!rawData) return [];

      const decrypted = await decryptPayload(rawData);
      const parsed = JSON.parse(decrypted);

      if (!Array.isArray(parsed)) return [];

      return parsed.map((item, index) => normalizeItem(item, index));
    } catch (err) {
      console.error("Erro ao carregar senhas:", err);
      return [];
    }
  };

  /**
   * Saves a new password item or raw string.
   */
  const saveItem = async (
    key: string = STORAGE_KEY,
    newItem: SavedPassword | string,
    customTitle?: string
  ): Promise<SavedPassword[]> => {
    try {
      const currentList = await getItem(key);

      let itemToSave: SavedPassword;
      if (typeof newItem === 'string') {
        const strInfo = calculatePasswordStrength(newItem);
        itemToSave = {
          id: `pwd_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: customTitle || 'Nova Senha',
          password: newItem,
          length: newItem.length,
          strength: strInfo.strength,
          createdAt: new Date().toISOString(),
        };
      } else {
        itemToSave = newItem;
      }

      const updatedList = [itemToSave, ...currentList];
      const encrypted = await encryptPayload(JSON.stringify(updatedList));

      await AsyncStorage.setItem(key, encrypted);
      return updatedList;
    } catch (err) {
      console.error("Erro ao salvar senha:", err);
      return [];
    }
  };

  /**
   * Overwrites all passwords list (used during backup restoration).
   */
  const setAllItems = async (
    newList: SavedPassword[],
    key: string = STORAGE_KEY
  ): Promise<boolean> => {
    try {
      const encrypted = await encryptPayload(JSON.stringify(newList));
      await AsyncStorage.setItem(key, encrypted);
      return true;
    } catch (err) {
      console.error("Erro ao sobrescrever senhas:", err);
      return false;
    }
  };

  /**
   * Removes a password item by ID or reference.
   */
  const removeItem = async (key: string = STORAGE_KEY, itemOrId: SavedPassword | string): Promise<SavedPassword[]> => {
    try {
      const currentList = await getItem(key);
      const targetId = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
      const targetPasswordStr = typeof itemOrId === 'string' ? itemOrId : itemOrId.password;

      const updatedList = currentList.filter((item) => {
        if (item.id === targetId) return false;
        if (item.password === targetPasswordStr && (!item.id || item.id === targetId)) return false;
        return true;
      });

      const encrypted = await encryptPayload(JSON.stringify(updatedList));
      await AsyncStorage.setItem(key, encrypted);
      return updatedList;
    } catch (err) {
      console.error("Erro ao remover senha:", err);
      return [];
    }
  };

  /**
   * Pin code operations for app security lock.
   */
  const getPin = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(PIN_KEY);
    } catch {
      return null;
    }
  };

  const setPin = async (pin: string): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(PIN_KEY, pin);
      return true;
    } catch {
      return false;
    }
  };

  const removePin = async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(PIN_KEY);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Biometric preference operations.
   */
  const getBiometricEnabled = async (): Promise<boolean> => {
    try {
      const val = await AsyncStorage.getItem(BIOMETRIC_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  };

  const setBiometricEnabled = async (enabled: boolean): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(BIOMETRIC_KEY, enabled ? 'true' : 'false');
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Google Client ID storage for OAuth2 authentication.
   */
  const getGoogleClientId = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(GOOGLE_CLIENT_ID_KEY);
    } catch {
      return null;
    }
  };

  const setGoogleClientId = async (clientId: string): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId);
      return true;
    } catch {
      return false;
    }
  };

  return {
    getItem,
    saveItem,
    setAllItems,
    removeItem,
    getPin,
    setPin,
    removePin,
    getBiometricEnabled,
    setBiometricEnabled,
    getGoogleClientId,
    setGoogleClientId,
  };
};

export default useStorage;
