const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// You'll need to download your service account key from Firebase Console
// and place it in your project root as 'serviceAccountKey.json'
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://thecoffee-b780f-default-rtdb.firebaseio.com/", // Replace with your Realtime Database URL if different
  projectId: "thecoffee-b780f"
});

const db = admin.firestore();
const rtdb = admin.database();

// Function to export Firestore structure
async function exportFirestoreStructure() {
  console.log('Exporting Firestore structure...');
  const firestoreData = {};
  
  try {
    // Get all collections
    const collections = await db.listCollections();
    
    for (const collection of collections) {
      console.log(`Processing collection: ${collection.id}`);
      firestoreData[collection.id] = {};
      
      // Get all documents in the collection
      const snapshot = await collection.get();
      
      for (const doc of snapshot.docs) {
        const docData = doc.data();
        firestoreData[collection.id][doc.id] = {
          data: docData,
          metadata: {
            id: doc.id,
            createTime: doc.createTime,
            updateTime: doc.updateTime,
            readTime: doc.readTime
          }
        };
        
        // Check for subcollections
        const subcollections = await doc.ref.listCollections();
        if (subcollections.length > 0) {
          firestoreData[collection.id][doc.id].subcollections = {};
          
          for (const subcollection of subcollections) {
            console.log(`Processing subcollection: ${collection.id}/${doc.id}/${subcollection.id}`);
            const subSnapshot = await subcollection.get();
            firestoreData[collection.id][doc.id].subcollections[subcollection.id] = {};
            
            for (const subDoc of subSnapshot.docs) {
              firestoreData[collection.id][doc.id].subcollections[subcollection.id][subDoc.id] = {
                data: subDoc.data(),
                metadata: {
                  id: subDoc.id,
                  createTime: subDoc.createTime,
                  updateTime: subDoc.updateTime,
                  readTime: subDoc.readTime
                }
              };
            }
          }
        }
      }
    }
    
    return firestoreData;
  } catch (error) {
    console.error('Error exporting Firestore:', error);
    return { error: error.message };
  }
}

// Function to export Realtime Database structure
async function exportRealtimeDBStructure() {
  console.log('Exporting Realtime Database structure...');
  
  try {
    const ref = rtdb.ref('/');
    const snapshot = await ref.once('value');
    return snapshot.val() || {};
  } catch (error) {
    console.warn('Skipping Realtime Database export due to error:', error.message);
    return { skipped: true, error: error.message };
  }
}

// Function to format data for text output
function formatDataForText(data, indent = 0) {
  const spaces = '  '.repeat(indent);
  let output = '';
  
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      output += `${spaces}[\n`;
      data.forEach((item, index) => {
        output += `${spaces}  [${index}]: `;
        if (typeof item === 'object') {
          output += '\n' + formatDataForText(item, indent + 2);
        } else {
          output += `${JSON.stringify(item)}\n`;
        }
      });
      output += `${spaces}]\n`;
    } else {
      for (const [key, value] of Object.entries(data)) {
        output += `${spaces}${key}: `;
        if (typeof value === 'object' && value !== null) {
          output += '\n' + formatDataForText(value, indent + 1);
        } else {
          output += `${JSON.stringify(value)}\n`;
        }
      }
    }
  } else {
    output += `${spaces}${JSON.stringify(data)}\n`;
  }
  
  return output;
}

// Main export function
async function exportFirebaseStructure() {
  console.log('Starting Firebase structure export...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = 'firebase-exports';
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  try {
    // Export Firestore
    console.log('Starting Firestore export...');
    const firestoreData = await exportFirestoreStructure();
    
    // Export Realtime Database (skip if it fails)
    console.log('Starting Realtime Database export...');
    const realtimeData = await exportRealtimeDBStructure();
    
    // Create comprehensive text report
    let textReport = `Firebase Database Structure Export\n`;
    textReport += `Generated on: ${new Date().toISOString()}\n`;
    textReport += `Project ID: thecoffee-b780f\n`;
    textReport += `${'='.repeat(50)}\n\n`;
    
    // Firestore section
    textReport += `FIRESTORE DATABASE\n`;
    textReport += `${'='.repeat(20)}\n\n`;
    
    if (firestoreData.error) {
      textReport += `Error: ${firestoreData.error}\n\n`;
    } else {
      const firestoreCollections = Object.keys(firestoreData);
      textReport += `Total Collections: ${firestoreCollections.length}\n`;
      textReport += `Collections: ${firestoreCollections.join(', ')}\n\n`;
      
      for (const [collectionName, collectionData] of Object.entries(firestoreData)) {
        textReport += `Collection: ${collectionName}\n`;
        textReport += `${'-'.repeat(30)}\n`;
        textReport += `Documents: ${Object.keys(collectionData).length}\n\n`;
        
        for (const [docId, docData] of Object.entries(collectionData)) {
          textReport += `  Document ID: ${docId}\n`;
          if (docData.metadata) {
            textReport += `    Created: ${docData.metadata.createTime}\n`;
            textReport += `    Updated: ${docData.metadata.updateTime}\n`;
          }
          textReport += `    Data:\n`;
          textReport += formatDataForText(docData.data, 3);
          
          if (docData.subcollections) {
            textReport += `    Subcollections:\n`;
            for (const [subCollName, subCollData] of Object.entries(docData.subcollections)) {
              textReport += `      ${subCollName} (${Object.keys(subCollData).length} documents)\n`;
              for (const [subDocId, subDocData] of Object.entries(subCollData)) {
                textReport += `        Document ID: ${subDocId}\n`;
                textReport += formatDataForText(subDocData.data, 5);
              }
            }
          }
          textReport += '\n';
        }
        textReport += '\n';
      }
    }
    
    // Realtime Database section
    textReport += `REALTIME DATABASE\n`;
    textReport += `${'='.repeat(20)}\n\n`;
    
    if (realtimeData.skipped) {
      textReport += `Skipped due to error: ${realtimeData.error}\n`;
      textReport += `Note: This is normal if you're not using Realtime Database.\n\n`;
    } else if (realtimeData.error) {
      textReport += `Error: ${realtimeData.error}\n\n`;
    } else {
      textReport += `Structure:\n`;
      textReport += formatDataForText(realtimeData, 0);
    }
    
    // Write files
    const textFilePath = path.join(outputDir, `firebase-structure-${timestamp}.txt`);
    const jsonFilePath = path.join(outputDir, `firebase-structure-${timestamp}.json`);
    
    // Write text report
    fs.writeFileSync(textFilePath, textReport);
    
    // Write JSON data
    const jsonData = {
      exportTimestamp: new Date().toISOString(),
      projectId: 'thecoffee-b780f',
      firestore: firestoreData,
      realtimeDatabase: realtimeData
    };
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
    
    console.log(`\nExport completed!`);
    console.log(`Text report: ${textFilePath}`);
    console.log(`JSON data: ${jsonFilePath}`);
    
    // Summary of what was exported
    if (firestoreData.error) {
      console.log(`⚠️  Firestore: Failed to export`);
    } else {
      const collectionCount = Object.keys(firestoreData).length;
      console.log(`✅ Firestore: Exported ${collectionCount} collections`);
    }
    
    if (realtimeData.skipped) {
      console.log(`⏭️  Realtime Database: Skipped (not configured or no access)`);
    } else if (realtimeData.error) {
      console.log(`⚠️  Realtime Database: Failed to export`);
    } else {
      console.log(`✅ Realtime Database: Exported successfully`);
    }
    
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    // Close the app
    await admin.app().delete();
  }
}

// Run the export
if (require.main === module) {
  exportFirebaseStructure().catch(console.error);
}

module.exports = { exportFirebaseStructure, exportFirestoreStructure, exportRealtimeDBStructure };
