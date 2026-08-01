import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { SavedPassword } from '../types/password';
import { encryptPayload, decryptPayload } from './security';

export interface BackupStructure {
  app: string;
  version: string;
  createdAt: string;
  count: number;
  payload: string;
}

/**
 * Creates an encrypted JSON backup file of all saved passwords and opens native share dialog.
 */
export async function exportBackup(passwords: SavedPassword[]): Promise<{ success: boolean; message: string }> {
  try {
    if (passwords.length === 0) {
      return { success: false, message: 'Nenhuma senha salva para exportar.' };
    }

    const encryptedPayload = await encryptPayload(JSON.stringify(passwords));

    const backupData: BackupStructure = {
      app: 'SavePassword',
      version: '2.0',
      createdAt: new Date().toISOString(),
      count: passwords.length,
      payload: encryptedPayload,
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `savepassword_backup_${dateStr}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backupData, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar Backup do SavePassword',
        UTI: 'public.json',
      });
      return { success: true, message: 'Backup exportado com sucesso!' };
    } else {
      return { success: true, message: `Backup salvo localmente em: ${fileName}` };
    }
  } catch (error: any) {
    console.error('Erro ao exportar backup:', error);
    return { success: false, message: `Falha ao criar backup: ${error?.message || 'Erro desconhecido'}` };
  }
}

/**
 * Lets user select a backup JSON file, decrypts it, and returns restored SavedPassword list.
 */
export async function importBackup(): Promise<{ success: boolean; passwords?: SavedPassword[]; message: string }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, message: 'Operação de restauração cancelada.' };
    }

    const fileUri = result.assets[0].uri;
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const parsed: BackupStructure = JSON.parse(fileContent);

    if (!parsed || parsed.app !== 'SavePassword' || !parsed.payload) {
      return { success: false, message: 'Arquivo de backup inválido ou incompatível.' };
    }

    const decryptedStr = await decryptPayload(parsed.payload);
    const passwordsList: SavedPassword[] = JSON.parse(decryptedStr);

    if (!Array.isArray(passwordsList)) {
      return { success: false, message: 'Conteúdo do backup corrompido.' };
    }

    return {
      success: true,
      passwords: passwordsList,
      message: `Backup restaurado com sucesso! (${passwordsList.length} senhas)`,
    };
  } catch (error: any) {
    console.error('Erro ao importar backup:', error);
    return { success: false, message: 'Erro ao ler ou descriptografar o arquivo de backup.' };
  }
}
