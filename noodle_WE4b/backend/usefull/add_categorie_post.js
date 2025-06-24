// add-categories-cyclique.js
const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/noodle'; // Remplace par l'URL de ta base
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const postSchema = new mongoose.Schema({}, { strict: false });
const Post = mongoose.model('Post', postSchema, 'post');

const categories = ['info', 'CM', 'TD', 'TP'];

async function addCategoriesCyclique() {
  try {
    const posts = await Post.find({ categorie: { $exists: false } });
    let count = 0;
    for (let i = 0; i < posts.length; i++) {
      const categorie = categories[i % categories.length];
      await Post.updateOne({ _id: posts[i]._id }, { $set: { categorie } });
      count++;
    }
    console.log(`${count} posts mis à jour avec des catégories cycliques.`);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

addCategoriesCyclique();
