export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong';

export interface SavedPassword {
  id: string;
  title: string;
  password: string;
  length: number;
  strength: PasswordStrength;
  createdAt: string;
  totpSecret?: string; // Optional 2FA Secret Key (Base32 or otpauth:// URL)
}

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
}
