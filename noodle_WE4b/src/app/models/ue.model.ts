export interface Ue {
  id: string;               // Identifiant unique
  code: string;             // Code de l'UE (ex. MT101)
  intitule: string;         // Nom de l'UE
  image?: string;           // URL de l'image de l'UE (facultatif)
  description?: string;     // Description de l'UE (facultatif)
  ects: number;             // Nombre de crédits ECTS
  participants?: string[];  // Liste des IDs des utilisateurs inscrits à cet UE
}
