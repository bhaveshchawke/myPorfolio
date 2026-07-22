const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

const dbName = process.env.DB_NAME;

let db;
let clientPromise;

async function connectDB() {
  if (db) return db; // Already connected
  if (clientPromise) {
    await clientPromise;
    return db;
  }

  const client = new MongoClient(uri);
  clientPromise = client.connect().then(() => {
    console.log(
      "MongoDB (Native Driver) se connection successful ho gaya hai! 🎉",
    );
    db = client.db(dbName);
  }).catch((error) => {
    console.error(error);
    clientPromise = null;
    throw error;
  });

  await clientPromise;
  return db;
}

function getDB() {
  if (!db) {
    throw new Error(
      "Database abhi connect nahi hua hai! Pehle connectDB call karein.",
    );
  }
  return db;
}
module.exports = { connectDB, getDB };
