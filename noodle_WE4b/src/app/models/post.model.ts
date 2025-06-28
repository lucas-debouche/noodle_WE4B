export interface Rendu {
  utilisateur_id: {
    _id?: string;
    nom?: string;
    prenom?: string;
  }
  fichier_nom: string;
  fichier_type: string | undefined;
  fichier_taille: number | undefined;
  fichier_chemin: string;
  date_rendu: string | Date;
  note?: number | null;
  etat_rendu?: 'non rendu' | 'en attente' | 'corrigé';
  commentaire?: string;
}

export interface Post {
  _id: string;
  utilisateur_id: {
    _id?: string;
    nom?: string;
    prenom?: string;
    email?: string;
  } | string;
  type_id: { _id: string; nom: string } | string;
  priorite_id: { _id: string; nom: string } | string;
  ue_id: string;
  titre: string;
  contenu: string;
  categorie: 'informations' | 'CM' | 'TD' | 'TP';
  fichier_nom?: string | null;
  fichier_type?: string | null;
  fichier_taille?: number | null;
  fichier_chemin?: string | null;
  date_publication: string | Date;
  date_rendu?: string | Date | null;
  faitPar?: string[];
  rendus?: Rendu[];
}

