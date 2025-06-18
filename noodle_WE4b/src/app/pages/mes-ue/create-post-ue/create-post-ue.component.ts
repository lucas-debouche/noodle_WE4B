import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PostsService } from '../../../services/posts.service';
import { Post } from '../../../models/post.model';
import { Priorite } from '../../../models/priorite.model';
import { PrioriteService } from '../../../services/priorite.service';

@Component({
  selector: 'app-create-post-ue',
  templateUrl: './create-post-ue.component.html',
  styleUrls: ['./create-post-ue.component.scss']
})
export class CreatePostUeComponent {
  @Input() ueId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() postCreated = new EventEmitter<Post>();
  postForm: FormGroup;
  uploading = false;
  errorMsg = '';
  fileToUpload: File | null = null;
  priorites: Priorite[] = [];

  types = [
    { value: 'message', label: 'Message' },
    { value: 'fichier', label: 'Fichier' },
    { value: 'devoir', label: 'Devoir' }
  ];

  constructor(
    private fb: FormBuilder,
    private postsService: PostsService,
    private prioriteService: PrioriteService,
  ) {
    this.postForm = this.fb.group({
      titre: ['', Validators.required],
      contenu: [''],
      type: ['message', Validators.required],
      fichier: [null],
      priorite: ['', Validators.required],
      date_publication: [new Date().toISOString().substring(0, 16), Validators.required],
      date_rendu: [''],
      categorie: ['TP', Validators.required]
    });
    this.prioriteService.getPriorites().subscribe((priorites: Priorite[]) => {
      this.priorites = priorites;
    });
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.fileToUpload = event.target.files[0];
    }
  }

  submit() {
    if (this.postForm.invalid || this.uploading) return;
    this.uploading = true;
    const formData = new FormData();
    formData.append('titre', this.postForm.value.titre);
    formData.append('contenu', this.postForm.value.contenu || '');
    formData.append('type', this.postForm.value.type);
    formData.append('ue_id', this.ueId);
    if (this.fileToUpload) {
      formData.append('fichier', this.fileToUpload);
    }
    this.postsService.createPost(formData).subscribe({
      next: (post) => {
        this.postCreated.emit(post);
        this.uploading = false;
      },
      error: (err) => {
        this.errorMsg = 'Erreur lors de la création du post';
        this.uploading = false;
      }
    });
  }

  closeModal() {
    this.close.emit();
  }
}
