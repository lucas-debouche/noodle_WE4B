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
  @Input() currentUser!: User;
  @Output() postCreated = new EventEmitter<Post>();
  @Output() close = new EventEmitter<void>();

  postForm!: FormGroup;
  types: Type[] = [];
  priorites: Priorite[] = [];
  uploading = false;
  errorMsg = '';
  file: File | null = null;
  minDateRendu = '';
  isSubmitted = false;

  constructor(
    private fb: FormBuilder,
    private postsService: PostsService,
    private typeService: TypeService,
    private prioriteService: PrioriteService,
  ) {}

  ngOnInit(): void {
    this.isSubmitted = false;
    this.initForm();
    this.loadTypes();
    this.loadPriorites();
    this.setupFormListeners();
    this.setMinDateRendu();
  }

  private initForm(): void {
    this.postForm = this.fb.group({
      titre: ['', [Validators.required, Validators.maxLength(100)]],
      type: ['', Validators.required],
      contenu: [''],
      priorite: ['', Validators.required],
      date_rendu: [''],
      categorie: ['TP', Validators.required],
      fichier: [null]
    });
  }

  private loadTypes(): void {
    this.typeService.getTypes().subscribe(types => {
      this.types = types;
      if (this.types.length > 0) {
        this.postForm.get('type')?.setValue(this.types[0]._id);
      }
    });
  }

  private loadPriorites(): void {
    this.prioriteService.getPriorites().subscribe(priorites => {
      this.priorites = priorites;
      if (this.priorites.length > 0) {
        this.postForm.get('priorite')?.setValue(this.priorites[0]._id);
      }
    });
  }

  private setupFormListeners(): void {
    this.postForm.get('type')?.valueChanges.subscribe(val => {
      this.updateValidators(val);
    });
  }

  private updateValidators(typeId: string): void {
    const typeObj = this.types.find(t => t._id === typeId);
    const typeName = typeObj ? typeObj.nom : '';

    const contenuControl = this.postForm.get('contenu');
    const dateRenduControl = this.postForm.get('date_rendu');
    const fichierControl = this.postForm.get('fichier');

    contenuControl?.clearValidators();
    dateRenduControl?.clearValidators();
    fichierControl?.clearValidators();

    if (['message', 'fichier', 'devoir'].includes(typeName)) {
      contenuControl?.setValidators([Validators.required]);
    }
    if (typeName === 'devoir') {
      dateRenduControl?.setValidators([Validators.required]);
    }
    if (typeName === 'fichier') {
      fichierControl?.setValidators([Validators.required]);
    }

    contenuControl?.updateValueAndValidity();
    dateRenduControl?.updateValueAndValidity();
    fichierControl?.updateValueAndValidity();
  }

  private setMinDateRendu(): void {
    this.minDateRendu = new Date().toISOString().slice(0, 16);
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.file = file;
      this.postForm.patchValue({ fichier: file });
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  submit(): void {
    this.isSubmitted = true;
    this.markAllFieldsAsTouched();

    if (this.postForm.invalid || (this.selectedTypeNom === 'fichier' && !this.file)) {
      this.errorMsg = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    this.uploading = true;
    this.errorMsg = '';

    const payload = this.preparePayload();

    if (this.selectedTypeNom === 'fichier') {
      this.submitWithFile(payload);
    } else {
      this.submitWithoutFile(payload);
    }
  }

  private preparePayload(): any {
    const formValue = this.postForm.value;
    const payload: any = {
      utilisateur_id: this.currentUser._id,
      type_id: formValue.type,
      priorite_id: formValue.priorite,
      ue_id: this.ueId,
      titre: formValue.titre,
      contenu: formValue.contenu,
      categorie: formValue.categorie,
      date_publication: new Date().toISOString(),
    };

    if (this.selectedTypeNom === 'devoir' && formValue.date_rendu) {
      payload.date_rendu = new Date(formValue.date_rendu).toISOString();
    }

    return payload;
  }

  private submitWithFile(payload: any): void {
    const formData = new FormData();
    Object.keys(payload).forEach(key => formData.append(key, payload[key]));
    if (this.file) {
      formData.append('fichier', this.file, this.file.name);
    }
    this.sendPostRequest(formData, true);
  }

  private submitWithoutFile(payload: any): void {
    this.sendPostRequest(payload, false);
  }

  private sendPostRequest(data: any, isFormData: boolean): void {
    this.postsService.createPost(data, isFormData).subscribe({
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

  get selectedTypeNom(): string {
    const typeId = this.postForm.get('type')?.value;
    const typeObj = this.types.find(t => t._id === typeId);
    return typeObj ? typeObj.nom : '';
  }

  markAllFieldsAsTouched(): void {
    Object.keys(this.postForm.controls).forEach(field => {
      const control = this.postForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.postForm.get(fieldName);
    if (control?.invalid && (control.dirty || control.touched || this.isSubmitted)) {
      if (control.errors?.['required']) return 'Ce champ est requis.';
      if (control.errors?.['maxlength']) return `La longueur maximale est de ${control.errors['maxlength'].requiredLength} caractères.`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.postForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched || this.isSubmitted));
  }
}
