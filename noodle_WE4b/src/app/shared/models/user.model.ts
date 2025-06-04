export interface User {
  id: string;           // Identifiant unique de l'utilisateur
  nom: string;          // Nom de l'utilisateur
  prenom: string;       // Prénom de l'utilisateur
  email: string;        // Adresse email de l'utilisateur
  motPasse?: string;    // Mot de passe (optionnel pour l'usage frontend)
  photo?: string;       // Photo (URL ou contenu base64)
  roles: string[];      // Rôles (ex. ['ROLE_ADMIN', 'ROLE_USER'])
  ues?: string[];       // UEs associées (liste des IDs)
}
