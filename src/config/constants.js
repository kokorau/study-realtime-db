export const TEST_SCENARIOS = {
  SINGLE_PATH: {
    WITH_LEADING_SLASH: 'single-path-with-slash',
    WITHOUT_LEADING_SLASH: 'single-path-without-slash',
    NESTED_WITH_SLASH: 'nested-path-with-slash',
    NESTED_WITHOUT_SLASH: 'nested-path-without-slash'
  },
  MULTI_PATH: {
    ALL_WITH_SLASH: 'multi-path-all-slash',
    ALL_WITHOUT_SLASH: 'multi-path-all-without-slash',
    MIXED_SLASH: 'multi-path-mixed-slash'
  },
  EDGE_CASES: {
    EMPTY_PATH: 'edge-empty-path',
    DOUBLE_SLASH: 'edge-double-slash',
    TRAILING_SLASH: 'edge-trailing-slash',
    ROOT_PATH: 'edge-root-path'
  }
};

export const TEST_DATA = {
  SIMPLE_STRING: 'test-value',
  SIMPLE_NUMBER: 42,
  SIMPLE_BOOLEAN: true,
  SIMPLE_OBJECT: {
    name: 'Test User',
    age: 25,
    active: true
  },
  NESTED_OBJECT: {
    style: {
      color: 'blue',
      fontSize: 16,
      fontWeight: 'bold'
    },
    children: [
      { id: 1, type: 'text' },
      { id: 2, type: 'image' }
    ],
    metadata: {
      created: '2024-01-01',
      modified: '2024-01-02'
    }
  }
};

export const PATH_PATTERNS = {
  ABSOLUTE: {
    SINGLE: '/users/user1',
    NESTED: '/projects/projectId/pageViews/pageUuid',
    WITH_PROPERTY: '/users/user1/name'
  },
  RELATIVE: {
    SINGLE: 'users/user1',
    NESTED: 'projects/projectId/pageViews/pageUuid',
    WITH_PROPERTY: 'users/user1/name'
  },
  EDGE_CASES: {
    EMPTY: '',
    ROOT: '/',
    DOUBLE_SLASH: '//users//user1',
    TRAILING_SLASH: 'users/user1/',
    LEADING_TRAILING: '/users/user1/'
  }
};

export const DB_STRUCTURE = {
  BASE_PATH: 'verification-tests',
  PROJECTS_PATH: 'projects',
  PAGE_VIEWS_PATH: 'pageViews',
  TEST_PROJECT_ID: 'test-project-001',
  TEST_PAGE_UUID: 'test-page-uuid-001'
};

export const RESULT_KEYS = {
  TEST_NAME: 'testName',
  API_TYPE: 'apiType',
  PATH_USED: 'pathUsed',
  OPERATION: 'operation',
  SUCCESS: 'success',
  ACTUAL_PATH_WRITTEN: 'actualPathWritten',
  DATA_WRITTEN: 'dataWritten',
  ERROR: 'error',
  TIMESTAMP: 'timestamp',
  DURATION_MS: 'durationMs'
};

export const API_TYPES = {
  REST: 'REST_API',
  SDK: 'FIREBASE_SDK'
};

export const OPERATIONS = {
  SET: 'SET',
  UPDATE: 'UPDATE',
  PATCH: 'PATCH',
  PUT: 'PUT',
  MULTI_PATH_UPDATE: 'MULTI_PATH_UPDATE'
};