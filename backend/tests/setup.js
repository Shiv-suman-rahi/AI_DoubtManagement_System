import mongoose from 'mongoose';

const TEST_URI = 'mongodb://127.0.0.1:27017/aidms_test';

export async function setupTestDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_URI);
  }
  return TEST_URI;
}

export async function teardownTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

export async function clearTestDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_URI);
  }
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
