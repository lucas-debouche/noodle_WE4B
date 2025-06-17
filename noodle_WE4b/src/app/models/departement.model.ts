export interface Departement {
  id: string;               // Identifiant unique
  nom: string;              // Nom du département
  description?: string;     // Description du département (facultatif)
  createdAt?: string;       // Date de création
  updatedAt?: string;       // Date de mise à jour
}
