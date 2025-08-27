import { ref, set, update, get, push } from 'firebase/database';
import { initializeFirebaseSDK } from '../config/firebase.js';
import logger from '../utils/logger.js';

class SdkClient {
  constructor() {
    const { app, database } = initializeFirebaseSDK();
    this.app = app;
    this.database = database;
    logger.info('Firebase SDK Client initialized');
  }
  
  async setValue(path, data) {
    try {
      logger.debug('SDK set operation', { path, data });
      const dataRef = ref(this.database, path);
      await set(dataRef, data);
      return {
        success: true,
        path: path,
        operation: 'SET',
        data: data
      };
    } catch (error) {
      logger.error('SDK set failed', { path, error: error.message });
      return {
        success: false,
        path: path,
        operation: 'SET',
        error: error.message
      };
    }
  }
  
  async updateValue(path, updates) {
    try {
      logger.debug('SDK update operation', { path, updates });
      const dataRef = ref(this.database, path);
      await update(dataRef, updates);
      return {
        success: true,
        path: path,
        operation: 'UPDATE',
        updates: updates
      };
    } catch (error) {
      logger.error('SDK update failed', { path, error: error.message });
      return {
        success: false,
        path: path,
        operation: 'UPDATE',
        error: error.message
      };
    }
  }
  
  async getValue(path) {
    try {
      logger.debug('SDK get operation', { path });
      const dataRef = ref(this.database, path);
      const snapshot = await get(dataRef);
      
      return {
        success: true,
        path: path,
        exists: snapshot.exists(),
        data: snapshot.exists() ? snapshot.val() : null
      };
    } catch (error) {
      logger.error('SDK get failed', { path, error: error.message });
      return {
        success: false,
        path: path,
        error: error.message
      };
    }
  }
  
  async multiPathUpdate(basePath, updates) {
    try {
      logger.debug('SDK multi-path update operation', { basePath, updates });
      
      if (basePath === '' || basePath === '/') {
        const rootRef = ref(this.database);
        await update(rootRef, updates);
      } else {
        const baseRef = ref(this.database, basePath);
        await update(baseRef, updates);
      }
      
      return {
        success: true,
        basePath: basePath,
        operation: 'MULTI_PATH_UPDATE',
        updates: updates
      };
    } catch (error) {
      logger.error('SDK multi-path update failed', { basePath, error: error.message });
      return {
        success: false,
        basePath: basePath,
        operation: 'MULTI_PATH_UPDATE',
        error: error.message
      };
    }
  }
  
  async pushValue(path, data) {
    try {
      logger.debug('SDK push operation', { path, data });
      const dataRef = ref(this.database, path);
      const newRef = await push(dataRef, data);
      return {
        success: true,
        path: path,
        operation: 'PUSH',
        key: newRef.key,
        data: data
      };
    } catch (error) {
      logger.error('SDK push failed', { path, error: error.message });
      return {
        success: false,
        path: path,
        operation: 'PUSH',
        error: error.message
      };
    }
  }
  
  async verifyPathData(paths) {
    const results = {};
    
    for (const path of paths) {
      const result = await this.getValue(path);
      results[path] = {
        exists: result.exists,
        data: result.data,
        error: result.error
      };
    }
    
    return results;
  }
}

export default SdkClient;