import { ref, set, get, update, remove } from 'firebase/database';
import axios from 'axios';
import logger from './logger.js';

export async function readFromPath(database, path) {
  try {
    const dataRef = ref(database, path);
    const snapshot = await get(dataRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    logger.error('Failed to read from path', { path, error: error.message });
    throw error;
  }
}

export async function writeToPath(database, path, data) {
  try {
    const dataRef = ref(database, path);
    await set(dataRef, data);
    return true;
  } catch (error) {
    logger.error('Failed to write to path', { path, error: error.message });
    throw error;
  }
}

export async function updatePath(database, path, updates) {
  try {
    const dataRef = ref(database, path);
    await update(dataRef, updates);
    return true;
  } catch (error) {
    logger.error('Failed to update path', { path, error: error.message });
    throw error;
  }
}

export async function deletePath(database, path) {
  try {
    const dataRef = ref(database, path);
    await remove(dataRef);
    return true;
  } catch (error) {
    logger.error('Failed to delete path', { path, error: error.message });
    throw error;
  }
}

export async function cleanupTestData(database, basePath) {
  try {
    logger.info('Cleaning up test data', { basePath });
    await deletePath(database, basePath);
    logger.info('Test data cleaned up successfully');
    return true;
  } catch (error) {
    logger.error('Failed to cleanup test data', { error: error.message });
    return false;
  }
}

export async function verifyPathExists(database, path) {
  const data = await readFromPath(database, path);
  return data !== null;
}

export async function getActualWrittenPath(database, expectedPaths = []) {
  const results = {};
  
  for (const path of expectedPaths) {
    const exists = await verifyPathExists(database, path);
    results[path] = exists;
    
    if (exists) {
      const data = await readFromPath(database, path);
      results[`${path}_data`] = data;
    }
  }
  
  return results;
}

export function buildRestUrl(baseUrl, path, authToken) {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const url = `${baseUrl}/${cleanPath}.json`;
  return authToken ? `${url}?auth=${authToken}` : url;
}

export async function restApiRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data !== null) {
      config.data = data;
    }
    
    const response = await axios(config);
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    logger.error('REST API request failed', { 
      method, 
      url, 
      error: error.message,
      response: error.response?.data 
    });
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
}

export function measureExecutionTime(startTime) {
  return Date.now() - startTime;
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}