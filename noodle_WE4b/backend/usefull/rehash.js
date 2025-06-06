const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

async function generateNewPasswords() {
  const client = new MongoClient("mongodb://localhost:27017");
  await client.connect();

  const db = client.db("noodle");
  const users = db.collection("utilisateur");

  const allUsers = await users.find({}).toArray();

  const updatedUsers = [];

  for (const user of allUsers) {
    const newPassword = generateRandomPassword(12); // ou 8, comme tu veux
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await users.updateOne(
      { _id: user._id },
      { $set: { mot_passe: hashedPassword } }
    );

    updatedUsers.push({
      email: user.email || user.username, // selon ce que tu as
      newPassword,
    });
  }

  await client.close();

  // Affiche tous les nouveaux mots de passe
  console.log("Nouveaux mots de passe générés :");
  console.table(updatedUsers);
}

function generateRandomPassword(length = 12) {
  if (length < 10) {
    throw new Error("Le mot de passe doit contenir au moins 10 caractères.");
  }

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+[]{}|;:,.<>?';

  let password = '';

  // Ajouter une lettre majuscule
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));

  // Ajouter une lettre minuscule (pour diversifier un peu)
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));

  // Ajouter un chiffre
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));

  // Ajouter deux caractères spéciaux
  for (let i = 0; i < 2; i++) {
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  }

  // Compléter le reste du mot de passe avec des caractères aléatoires
  const allChars = uppercase + lowercase + numbers + specialChars;
  const remainingLength = length - password.length;

  for (let i = 0; i < remainingLength; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Mélanger les caractères pour éviter un ordre prévisible
  password = password.split('').sort(() => Math.random() - 0.5).join('');

  return password;
}

generateNewPasswords();
