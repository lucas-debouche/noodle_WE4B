import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Post } from '../../../../models/post.model';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-devoir-content',
  templateUrl: './devoir-content.component.html',
  styleUrls: ['./devoir-content.component.scss']
})
export class DevoirContentComponent {
  @Input() post!: Post;
  @Input() currentUser!: User;
  @Input() renduUtilisateur: any;
  @Input() etatRendu: string = '';
  @Output() rendSubmit = new EventEmitter<File>();
  @Output() openCorrection = new EventEmitter<void>();
  @Output() openRendus = new EventEmitter<void>();

  devoirFile: File | null = null;
  devoirFileName: string = '';

  onDevoirFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.devoirFile = file;
      this.devoirFileName = file.name;
    }
  }

  submitDevoir() {
    if (this.devoirFile) {
      this.rendSubmit.emit(this.devoirFile);
    }
  }

  enableModifyDevoir() {
    this.devoirFile = null;
    this.devoirFileName = '';
  }

  isUser(): boolean {
    return this.currentUser?.role?.includes('ROLE_USER') || false;
  }

  isProf(): boolean {
    return this.currentUser?.role?.includes('ROLE_PROF') || false;
  }
}
