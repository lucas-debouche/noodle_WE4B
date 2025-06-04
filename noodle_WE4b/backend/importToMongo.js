const fs = require('fs');
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017'; // Connexion locale
const dbName = 'noodle';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connecté à MongoDB local");

    const db = client.db(dbName);
    const raw = fs.readFileSync('./noodle.json');
    const data = JSON.parse(raw);

    for (const item of data) {
      if (item.type === 'table') {
        const collectionName = item.name;
        const documents = item.data;

        if (documents && documents.length > 0) {
          const collection = db.collection(collectionName);
          await collection.deleteMany({}); // vide la collection avant
          await collection.insertMany(documents);
          console.log(`Importé ${documents.length} documents dans ${collectionName}`);
        } else {
          console.log(`Collection ${collectionName} vide ou absente`);
        }
      }
    }

    console.log("Importation terminée !");
  } catch (err) {
    console.error("Erreur :", err);
  } finally {
    await client.close();
  }
}

run();
