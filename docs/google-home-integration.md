# Google Home Integration

This project is prepared to use Google Home as the main smart-home provider instead of the older local-network scan flow.

## Already done in the repo

- `utils/googleHome.ts` provides the React Native service interface
- `app/Profile.tsx` now starts from a Google Home sync flow
- Synced devices are stored with `source: google_home`
- Android bridge placeholders exist in:
  - `android/app/src/main/java/com/nidush/app/GoogleHomeModule.kt`
  - `android/app/src/main/java/com/nidush/app/GoogleHomePackage.kt`
- `scripts/google-home-debug-sha1.sh` prints the SHA-1 from the debug keystore
- `android/local-home-sdk/README.md` marks the intended vendor SDK location

## Why it still shows "setup required"

The official Google Home Android SDK is not shipped as a normal Maven dependency in the public Android repositories. Google’s docs say it must be downloaded from the Google Home Developers site and hosted locally in the app project.

Official sources:

- SDK setup: https://developers.home.google.com/apis/android/sdk
- OAuth: https://developers.home.google.com/apis/android/oauth
- Get started: https://developers.home.google.com/apis/android/get-started
- Permissions API: https://developers.home.google.com/apis/android/permissions

## Step by step for this project

### 1. Download the official Android SDK from Google

Open:

- https://developers.home.google.com/apis/android/sdk

Sign in with the Google account you will use for development and download the Home APIs Android SDK package.

### 2. Put the SDK inside this repo

Extract the downloaded files into:

- `android/local-home-sdk/`

Keep the original folder structure from Google’s package so we can wire Gradle to it cleanly.

### 3. Get your Android debug SHA-1

Run:

```bash
bash scripts/google-home-debug-sha1.sh
```

If that prints a SHA-1, copy it.

### 4. Create or update the Android OAuth client

In Google Cloud Console:

1. Open the project used for Nidush.
2. Go to APIs & Services > Credentials.
3. Create or update an OAuth client of type Android.
4. Use:
   - Package name: `com.nidush.app`
   - SHA-1: the value from the script above

If Google asks for an OAuth consent screen, complete that too.

### 5. Rebuild the Android app once

The native module will never appear in Expo hot reload alone. You need a fresh Android binary.

Run:

```bash
npx expo run:android
```

If you use EAS dev builds instead, create a fresh Android dev build after the native SDK files are present.

### 6. Tell me the exact SDK files Google gave you

After extracting the SDK, run:

```bash
find android/local-home-sdk -maxdepth 3 -type f | sort
```

Send me that output.

I’ll then wire:

- the local Gradle repository/dependencies
- the Kotlin imports
- the Home initialization
- the permission request flow
- device listing
- power control

### 7. Rebuild again after I wire the SDK

After I patch the native module with the real SDK classes, run again:

```bash
npx expo run:android
```

Then test in the app:

1. Open Profile
2. Tap `Connect Google Home & Sync Devices`
3. Grant access
4. Confirm devices appear

## What I still need from you

I cannot fetch the vendor SDK package from Google from inside this environment because it requires your authenticated Google Home developer access.

The next concrete thing for you to do is:

1. Download the SDK
2. Extract it into `android/local-home-sdk/`
3. Run `bash scripts/google-home-debug-sha1.sh`
4. Create the Android OAuth credential
5. Run `find android/local-home-sdk -maxdepth 3 -type f | sort`
6. Send me that output

Once you send me the extracted SDK file list, I can finish the native wiring in code.
