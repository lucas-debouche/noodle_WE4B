export interface Ue {
  id: string;             // Identifiant unique
  code: string;           // Code de l'UE (ex. MT101)
  nom: string;            // Nom de l'UE
  description?: string;   // Description de l'UE (facultatif)
  participants?: string[]; // Liste des IDs des utilisateurs inscrits à cet UE
}
