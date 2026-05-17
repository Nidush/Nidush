<p align="center">
  <img src="./assets/images/Logo.png" alt="Nidush Logo" width="200" />
</p>

# Nidush

> **University Project - MVP | Master's in Communication and Web Technologies (MCTW)**

**Nidush** is a smart home solution developed as a Minimum Viable Product (MVP) for the **Altice Labs** challenge. It focuses on humanizing smart spaces by transforming them into active environments for emotional care, specifically designed for individuals dealing with anxiety in urban contexts.

[![Android Download](https://img.shields.io/badge/Download-Android_APK-34A853?style=for-the-badge&logo=android&logoColor=white)](https://drive.google.com/drive/folders/1574BepiHOLFtc2zvkSyJQmq_g9qTiNVV)
[![React Native](https://img.shields.io/badge/React_Native-Expo-61DAFB?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/NativeWind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://www.nativewind.dev/)
[![CI/CD Nidush](https://github.com/Nidush/Nidush/actions/workflows/cicd-nidush.yml/badge.svg?branch=main)](https://github.com/Nidush/Nidush/actions/workflows/cicd-nidush.yml)

## MVP Features

* **Guided Activities:** Immersive sessions (Meditation, Cooking, Workout, Audiobooks) that synchronize digital content with physical ambient changes (lighting/sound).
* **Atmospheric Scenarios:** Quick presets to change a room's vibe (e.g., "Relaxation" in the Living Room).
* **Onboarding:** Introduction to the app's ecosystem.
* **Activity Creator:** A step-by-step wizard to build personalized wellness experiences.
* **Privacy & Multi-profiles:** Support for private rooms and multiple resident profiles to ensure trust and avoid environmental conflicts.
* **Distraction-Free Focus:** Capability to suppress notifications during activities to minimize psychological pressure.

## Tech Stack

* **Frontend:** React Native (Expo SDK 52)
* **Language:** TypeScript
* **Styling:** NativeWind (Tailwind CSS)
* **Navigation:** Expo Router (File-based routing)
* **State Management:** React Context API
* **Testing:** Jest & React Testing Library (Coverage implemented)
* **Integrations (Planned):** Spotify API for immersive soundscapes and Wearable data sync for real-time stress monitoring.

---

## Getting Started

To explore the Nidush MVP locally, follow these steps:

### Prerequisites
* **Node.js (LTS):** [Download here](https://nodejs.org/)
* **Git:** To clone the repository
* **Expo Go:** Installed on your smartphone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Nidush/Nidush.git](https://github.com/Nidush/Nidush.git)
    cd Nidush
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npx expo start
    ```

### Running the App
* **Physical Device:** Open the **Expo Go** app and scan the QR code visible in your terminal.
* **Android Emulator / iOS Simulator:** Press `a` or `i` in the terminal after the server starts.
* **Clean Start:** If you encounter caching issues, run `npx expo start -c`.

---

## Mobile Access (APK)

Since this is a mobile-first application, we recommend testing the native experience. You can download the latest Android build (APK) here:
[**Nidush Android Build - Google Drive**](https://drive.google.com/drive/folders/1574BepiHOLFtc2zvkSyJQmq_g9qTiNVV)

*Note: For security reasons, you may need to allow "Install from unknown sources" on your Android device to install the APK.*

---

## Spotify Integration & App Review

Nidush integrates with Spotify to provide immersive music experiences. For production use, the Spotify app must be approved for public access.

### 📋 App Review Status
- **Current Status:** Development Mode (Limited to 5 test users)
- **Client ID:** `4a9f8400a01545008b0addcfa7a6b9c3`
- **Scopes:** User playback control, playlist access, current track info

### 🚀 Submission Requirements
Before submitting for Spotify App Review, ensure you have:

1. **Privacy Policy** hosted online (see `PRIVACY_POLICY.md`)
2. **Terms of Service** hosted online (see `TERMS_OF_SERVICE.md`)
3. **App screenshots** showing Spotify integration
4. **Detailed app description** explaining music features

### 📖 Documentation
- [Privacy Policy](./PRIVACY_POLICY.md)
- [Terms of Service](./TERMS_OF_SERVICE.md)
- [Spotify Submission Guide](./SPOTIFY_SUBMISSION_GUIDE.md)

### 🔧 Hosting Policies Online
To host the Privacy Policy and Terms of Service:

1. **Generate HTML versions first**:
   ```bash
   npm run generate:policies
   ```
   This creates `privacy-policy.html` and `terms-of-service.html` in the project root.

2. **GitHub Pages** (Free):
   - Push `privacy-policy.html` and `terms-of-service.html` to the branch selected for GitHub Pages.
   - Or use the `docs/` folder if your Pages site is configured to serve from there.

3. **Netlify/Vercel** (Free tier available):
   - Deploy the repository or upload the generated HTML files.
   - Use the generated public URLs for Spotify review.

4. **Local preview with backend server**:
   ```bash
   npm run backend
   ```
   Then open:
   - `http://localhost:3000/privacy-policy`
   - `http://localhost:3000/terms-of-service`

5. **WordPress/Blog** (Free):
---

## Contributors

Developed as part of the **TDW/MCTW Master's program** for the Altice Labs challenge, by **Group 4**:

* [Eduarda Carvalho](https://github.com/eduardahfc) - 113578
* [Gabriel Teixeira](https://github.com/GabrielTeixei) - 107876
* [Mariana Peixe](https://github.com/MarianaPeixe7) - 113262
* [Pedro Teixeira](https://github.com/pedroteixeira04) - 114323

---

*Nidush: Your home, your safe space.*
