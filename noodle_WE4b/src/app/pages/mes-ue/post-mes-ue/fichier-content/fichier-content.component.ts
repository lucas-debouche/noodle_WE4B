import { Component, Input } from '@angular/core';
import { Post } from '../../../../models/post.model';

@Component({
  selector: 'app-fichier-content',
  templateUrl: './fichier-content.component.html',
  styleUrls: ['./fichier-content.component.scss']
})
export class FichierContentComponent {
  @Input() post!: Post;
}
