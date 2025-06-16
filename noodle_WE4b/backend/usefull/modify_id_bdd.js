// backend/scripts/migrate-ids.js
require('dotenv').config();
const mongoose = require('mongoose');

const collectionsToMap = [
  { name: 'utilisateur', key: 'id' },
  { name: 'ue', key: 'id' },
  { name: 'type', key: 'id' },
  { name: 'priorite', key: 'id' },
  { name: 'departement', key: 'id' },
  { name: 'role', key: 'id' },
];

const referenceFields = {
  post: {
    utilisateur_id: { ref: 'utilisateur' },
    ue_id: { ref: 'ue' },
    type_id: { ref: 'type' },
    priorite_id: { ref: 'priorite' },
  },
  utilisateur_role: {
    utilisateur_id: { ref: 'utilisateur' },
    role_id: { ref: 'role' },
  },
  utilisateur_ue: {
    utilisateur_id: { ref: 'utilisateur' },
    ue_id: { ref: 'ue' },
  },
  ue_departement: {
    ue_id: { ref: 'ue' },
    departement_id: { ref: 'departement' },
  },
};

async function buildIdMaps(db) {
  const idMaps = {};
  for (const { name, key } of collectionsToMap) {
    const docs = await db.collection(name).find().toArray();
    idMaps[name] = {};
    for (const doc of docs) {
      if (doc[key]) idMaps[name][doc[key]] = doc._id;
    }
  }
  return idMaps;
}

async function updateReferences(db, idMaps) {
  for (const [colName, fields] of Object.entries(referenceFields)) {
    const docs = await db.collection(colName).find().toArray();
    for (const doc of docs) {
      let modified = false;
      const update = {};
      for (const [field, { ref }] of Object.entries(fields)) {
        if (typeof doc[field] === 'string' && idMaps[ref][doc[field]]) {
          update[field] = idMaps[ref][doc[field]];
          modified = true;
        }
      }
      // Prépare l'opération d'update sans toucher à id dans $set
      const unset = {};
      if (doc.id) {
        unset.id = "";
        modified = true;
      }
      if (modified) {
        await db.collection(colName).updateOne(
          { _id: doc._id },
          {
            ...(Object.keys(update).length ? { $set: update } : {}),
            ...(Object.keys(unset).length ? { $unset: unset } : {})
          }
        );
        console.log(`Document ${doc._id} dans ${colName} mis à jour`);
      }
    }
  }
}

async function removeIdEverywhere(db) {
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    const result = await db.collection(col.name).updateMany(
      { id: { $exists: true } },
      { $unset: { id: "" } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Collection ${col.name} : ${result.modifiedCount} documents nettoyés (champ id supprimé)`);
    }
  }
}

async function main() {
  await mongoose.connect('mongodb://localhost:27017/noodle');
  const db = mongoose.connection.db;

  const idMaps = await buildIdMaps(db);
  await updateReferences(db, idMaps);
  await removeIdEverywhere(db);

  await mongoose.disconnect();
  console.log('Migration terminée');
}

main().catch(console.error);
