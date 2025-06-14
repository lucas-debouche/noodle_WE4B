import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ForumService } from '../../../services/forum.service';
import { UtilisateurService } from '../../../services/utilisateur.service';

@Component({
  selector: 'app-forum-detail',
  templateUrl: './forum-detail.component.html',
  styleUrls: ['./forum-detail.component.scss']
})
export class ForumDetailComponent implements OnInit {
  forumDetail: any;
  newMessage: string = '';
  userCache: { [key: string]: string } = {}; // clé = userId, valeur = "Prenom Nom"

  // Nouvelles propriétés pour les fonctionnalités avancées
  isSending: boolean = false;
  showTips: boolean = false;
  showPreview: boolean = false;
  showEmojiPicker: boolean = false;
  currentUser: any = null;

  // Emojis courants
  commonEmojis: string[] = [
    '😊', '😍', '🤔', '👍', '👎', '❤️', '😂', '😢',
    '😮', '😡', '🙏', '👏', '🔥', '💯', '✅', '❌',
    '🎉', '🎈', '🌟', '✨', '💔', '😎', '🤗', '🤷‍♂️',
    '🤷‍♀️', '🙌', '💪', '👀', '🤩', '😴', '😜', '😅',
    '😇', '🤓', '😏', '😋', '🤤', '😬', '😱', '🤯'
  ];

  constructor(
    private route: ActivatedRoute,
    private forumService: ForumService,
    private utilisateurService: UtilisateurService
  ) {}

  ngOnInit() {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId) {
      this.loadForumDetail();
    }
    // Initialiser l'utilisateur actuel
    this.loadCurrentUser();
  }

  loadForumDetail() {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId) {
      this.forumService.getForumDetail(forumId).subscribe(data => {
        this.forumDetail = data;
        this.loadUserNames();
      });
    }
  }

  loadUserNames() {
    if (!this.forumDetail?.messages) return;

    // Charger les noms des auteurs
    this.forumDetail.messages.forEach((msg: any) => {
      if (!this.userCache[msg.userId]) {
        this.utilisateurService.getUtilisateurById(msg.userId).subscribe(
          (user: any) => {
            console.log('Utilisateur chargé:', user);
            this.userCache[msg.userId] = `${user.prenom} ${user.nom}`;
          },
          (error) => {
            console.error('Erreur lors du chargement de l\'utilisateur:', error);
            this.userCache[msg.userId] = 'Utilisateur inconnu';
          }
        );
      }
    });
  }

  addMessage() {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId && this.newMessage.trim() !== '') {
      this.forumService.addMessage(forumId, this.newMessage).subscribe(
        () => {
          this.newMessage = '';
          // Recharge le forum pour afficher le nouveau message
          this.loadForumDetail();
        },
        (error) => {
          console.error('Erreur lors de l\'ajout du message:', error);
          // Ici vous pourriez ajouter une notification d'erreur
        }
      );
    }
  }

  clearMessage() {
    this.newMessage = '';
    this.showPreview = false;
    this.showEmojiPicker = false;
  }

  // Nouvelles méthodes pour les fonctionnalités avancées
  toggleTips() {
    this.showTips = !this.showTips;
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string) {
    this.newMessage += emoji;
    this.showEmojiPicker = false;
  }

  updateCharCount() {
    // Cette méthode est appelée automatiquement par le template
  }

  getCharCount(): number {
    return this.newMessage ? this.newMessage.length : 0;
  }

  getCurrentUserName(): string {
    if (this.currentUser) {
      return `${this.currentUser.prenom} ${this.currentUser.nom}`;
    }
    return 'Utilisateur connecté';
  }

  private loadCurrentUser() {
    this.utilisateurService.getUtilisateurActuel().subscribe(
      (user: any) => {
        this.currentUser = user;
        console.log('Utilisateur actuel chargé:', this.currentUser);
      },
      (error) => {
        console.error('Erreur lors du chargement de l\'utilisateur actuel:', error);
      }
    );
  }

  trackByMessageId(index: number, message: any): any {
    return message._id || index;
  }

  // Méthode pour obtenir le nombre de messages
  getMessagesCount(): number {
    return this.forumDetail?.messages ? this.forumDetail.messages.length : 0;
  }

  // Méthode pour vérifier si le message a du contenu
  hasMessageContent(): boolean {
    return  this.newMessage.trim().length > 0;
  }
}
