export interface Post {
  id: string;         // Identifiant unique
  titre: string;      // Titre du post
  contenu: string;    // Contenu du post
  priorite: string;   // Priorité du post (ex. information, important)
  type: string;       // Type de contenu (ex. fichier, devoir...)
  auteur: string;     // ID de l'utilisateur auteur du post
  ue: string;         // ID de l'UE associée au post
  dateCreation?: Date; // Date de création
}
