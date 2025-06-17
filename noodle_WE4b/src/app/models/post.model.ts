export interface Post {
  _id: string; // ObjectId sous forme de string
  utilisateur_id: string; // ObjectId de l'utilisateur
  type_id: string;        // ObjectId du type
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
