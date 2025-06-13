import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ForumService } from '../../services/forum.service';

@Component({
  selector: 'app-forum-list',
  templateUrl: './forum-list.component.html'
})
export class ForumListComponent implements OnInit {
  forums: any[] | undefined;

  constructor(
    private route: ActivatedRoute,
    private forumService: ForumService
  ) {}

  ngOnInit() {
    const ueId = this.route.snapshot.paramMap.get('ueId');
    if (ueId) {
      this.forumService.getForumsByUe(ueId).subscribe(data => this.forums = data);
    } else {
      console.error('ueId non trouvé dans la route');
    }
  }
  newTitle: string = '';

  createForum() {
    const ueId = this.route.snapshot.paramMap.get('ueId');
    if (ueId && this.newTitle.trim() !== '') {
      this.forumService.createForum(ueId, this.newTitle).subscribe(() => {
        this.newTitle = '';
        // Recharge les forums après création
        this.forumService.getForumsByUe(ueId).subscribe(data => this.forums = data);
      });
    }
  }

}
