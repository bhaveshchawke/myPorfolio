const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

const dbName = process.env.DB_NAME;

let db;
async function connectDB() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log(
      "MongoDB (Native Driver) se connection successful ho gaya hai! 🎉",
    );
    db = client.db(dbName);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
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
