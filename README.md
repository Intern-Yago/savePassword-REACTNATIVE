# 🔒 SavePassword - Gerador & Gerenciador Seguro de Senhas com 2FA, QR Code e Google Drive Sign-In

[![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK-52.0-000000?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**SavePassword** é um aplicativo mobile e web completo desenvolvido com **React Native** e **Expo Router**, projetado para gerar senhas altamente seguras, armazená-las de forma criptografada por hardware, **escanear QR Codes 2FA com a câmera**, **gerar códigos 2FA/TOTP** e **sincronizar backups ocultos no Google Drive com Login Google SSO**.

---

## ✨ Funcionalidades Principais

- 🌐 **Login com o Google (Google Sign-In SSO)**:
  - Botão oficial de login **"Entrar com o Google"** via `expo-auth-session`.
  - Exibe o e-mail conectado e gerencia o acesso de forma simples e intuitiva.

- ☁️ **Backup Oculto & Auto-Sync no Google Drive (`appDataFolder`)**:
  - Salva o arquivo de backup criptografado na pasta restrita do aplicativo no Google Drive (`appDataFolder`).
  - **Invisível no Google Drive Comum**: O arquivo não aparece na interface padrão do Google Drive do usuário, garantindo privacidade total.
  - **Restauração Automática ao Reinstalar**: Ao conectar com a conta Google, o aplicativo localiza e restaura o backup oculto automaticamente.
  - **Dupla Criptografia**: Além de isolado no sistema do Google, o arquivo é encriptado com **AES-256 de Hardware**.

- 📷 **Leitor de QR Code com a Câmera**:
  - Escaneie os QR Codes de autenticação 2FA diretamente com a câmera do seu celular usando `expo-camera`.
  - Extrai automaticamente o **Título/Serviço** e a **Chave Secreta** do QR Code (`otpauth://`).

- ➕ **Adicionar Credencial / 2FA Manualmente**:
  - Botão **"+ Novo / 2FA"** e Botão Flutuante (**+ FAB**) para criar registros sem precisar passar pelo gerador de senhas.

- 📲 **Gerador de Autenticação 2FA / TOTP (RFC 6238)**:
  - Funciona como um autenticador 2FA integrado (estilo Google Authenticator / Authy).
  - Exibe o **código dinâmico de 6 dígitos** com contador e **barra de progresso em tempo real de 30 segundos**.

- 🔑 **Gerador de Senhas Criptograficamente Seguro (PRNG)**:
  - Utiliza `globalThis.crypto.getRandomValues` para garantir aleatoriedade imprevisível com medidor de força em tempo real (*Fraca*, *Média*, *Forte*, *Excelente*).

- 👆 **Autenticação Biométrica & Senha do Celular**:
  - Desbloqueie o aplicativo usando **Impressão Digital**, **Face ID** ou **Senha da Tela de Bloqueio do Celular**.

- 🛡️ **Criptografia de Hardware (Android Keystore / iOS Keychain)**:
  - Senhas e chaves 2FA salvas são encriptadas usando chaves dinâmicas de 256 bits via `expo-secure-store`.

- 🔍 **Busca & Filtro Instantâneo**:
  - Pesquise suas senhas e códigos 2FA salvos por título ou serviço em tempo real.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [React Native](https://reactnative.dev/) (v0.76) & [Expo](https://expo.dev/) (SDK 52)
- **Login Google SSO**: `expo-auth-session`
- **Nuvem Google Drive**: Google Drive REST API (`appDataFolder` space)
- **Câmera & QR Code**: `expo-camera`
- **Criptografia de Hardware**: `expo-secure-store`
- **Biometria**: `expo-local-authentication`
- **Autenticador 2FA**: Algoritmo TOTP RFC 6238 + Base32
- **Backup Local**: `expo-file-system`, `expo-sharing`, `expo-document-picker`
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)

---

## 📂 Estrutura do Projeto

```text
savePassword-REACTNATIVE/
├── app/                      # Rotas e páginas do Expo Router
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Layout e estilo da Tab Bar inferior
│   │   ├── index.tsx         # Aba "Gerador" (Home)
│   │   └── passwords.tsx     # Aba "Minhas Senhas" (Lista, Busca, PIN, Biometria, 2FA, QR Code, Google Drive)
│   ├── _layout.tsx           # Layout raiz com ThemeProvider
│   └── +not-found.tsx        # Tela de erro 404
├── components/               # Componentes reutilizáveis
│   ├── modal/
│   │   ├── AddCredentialModal.tsx # Modal de criação direta de senhas e 2FA
│   │   ├── GoogleDriveModal.tsx   # Modal de login Google SSO e sincronização oculta no Google Drive
│   │   ├── QRScannerModal.tsx     # Modal de câmera para escanear QR Code 2FA
│   │   └── index.tsx              # Modal de exibição da senha gerada
│   ├── passwordItem/
│   │   └── index.tsx         # Card individual com senha e gerador 2FA TOTP em tempo real
│   └── ui/
│       └── Toast.tsx         # Componente de notificação flutuante
├── hooks/
│   └── useStorage.ts         # Hook customizado de armazenamento, PIN e Biometria
├── types/
│   └── password.ts           # Interfaces TypeScript da aplicação
├── utils/
│   ├── backup.ts             # Funções de exportação e restauração de backup local (.json)
│   ├── biometrics.ts         # Autenticação por Impressão Digital, Face ID e Senha do Celular
│   ├── googleDrive.ts        # Integração com Google Drive AppData (pasta restrita e oculta)
│   ├── security.ts           # Criptografia de Hardware (SecureStore), PRNG e Entropia
│   └── totp.ts               # Algoritmo de Autenticação 2FA / TOTP (RFC 6238)
├── LICENSE                   # Licença MIT do projeto
├── package.json
└── README.md
```

---

## 🚀 Como Executar o Projeto

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor Expo
npx expo start
```

---

## 📄 Licença

Este projeto está sob a licença **MIT** - veja o arquivo [LICENSE](LICENSE) para mais detalhes.
