import { Component, ElementRef, Input, ViewChild, Host, Optional, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UserRegistrationComponent } from '../../pages/user-registration/user-registration.component';


@Component({
  selector: 'app-user-photo-upload',
  templateUrl: './user-photo-upload.component.html',
  styleUrls: ['./user-photo-upload.component.scss']
})
export class UserPhotoUploadComponent {
  @Input() form!: FormGroup;
  @Input() resetPhotoTrigger: number = 0;
  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(@Optional() @Host() private parent: UserRegistrationComponent) {}

  isDragOver: boolean = false;
  photoFile: File | null = null;
  photoBase64: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetPhotoTrigger'] && !changes['resetPhotoTrigger'].firstChange) {
      this.removePhoto();
    }
  }

  // Gestion de l'upload de fichiers
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.processPhotoFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.processPhotoFile(file);
      } else {
        this.showError('Veuillez sélectionner un fichier image valide.');
      }
    }
  }

  removePhoto(): void {
    this.photoFile = null;
    this.photoBase64 = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private processPhotoFile(file: File): void {
    // Vérification de la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.showError('La taille du fichier ne doit pas dépasser 5MB.');
      return;
    }

    // Vérification du type
    if (!file.type.startsWith('image/')) {
      this.showError('Veuillez sélectionner un fichier image valide.');
      return;
    }

    this.photoFile = file;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.photoBase64 = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  private showError(message: string): void {
    if (this.parent) {
      this.parent['showError'](message);
    }
  }

}

