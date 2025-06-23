import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Post } from '../../../../models/post.model';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-devoir-rendu',
  templateUrl: './devoir-rendu.component.html',
  styleUrls: ['./devoir-rendu.component.scss']
})
export class DevoirRenduComponent {
  @Input() post!: Post;
  @Input() currentUser!: User;
  @Input() renduUtilisateur: any;
  @Output() rendSubmit = new EventEmitter<File>();

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
    // Logique pour permettre la modification du devoir
  }
}
