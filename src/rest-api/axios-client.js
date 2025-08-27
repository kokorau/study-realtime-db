import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

class RestApiClient {
  constructor() {
    this.baseURL = process.env.FIREBASE_DATABASE_URL;
    this.authToken = process.env.FIREBASE_AUTH_TOKEN;
    
    if (!this.baseURL) {
      throw new Error('FIREBASE_DATABASE_URL is not configured');
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    this.setupInterceptors();
  }
  
  setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('REST API Request', {
          method: config.method,
          url: config.url,
          data: config.data
        });
        return config;
      },
      (error) => {
        logger.error('REST API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );
    
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('REST API Response', {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error) => {
        logger.error('REST API Response Error', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }
  
  buildUrl(path) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${cleanPath}.json`;
    return this.authToken ? `${url}?auth=${this.authToken}` : url;
  }
  
  async get(path) {
    try {
      const url = this.buildUrl(path);
      const response = await this.client.get(url);
      return {
        success: true,
        data: response.data,
        path: path,
        actualUrl: `${this.baseURL}${url}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: path,
        statusCode: error.response?.status
      };
    }
  }
  
  async put(path, data) {
    try {
      const url = this.buildUrl(path);
      const response = await this.client.put(url, data);
      return {
        success: true,
        data: response.data,
        path: path,
        operation: 'PUT',
        actualUrl: `${this.baseURL}${url}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: path,
        operation: 'PUT',
        statusCode: error.response?.status
      };
    }
  }
  
  async patch(path, data) {
    try {
      const url = this.buildUrl(path);
      const response = await this.client.patch(url, data);
      return {
        success: true,
        data: response.data,
        path: path,
        operation: 'PATCH',
        actualUrl: `${this.baseURL}${url}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: path,
        operation: 'PATCH',
        statusCode: error.response?.status
      };
    }
  }
  
  async delete(path) {
    try {
      const url = this.buildUrl(path);
      const response = await this.client.delete(url);
      return {
        success: true,
        data: response.data,
        path: path,
        operation: 'DELETE'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: path,
        operation: 'DELETE',
        statusCode: error.response?.status
      };
    }
  }
  
  async multiPathUpdate(basePath, updates) {
    try {
      const url = this.buildUrl(basePath);
      const response = await this.client.patch(url, updates);
      return {
        success: true,
        data: response.data,
        basePath: basePath,
        updates: updates,
        operation: 'MULTI_PATH_UPDATE',
        actualUrl: `${this.baseURL}${url}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        basePath: basePath,
        updates: updates,
        operation: 'MULTI_PATH_UPDATE',
        statusCode: error.response?.status
      };
    }
  }
}

export default RestApiClient;