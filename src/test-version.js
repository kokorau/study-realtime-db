import { SDK_VERSION } from 'firebase/app';
import SdkClient from './sdk/sdk-client.js';

console.log('Firebase SDK Version:', SDK_VERSION);

const client = new SdkClient();

async function test() {
  // Test with leading slash
  const result1 = await client.updateValue('test-version/base', {
    '/absolute/path': 'test-absolute',
    'relative/path': 'test-relative'
  });
  
  console.log('Update result:', result1.success ? 'SUCCESS' : 'FAILED');
  
  // Check where data was written
  const check1 = await client.getValue('test-version/base/absolute/path');
  const check2 = await client.getValue('/absolute/path');
  
  console.log('Data at test-version/base/absolute/path:', check1.exists);
  console.log('Data at /absolute/path:', check2.exists);
  
  process.exit(0);
}

test();
