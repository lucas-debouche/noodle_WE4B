import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ForumService } from '../../services/forum.service';

@Component({
  selector: 'app-forum-create',
  templateUrl: './forum-create.component.html'
})
export class ForumCreateComponent {
  title: string = '';

  constructor(
    private route: ActivatedRoute,
    private forumService: ForumService,
    private router: Router
  ) {}

  createForum() {
    const ueId = this.route.snapshot.paramMap.get('ueId');
    if (ueId) {
      this.forumService.createForum(ueId, this.title).subscribe(() => {
        this.router.navigate([`/ues/${ueId}/forums`]);
      });
    } else {
      console.error('ueId non trouvé dans la route');
    }
  }

}
