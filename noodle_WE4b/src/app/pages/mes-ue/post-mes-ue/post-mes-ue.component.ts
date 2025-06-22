import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Post } from '../../../models/post.model';
import { User } from "../../../models/user.model";
import { UtilisateurService } from "../../../services/utilisateur.service";
import { PostsService } from "../../../services/posts.service";

@Component({
  selector: 'app-post-mes-ue',
  templateUrl: './post-mes-ue.component.html',
  styleUrls: ['./post-mes-ue.component.scss']
})
export class PostMesUeComponent implements OnInit {
  @Input() post!: Post;
  @Input() fait: boolean = false;
  @Input() totalUsers: number = 0;
  @Input() utilisateursUeIds: string[] = []; // Liste des ids des utilisateurs assignés à l'UE
  @Output() faitChange = new EventEmitter<boolean>();
  currentUser!: User;
  faitCount: number = 0;
  devoirFile: File | null = null;
  devoirFileName: string = '';
  showRendusModal = false;
  showNoteInputIndex: number | null = null;
  noteInputs: { [index: number]: number } = {};
  renduUtilisateur: any = null;
  etatRendu: string = '';

  constructor(
    private utilisateurService: UtilisateurService,
    private postsService: PostsService
  ) { }

  ngOnInit(): void {
    this.utilisateurService.getUtilisateurActuel().subscribe({
      next: (data: User) => {
        this.currentUser = data;
        const userId = (this.currentUser as any)._id || (this.currentUser as any).id;
        if (this.post.faitPar && Array.isArray(this.post.faitPar)) {
          this.fait = this.post.faitPar.includes(userId);
          this.updateFaitCount();
        } else {
          this.faitCount = 0;
        }
        // Recherche du rendu de l'utilisateur connecté pour ce devoir
        if (this.post.rendus && Array.isArray(this.post.rendus)) {
          this.renduUtilisateur = this.post.rendus.find(
            r => (r.utilisateur_id && (r.utilisateur_id._id || r.utilisateur_id) === userId)
          );
          if (this.renduUtilisateur) {
            this.fait = true;
            this.devoirFileName = this.renduUtilisateur.fichier_nom;
            this.etatRendu = this.renduUtilisateur.etat_rendu;
          }
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de l\'utilisateur :', err);
      }
    });
    console.log(this.post.rendus);
  }

  updateFaitCount() {
    // Ne compte que les utilisateurs assignés à l'UE
    if (this.post.faitPar && Array.isArray(this.post.faitPar) && Array.isArray(this.utilisateursUeIds)) {
      this.faitCount = this.post.faitPar.filter((id: string) => this.utilisateursUeIds.includes(id)).length;
    } else {
      this.faitCount = 0;
    }
  }

  isUtilisateurObj(utilisateur: any): utilisateur is { nom?: string; prenom?: string } {
    return utilisateur && typeof utilisateur === 'object' && ('nom' in utilisateur || 'prenom' in utilisateur);
  }

  getTypeNom(post: Post): string {
    if (post.type_id && typeof post.type_id === 'object' && 'nom' in post.type_id) {
      return (post.type_id as any).nom;
    }
    return '';
  }

  toggleFait() {
    if (!this.currentUser) return;
    const userId = (this.currentUser as any)._id || (this.currentUser as any).id;
    if (!userId) return;
    const newFait = !this.fait;
    this.postsService.setFait(this.post._id, userId, newFait).subscribe({
      next: (res) => {
        this.fait = newFait;
        if (res && res.faitPar) {
          this.post.faitPar = res.faitPar;
          this.updateFaitCount();
        } else {
          this.faitCount = 0;
        }
        this.faitChange.emit(this.fait);
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du statut fait :', err);
      }
    });
  }

  getPrioriteNom(post: Post): string | undefined {
    //console.log(post);
    if (typeof post.priorite_id === 'object' && post.priorite_id !== null && 'nom' in post.priorite_id) {
      return (post.priorite_id as any).nom;
    }
    return undefined;
  }

  onDevoirFileChange(event: any) {
    const file = event.target.files[0];
    this.devoirFile = file ? file : null;
    this.devoirFileName = file ? file.name : '';
  }

  isProf(): boolean {
    return this.currentUser?.role?.includes('ROLE_PROF');
  }
  isUser(): boolean {
    return this.currentUser?.role?.includes('ROLE_USER');
  }

  submitDevoir() {
    if (!this.devoirFile) return;
    const formData = new FormData();
    formData.append('rendu', this.devoirFile);
    formData.append('utilisateur_id', this.currentUser._id);
    this.postsService.uploadRendu(this.post._id, formData).subscribe({
      next: () => {
        // Recharge le rendu utilisateur après soumission
        this.fait = true;
        this.devoirFileName = this.devoirFile?.name || '';
        // Optionnel : recharger le post ou juste ajouter le rendu localement
        if (!this.post.rendus) this.post.rendus = [];
        this.post.rendus.push({
          utilisateur_id: { _id: this.currentUser._id, nom: this.currentUser.nom, prenom: this.currentUser.prenom },
          fichier_nom: this.devoirFileName,
          fichier_type: this.devoirFile?.type,
          fichier_taille: this.devoirFile?.size,
          fichier_chemin: '', // Peut être mis à jour par un refresh ou une nouvelle requête
          date_rendu: new Date()
        });
        this.renduUtilisateur = this.post.rendus[this.post.rendus.length - 1];
      }
    });
  }

  enableModifyDevoir() {
    this.fait = false;
    this.devoirFile = null;
    this.devoirFileName = '';
    this.renduUtilisateur = null;
  }

  openRendusModal() {
    this.showRendusModal = true;
  }

  closeRendusModal() {
    this.showRendusModal = false;
  }

  toggleNoteInput(index: number) {
    if (this.showNoteInputIndex === index) {
      this.showNoteInputIndex = null;
    } else {
      this.showNoteInputIndex = index;
      const note = this.post.rendus && this.post.rendus[index]?.note;
      this.noteInputs[index] = note !== null && note !== undefined ? note : 0;
    }
  }

  validerNote(rendu: any, index: number) {
    const note = this.noteInputs[index];
    if (note === null || note === undefined || isNaN(note) || note < 0 || note > 20) {
      alert('Veuillez saisir une note valide entre 0 et 20.');
      return;
    }
    this.postsService.attribuerNote(this.post._id, rendu.utilisateur_id._id, note).subscribe({
      next: (res: any) => {
        if (this.post.rendus && this.post.rendus[index]) {
          this.post.rendus[index].note = note;
        }
        this.showNoteInputIndex = null;
      },
      error: () => {
        alert('Erreur lors de l\'attribution de la note.');
      }
    });
  }
}
