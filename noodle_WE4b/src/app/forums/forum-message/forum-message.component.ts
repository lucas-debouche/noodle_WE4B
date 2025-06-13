import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ForumService } from '../../services/forum.service';

@Component({
  selector: 'app-forum-message',
  templateUrl: './forum-message.component.html'
})
export class ForumMessageComponent {
  message: string = '';

  constructor(
    private route: ActivatedRoute,
    private forumService: ForumService
  ) {}

  addMessage() {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId) {
      this.forumService.addMessage(forumId, this.message).subscribe(() => {
        this.message = '';
        // Actualisation des messages à prévoir ici
      });
    } else {
      console.error('forumId non trouvé dans la route');
    }
  }

}
