# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning (SemVer)](https://semver.org/lang/pt-BR/).

## [1.1.5] - 2026-08-01

### Fixed
- **Compilação Gradle Android (EAS Build)**: Adicionado `expo-build-properties` com `kotlinVersion: 1.9.25` para compatibilidade com o Jetpack Compose Compiler em `expo-modules-core`.
- **Prebuild Asset Dimensions**: Redimensionados `icon.png` e `adaptive-icon.png` para quadrados 1:1 de `512x512`.
- **Alinhamento do Expo SDK 52**: Atualizadas dependências `react-native`, `expo-router` e `expo-system-ui` para compatibilidade total.

## [1.1.0] - 2026-08-01

### Added
- **Criptografia de Hardware (SecureStore)**: Chaves AES de 256 bits salvas no Android Keystore / iOS Keychain.
- **Autenticação Biométrica**: Suporte a Impressão Digital, Face ID e senha de tela do celular via `expo-local-authentication`.
- **Autenticador 2FA / TOTP (RFC 6238)**: Geração de códigos dinâmicos de 6 dígitos em tempo real com contador e barra de progresso de 30 segundos.
- **Leitor de QR Code**: Escaneamento de QR Codes de autenticadores usando a câmera nativa via `expo-camera`.
- **Criação Direta de Credenciais/2FA**: Modal para adicionar registros manualmente ou escaneando QR Code sem necessidade de passar pelo gerador.
- **Backup Oculto no Google Drive (AppData)**: Sincronização e restauração de arquivos encriptados na pasta restrita `appDataFolder` com Login Google SSO via `expo-auth-session` e `@react-native-google-signin/google-signin`.
- **Licença MIT**: Adicionado arquivo `LICENSE` oficial.

### Changed
- **Migração Completa para TypeScript**: Todos os componentes refatorados de `.jsx` para `.tsx`/`.ts` com checagem estrita (`tsc --noEmit`).
- **Gerador PRNG Criptográfico**: Substituído `Math.random()` por `globalThis.crypto.getRandomValues`.

### Fixed
- Corrigido bug de retorno no `keyExtractor` do `FlatList`.
- Removidas sequências de escape Unicode para acentuação direta em UTF-8.
