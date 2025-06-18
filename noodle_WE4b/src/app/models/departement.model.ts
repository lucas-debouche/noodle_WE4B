export interface Departement {
  id: string;
  nom: string;
  description?: string;
  code?: string;
  responsable?: string; // ID du responsable
  actif?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateDepartementRequest {
  nom: string;
  description?: string;
  code?: string;
  responsable?: string;
}

export interface UpdateDepartementRequest {
  nom?: string;
  description?: string;
  code?: string;
  responsable?: string;
  actif?: boolean;
}
