import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PostsService } from '../../../services/posts.service';
import { TypeService } from '../../../services/type.service';
import { PrioriteService } from '../../../services/priorite.service';
import { Post } from '../../../models/post.model';
import { Type } from '../../../models/type.model';
import { Priorite } from '../../../models/priorite.model';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-create-post-ue',
  templateUrl: './create-post-ue.component.html',
  styleUrls: ['./create-post-ue.component.scss']
})
export class CreatePostUeComponent implements OnInit {
  @Input() ueId!: string;
  @Input() currentUser!: User
  @Output() postCreated = new EventEmitter<Post>();
  @Output() close = new EventEmitter<void>();

  postForm!: FormGroup;
  types: Type[] = [];
  priorites: Priorite[] = [];
  uploading = false;
  errorMsg = '';
  file: File | null = null;
  fileTouched = false;
  minDateRendu = '';
  type: string = 'message';

  constructor(
    private fb: FormBuilder,
    private postsService: PostsService,
    private typeService: TypeService,
    private prioriteService: PrioriteService,
  ) {}

  ngOnInit(): void {
    this.typeService.getTypes().subscribe(types => {
      this.types = types;
      // Définit la valeur par défaut du type si disponible
      if (this.types.length > 0) {
        this.postForm.get('type')?.setValue(this.types[0]._id);
        this.type = this.types[0]._id;
      }
    });

    this.prioriteService.getPriorites().subscribe(priorites => {
      this.priorites = priorites;
      // Définit la valeur par défaut de la priorité si disponible
      if (this.priorites.length > 0) {
        this.postForm.get('priorite')?.setValue(this.priorites[0]._id);
      }
    });

    this.postForm = this.fb.group({
      titre: ['', [Validators.required, Validators.maxLength(100)]],
      type: ['', Validators.required],
      contenu: ['', Validators.required],
      priorite: ['', Validators.required],
      date_rendu: [''],
      categorie: ['TP', Validators.required]
    });

    this.postForm.get('type')?.valueChanges.subscribe(value => {
      this.type = value;
    });

    this.postForm.get('type')?.valueChanges.subscribe(val => {
      this.type = val;
      if (val === 'devoir') {
        this.postForm.get('date_rendu')?.setValidators([Validators.required]);
      } else {
        this.postForm.get('date_rendu')?.clearValidators();
      }
      this.postForm.get('date_rendu')?.updateValueAndValidity();
    });

    // Date minimale pour le rendu (maintenant)
    this.minDateRendu = new Date().toISOString().slice(0, 16);
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    this.file = file ? file : null;
  }

  fileRequiredError() {
    return (this.type === 'fichier' || this.type === 'devoir') && !this.file && this.fileTouched;
  }

  closeModal() {
    this.close.emit();
  }

  submit() {
    if (this.postForm.invalid || (this.type === 'fichier' || this.type === 'devoir') && !this.file) {
      this.errorMsg = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    this.uploading = true;
    this.errorMsg = '';

    // Récupérer l'ID du type (depuis la liste des types)
    const typeObj = this.types.find(t => t.nom === this.type || t._id === this.type);
    const type_id = typeObj?._id || this.type;

    const payload: any = {
      utilisateur_id: this.currentUser._id,
      type_id: type_id,
      priorite_id: this.postForm.value.priorite,
      ue_id: this.ueId,
      titre: this.postForm.value.titre,
      contenu: this.postForm.value.contenu,
      categorie: this.postForm.value.categorie,
      date_publication: new Date().toISOString(),
    };

    if (this.type === 'devoir') {
      payload.date_rendu = this.postForm.value.date_rendu;
    }
    if (this.selectedTypeNom === 'fichier' || this.selectedTypeNom === 'devoir') {
      const formData = new FormData();
      Object.keys(payload).forEach(key => formData.append(key, payload[key]));
      if (this.file) {
        formData.append('fichier', this.file, this.file.name);
      }
      this.postsService.createPost(formData, true).subscribe({
        next: post => {
          this.uploading = false;
          this.postCreated.emit(post);
        },
        error: err => {
          this.uploading = false;
          this.errorMsg = err.error?.error || 'Erreur lors de la création du post.';
        }
      });
    } else {
      // Envoi JSON
      this.postsService.createPost(payload, false).subscribe({
        next: post => {
          this.uploading = false;
          this.postCreated.emit(post);
        },
        error: err => {
          this.uploading = false;
          this.errorMsg = err.error?.error || 'Erreur lors de la création du post.';
        }
      });
    }
  }

  get selectedTypeNom(): string {
    const typeId = this.postForm.get('type')?.value;
    const typeObj = this.types.find(t => t._id === typeId);
    return typeObj ? typeObj.nom : '';
  }
}
