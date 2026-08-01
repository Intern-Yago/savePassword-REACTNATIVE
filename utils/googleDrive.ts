import { SavedPassword } from '../types/password';
import { encryptPayload, decryptPayload } from './security';

const GOOGLE_DRIVE_APPDATA_FILENAME = 'savepassword_cloud_backup.json';

export interface GoogleDriveBackupMeta {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
}

/**
 * Searches for existing hidden backup file in Google Drive 'appDataFolder'.
 */
export async function findGoogleDriveBackup(accessToken: string): Promise<GoogleDriveBackupMeta | null> {
  try {
    const query = encodeURIComponent(`'appDataFolder' in parents and name = '${GOOGLE_DRIVE_APPDATA_FILENAME}' and trashed = false`);
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=appDataFolder&fields=files(id,name,modifiedTime,size)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Google Drive search failed:', await response.text());
      return null;
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0];
    }

    return null;
  } catch (error) {
    console.error('Erro ao pesquisar no Google Drive:', error);
    return null;
  }
}

/**
 * Saves or updates encrypted passwords backup in the hidden 'appDataFolder' on Google Drive.
 * Files in 'appDataFolder' are isolated and completely hidden from normal Google Drive UI.
 */
export async function saveToGoogleDriveAppData(
  accessToken: string,
  passwords: SavedPassword[]
): Promise<{ success: boolean; message: string }> {
  try {
    if (passwords.length === 0) {
      return { success: false, message: 'Nenhuma senha para salvar na nuvem.' };
    }

    const encryptedPayload = await encryptPayload(JSON.stringify(passwords));
    const backupContent = JSON.stringify({
      app: 'SavePassword',
      version: '2.0',
      type: 'GoogleDriveHiddenAppData',
      createdAt: new Date().toISOString(),
      count: passwords.length,
      payload: encryptedPayload,
    });

    const existingFile = await findGoogleDriveBackup(accessToken);

    if (existingFile) {
      // Update existing file in appDataFolder
      const updateResponse = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: backupContent,
        }
      );

      if (updateResponse.ok) {
        return { success: true, message: 'Backup na nuvem do Google Drive atualizado com sucesso!' };
      } else {
        return { success: false, message: 'Falha ao atualizar arquivo no Google Drive.' };
      }
    } else {
      // Create new file in appDataFolder
      const metadata = {
        name: GOOGLE_DRIVE_APPDATA_FILENAME,
        parents: ['appDataFolder'],
      };

      const boundary = 'foo_bar_baz';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        backupContent +
        closeDelimiter;

      const createResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );

      if (createResponse.ok) {
        return { success: true, message: 'Backup oculto criado no Google Drive com sucesso!' };
      } else {
        return { success: false, message: 'Falha ao criar arquivo no Google Drive.' };
      }
    }
  } catch (error: any) {
    console.error('Erro ao salvar no Google Drive:', error);
    return { success: false, message: `Erro ao conectar com Google Drive: ${error?.message || ''}` };
  }
}

/**
 * Downloads and restores encrypted passwords backup from hidden 'appDataFolder' on Google Drive.
 */
export async function restoreFromGoogleDriveAppData(
  accessToken: string
): Promise<{ success: boolean; passwords?: SavedPassword[]; message: string }> {
  try {
    const existingFile = await findGoogleDriveBackup(accessToken);
    if (!existingFile) {
      return { success: false, message: 'Nenhum backup oculto encontrado no seu Google Drive.' };
    }

    const downloadResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!downloadResponse.ok) {
      return { success: false, message: 'Falha ao baixar backup do Google Drive.' };
    }

    const contentText = await downloadResponse.text();
    const parsed = JSON.parse(contentText);

    if (!parsed || parsed.app !== 'SavePassword' || !parsed.payload) {
      return { success: false, message: 'Backup do Google Drive inválido ou corrompido.' };
    }

    const decryptedStr = await decryptPayload(parsed.payload);
    const passwordsList: SavedPassword[] = JSON.parse(decryptedStr);

    if (!Array.isArray(passwordsList)) {
      return { success: false, message: 'Conteúdo das senhas corrompido.' };
    }

    return {
      success: true,
      passwords: passwordsList,
      message: `Backup restaurado do Google Drive! (${passwordsList.length} itens)`,
    };
  } catch (error: any) {
    console.error('Erro ao restaurar do Google Drive:', error);
    return { success: false, message: 'Erro ao processar backup do Google Drive.' };
  }
}
