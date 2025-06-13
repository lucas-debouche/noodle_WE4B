import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ForumService } from '../../services/forum.service';
import { UtilisateurService } from '../../services/utilisateur.service';

@Component({
  selector: 'app-forum-detail',
  templateUrl: './forum-detail.component.html'
})
export class ForumDetailComponent implements OnInit {
  forumDetail: any;
  newMessage: string = '';
  userCache: { [key: string]: string } = {}; // clé = userId, valeur = "Prenom Nom"

  constructor(
    private route: ActivatedRoute,
    private forumService: ForumService,
    private utilisateurService: UtilisateurService
  ) {}


  ngOnInit() {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId) {
      this.forumService.getForumDetail(forumId).subscribe(data => {
        this.forumDetail = data;

        // Charger les noms des auteurs
        this.forumDetail.messages.forEach((msg: any) => {
          if (!this.userCache[msg.userId]) {
            this.utilisateurService.getUtilisateurById(msg.userId).subscribe((user: any) => {
              console.log('Utilisateur chargé:', user);
              this.userCache[msg.userId] = `${user.prenom} ${user.nom}`;
            });

          }
        });
      });
    }
  }


  loadForumDetail() {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId) {
      this.forumService.getForumDetail(forumId).subscribe(data => this.forumDetail = data);
    }
  }

  addMessage() {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId && this.newMessage.trim() !== '') {
      this.forumService.addMessage(forumId, this.newMessage).subscribe(() => {
        this.newMessage = '';
        // Recharge le forum pour afficher le nouveau message
        this.loadForumDetail();
      });
    }
  }
}
