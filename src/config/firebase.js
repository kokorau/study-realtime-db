import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let app = null;
let database = null;
let adminApp = null;
let adminDatabase = null;

export function initializeFirebaseSDK() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
  }
  return { app, database };
}

export function initializeFirebaseAdmin() {
  if (!adminApp) {
    try {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      if (serviceAccountPath) {
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL
        });
      } else {
        adminApp = admin.initializeApp({
          databaseURL: process.env.FIREBASE_DATABASE_URL
        });
      }
      adminDatabase = adminApp.database();
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      throw error;
    }
  }
  return { adminApp, adminDatabase };
}

export function getFirebaseConfig() {
  return {
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    authToken: process.env.FIREBASE_AUTH_TOKEN,
    projectId: process.env.FIREBASE_PROJECT_ID
  };
}

export function closeConnections() {
  if (app) {
    app = null;
    database = null;
  }
  if (adminApp) {
    return adminApp.delete().then(() => {
      adminApp = null;
      adminDatabase = null;
    });
  }
  return Promise.resolve();
}