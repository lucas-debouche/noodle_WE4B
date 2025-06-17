export interface Post {
  _id: string; // ObjectId sous forme de string
  utilisateur_id: {
    _id?: string;
    nom?: string;
    prenom?: string;
    email?: string;
  } | string; // Peut être string (id) ou objet utilisateur peuplé
  type_id: { _id: string; nom: string } | string; // Peut être string (id) ou objet type peuplé
  priorite_id: string;    // ObjectId de la priorité
  ue_id: string;          // ObjectId de l'UE
  titre: string;
  contenu: string;
  categorie: 'info' | 'CM' | 'TD' | 'TP';
  fichier_nom: string | null;
  fichier_type: string | null;
  fichier_taille: number | null;
  date_publication: string | Date;
  date_rendu: string | Date | null;
}
