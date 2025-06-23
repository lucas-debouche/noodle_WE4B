import {User} from "./user.model";

export interface ParticipantWithUeInfo extends User {
  dateInscription?: string;     // Date d'inscription à cette UE
  statut?: 'actif' | 'inactif'; // Statut dans cette UE
  promotion?: string;           // Promotion (pour les étudiants)
  specialite?: string;          // Spécialité
  telephone?: string;           // Téléphone
  dateNaissance?: string;       // Date de naissance
  adresse?: string;            // Adresse
  noteFinale?: number;         // Note finale dans l'UE
  presence?: number;           // Taux de présence
}
