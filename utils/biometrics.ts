import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricType: 'Face ID' | 'Impressão Digital' | 'Biometria' | 'Nenhuma';
}

/**
 * Checks hardware availability and enrolled biometric types.
 */
export async function getBiometricStatus(): Promise<BiometricStatus> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometricType: BiometricStatus['biometricType'] = 'Biometria';
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = 'Face ID';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = 'Impressão Digital';
    } else if (!hasHardware || !isEnrolled) {
      biometricType = 'Nenhuma';
    }

    return {
      hasHardware,
      isEnrolled,
      biometricType,
    };
  } catch (error) {
    console.error('Erro ao verificar biometria:', error);
    return {
      hasHardware: false,
      isEnrolled: false,
      biometricType: 'Nenhuma',
    };
  }
}

/**
 * Authenticates user using fingerprint, Face ID, or device passcode.
 */
export async function authenticateWithBiometrics(
  promptMessage: string = 'Autentique-se para acessar o SavePassword'
): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      // Fallback: If device has no biometrics configured, return false so PIN fallback can be used
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Usar PIN do App',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false, // Allows device passcode as fallback
    });

    return result.success;
  } catch (error) {
    console.error('Erro na autenticação biométrica:', error);
    return false;
  }
}
