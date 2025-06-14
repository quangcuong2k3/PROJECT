# Firebase Database Structure Exporter

This script exports the complete structure of your Firebase project (both Firestore and Realtime Database) to readable text files.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install firebase-admin
```

Or use the provided package file:
```bash
npm install --package-lock-only --package-lock-file export-package.json
npm install
```

### 2. Get Firebase Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`thecoffee-b780f`)
3. Click on the gear icon (Settings) → Project settings
4. Go to the "Service accounts" tab
5. Click "Generate new private key"
6. Download the JSON file and rename it to `serviceAccountKey.json`
7. Place it in your project root directory (same folder as `exportFirebaseStructure.js`)

### 3. Update Database URL (if needed)

If you're using Realtime Database and the URL is different from the default, update line 12 in `exportFirebaseStructure.js`:

```javascript
databaseURL: "https://your-project-default-rtdb.firebaseio.com/"
```

### 4. Run the Export

```bash
node exportFirebaseStructure.js
```

Or using npm script:
```bash
npm run export
```

## Output

The script will create a `firebase-exports` folder with two files:

1. **Text Report** (`firebase-structure-YYYY-MM-DDTHH-mm-ss-sssZ.txt`)
   - Human-readable format
   - Organized by collections and documents
   - Includes metadata (creation/update times)
   - Shows subcollections structure

2. **JSON Data** (`firebase-structure-YYYY-MM-DDTHH-mm-ss-sssZ.json`)
   - Complete raw data export
   - Machine-readable format
   - Can be used for data migration or backup

## Features

- ✅ Exports all Firestore collections and documents
- ✅ Includes document metadata (timestamps)
- ✅ Handles subcollections recursively
- ✅ Exports Realtime Database structure
- ✅ Creates both human-readable text and JSON formats
- ✅ Timestamped output files
- ✅ Error handling and logging

## Security Notes

- Keep your `serviceAccountKey.json` file secure and never commit it to version control
- Add `serviceAccountKey.json` to your `.gitignore` file
- The service account key provides admin access to your Firebase project

## Troubleshooting

### Permission Errors
Make sure your service account has the following roles:
- Firebase Admin SDK Administrator Service Agent
- Cloud Datastore User (for Firestore)
- Firebase Realtime Database Admin (for Realtime Database)

### Network Errors
Ensure you have internet connectivity and Firebase project is accessible.

### Empty Export
If the export is empty, check:
- Your Firebase project has data
- Service account permissions are correct
- Project ID matches your Firebase project

## Example Output Structure

```
Firebase Database Structure Export
Generated on: 2024-01-15T10:30:00.000Z
Project ID: thecoffee-b780f
==================================================

FIRESTORE DATABASE
====================

Total Collections: 3
Collections: users, products, orders

Collection: users
------------------------------
Documents: 5

  Document ID: user123
    Created: 2024-01-10T08:00:00.000Z
    Updated: 2024-01-14T15:30:00.000Z
    Data:
      name: "John Doe"
      email: "john@example.com"
      preferences:
        theme: "dark"
        notifications: true

REALTIME DATABASE
====================

Structure:
  settings:
    appVersion: "1.0.0"
    maintenance: false
``` 