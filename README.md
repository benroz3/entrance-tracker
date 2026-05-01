# Gate entry tracker

React + Vite + TypeScript + SCSS application for tracking employees currently inside a facility. Workers open the check-in screen, choose a center or unit when entering, enter an ID, and toggle entry or exit. Updates sync in real time via Firebase Firestore.

## Prerequisites

- Node.js 18+
- A Firebase project with Firestore enabled

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in Firebase web app configuration from the Firebase console (Project settings → Your apps). Set the admin secret (`VITE_ADMIN_PIN`) for the management panel (letters, digits, and symbols allowed; comparison is case-sensitive; surrounding spaces are trimmed). Set `VITE_EMPLOYEE_ID_SECRET` to a long random string (at least 16 characters). It is used to derive a search key and to encrypt employee IDs before they are written to Firestore.

3. Deploy Firestore security rules (adjust for production before going live):

```bash
firebase deploy --only firestore:rules
```

Or paste `firestore.rules` into the Firestore Rules editor in the Firebase console.

4. Start the dev server:

```bash
npm run dev
```

5. Production build:

```bash
npm run build
npm run preview
```

## Firestore collections

- `departments` — `name`, `createdAt`
- `entries` — active presence: `employeeKey` (HMAC hex, for lookup), `employeeIv`, `employeeCipher` (AES-GCM of the normalized ID), `departmentId`, `departmentName`, `enteredAt`. Older rows may still have plaintext `employeeId` only.
- `logs` — audit trail: same sealed employee fields as `entries`, plus `departmentId`, `departmentName`, `action` (`entry` | `exit`), `timestamp`. Legacy rows may have plaintext `employeeId` only.

## Localization

All UI copy is in `src/i18n/he.json`. The app is RTL (`dir="rtl"` on `<html>` and global SCSS).

## Security note

The bundled rules allow open read/write for development. Replace them with least-privilege rules and additional protections (App Check, IP restrictions, or server-side mediation) before production use.

Employee IDs are not stored in plaintext in new documents: a deterministic HMAC (`employeeKey`) enables lookups, and AES-GCM ciphertext stores the digits for display in the app after decryption. Because `VITE_EMPLOYEE_ID_SECRET` ships inside the client bundle, anyone with the built app and database access can still recover IDs. Treat this as obfuscation against casual inspection of Firestore, not as a substitute for a trusted backend or hardware-backed secrets when you need stronger guarantees.
