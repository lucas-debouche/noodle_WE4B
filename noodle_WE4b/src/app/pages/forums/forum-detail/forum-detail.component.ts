import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ForumService } from '../../../services/forum.service';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forum-detail',
  templateUrl: './forum-detail.component.html',
  styleUrls: ['./forum-detail.component.scss']
})
export class ForumDetailComponent implements OnInit {
  forumDetail: any;
  newMessage: string = '';
  userCache: { [key: string]: string } = {};

  // État d'envoi
  isSending: boolean = false;
  showEmojiPicker: boolean = false;
  currentUser: any = null;

  // Gestion des fichiers
  selectedFiles: FileList | null = null;
  selectedReplyFiles: FileList | null = null;
  selectedFilesArray: File[] = [];
  selectedReplyFilesArray: File[] = [];
  maxFileSize = 10 * 1024 * 1024; // 10MB
  allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip', 'application/x-rar-compressed'
  ];

  // Fonctionnalités de réponse
  replyToMessage: any = null;
  replyText: string = '';
  showReplyForm: { [key: string]: boolean } = {};
  showReplies: { [key: string]: boolean } = {};

  // Fonctionnalités d'édition
  editingMessage: any = null;
  editingReply: any = null;
  editText: string = '';

  // Fonctionnalités d'administration
  editingForumTitle: boolean = false;
  newForumTitle: string = '';

  constructor(
    private route: ActivatedRoute,
    private forumService: ForumService,
    private utilisateurService: UtilisateurService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId) {
      this.loadForumDetail();
    }
    this.loadCurrentUser();
    if (this.authService.isLoggedIn()) {
      this.authService.initializeUser();
    }
  }

  loadForumDetail() {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId) {
      this.forumService.getForumDetail(forumId).subscribe(data => {
        this.forumDetail = data;
        this.newForumTitle = data.title;
        this.loadUserNames();
      });
    }
  }

  loadUserNames() {
    if (!this.forumDetail?.messages) return;

    // Créer un Set pour éviter les doublons d'userId
    const userIds = new Set<string>();

    // Collecter tous les userId des messages
    this.forumDetail.messages.forEach((msg: any) => {
      if (msg.userId) {
        userIds.add(msg.userId);
      }

      // Collecter les userId des réponses
      if (msg.replies) {
        msg.replies.forEach((reply: any) => {
          if (reply.userId) {
            userIds.add(reply.userId);
          }
        });
      }
    });

    // Charger les noms pour tous les userId uniques
    userIds.forEach(userId => {
      this.loadUserName(userId);
    });
  }

  loadUserName(userId: string) {
    if (!userId) return;

    // Si déjà en cours de chargement ou déjà chargé, ne pas refaire l'appel
    if (this.userCache[userId] && this.userCache[userId] !== 'Chargement...') return;
    if (this.userCache[userId] === 'Chargement...') return;

    // Marquer comme en cours de chargement
    this.userCache[userId] = 'Chargement...';

    this.utilisateurService.getUtilisateurById(userId).subscribe(
      (user: any) => {
        // Mettre à jour le cache ET forcer la détection de changement
        this.userCache[userId] = `${user.prenom} ${user.nom}`;
        console.log(`Nom chargé pour ${userId}: ${this.userCache[userId]}`);

        // Créer une nouvelle référence pour déclencher ngOnChanges
        this.userCache = { ...this.userCache };
      },
      (error) => {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        this.userCache[userId] = 'Utilisateur inconnu';

        // Créer une nouvelle référence pour déclencher ngOnChanges
        this.userCache = { ...this.userCache };
      }
    );
  }

  // Méthodes pour les messages
  addMessage() {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId && this.newMessage.trim() !== '') {
      this.isSending = true;
      this.forumService.addMessage(forumId, this.newMessage, this.selectedFiles || undefined).subscribe(
        () => {
          this.newMessage = '';
          this.selectedFiles = null;
          this.selectedFilesArray = [];
          this.isSending = false;
          this.loadForumDetail();
        },
        (error) => {
          console.error('Erreur lors de l\'ajout du message:', error);
          this.isSending = false;
        }
      );
    }
  }

  // Méthodes pour les réponses
  toggleReplyForm(messageId: string) {
    this.showReplyForm[messageId] = !this.showReplyForm[messageId];
    if (!this.showReplyForm[messageId]) {
      this.replyText = '';
      this.selectedReplyFiles = null;
      this.selectedReplyFilesArray = [];
    }
  }

  toggleReplies(messageId: string) {
    this.showReplies[messageId] = !this.showReplies[messageId];
  }

  addReply(messageId: string, text: string) {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId && text.trim() !== '') {
      this.forumService.addReply(forumId, messageId, text, this.selectedReplyFiles || undefined).subscribe(
        () => {
          this.replyText = '';
          this.selectedReplyFiles = null;
          this.selectedReplyFilesArray = [];
          this.showReplyForm[messageId] = false;
          this.loadForumDetail();
        },
        (error) => {
          console.error('Erreur lors de l\'ajout de la réponse:', error);
        }
      );
    }
  }

  // Méthodes d'édition
  startEditMessage(message: any) {
    this.editingMessage = message;
    this.editText = message.message;
  }

  startEditReply(reply: any) {
    this.editingReply = reply;
    this.editText = reply.message;
  }

  saveMessageEdit(event: {messageId: string, text: string}) {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId && event.text.trim() !== '') {
      this.forumService.updateMessage(forumId, event.messageId, event.text).subscribe(
        () => {
          this.cancelEdit();
          this.loadForumDetail();
        },
        (error) => {
          console.error('Erreur lors de la modification du message:', error);
        }
      );
    }
  }

  saveReplyEdit() {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId && this.editingReply && this.editText.trim() !== '') {
      console.log('Édition de réponse non encore implémentée côté serveur');
      this.cancelEdit();
      alert('L\'édition des réponses sera disponible dans une prochaine version.');
    }
  }

  cancelEdit() {
    this.editingMessage = null;
    this.editingReply = null;
    this.editText = '';
  }

  // Méthodes de suppression
  deleteMessage(messageId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      const forumId = this.route.snapshot.paramMap.get('forumId');
      if (forumId) {
        this.forumService.deleteMessage(forumId, messageId).subscribe(
          () => {
            this.loadForumDetail();
          },
          (error) => {
            console.error('Erreur lors de la suppression du message:', error);
          }
        );
      }
    }
  }

  deleteReply(messageId: string, replyId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette réponse ?')) {
      const forumId = this.route.snapshot.paramMap.get('forumId');
      if (forumId) {
        this.forumService.deleteReply(forumId, messageId, replyId).subscribe(
          () => {
            this.loadForumDetail();
          },
          (error) => {
            console.error('Erreur lors de la suppression de la réponse:', error);
          }
        );
      }
    }
  }

  // Méthodes pour la gestion du forum
  startEditForumTitle() {
    this.editingForumTitle = true;
  }

  saveForumTitle() {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId && this.newForumTitle.trim() !== '') {
      this.forumService.updateForumTitle(forumId, this.newForumTitle.trim()).subscribe(
        () => {
          this.editingForumTitle = false;
          this.loadForumDetail();
        },
        (error) => {
          console.error('Erreur lors de la modification du titre:', error);
        }
      );
    }
  }

  cancelEditForumTitle() {
    this.editingForumTitle = false;
    this.newForumTitle = this.forumDetail.title;
  }

  deleteForum() {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce forum ? Cette action est irréversible.')) {
      const forumId = this.route.snapshot.paramMap.get('forumId');
      if (forumId) {
        this.forumService.deleteForum(forumId).subscribe(
          () => {
            window.history.back();
          },
          (error) => {
            console.error('Erreur lors de la suppression du forum:', error);
          }
        );
      }
    }
  }

  // Méthodes utilitaires
  clearMessage() {
    this.newMessage = '';
    this.selectedFiles = null;
    this.selectedFilesArray = [];
    this.showEmojiPicker = false;
  }

  // Gestion des fichiers
  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    console.log('Fichiers sélectionnés:', files.length);

    if (files && files.length > 0) {
      const newFiles = Array.from(files);

      if (this.selectedFilesArray.length + newFiles.length > 5) {
        alert(`Maximum 5 fichiers autorisés. Vous avez déjà ${this.selectedFilesArray.length} fichier(s) sélectionné(s).`);
        event.target.value = '';
        return;
      }

      for (const file of newFiles) {
        if (!this.validateSingleFile(file)) {
          event.target.value = '';
          return;
        }

        const isDuplicate = this.selectedFilesArray.some(existingFile =>
          existingFile.name === file.name && existingFile.size === file.size
        );

        if (!isDuplicate) {
          this.selectedFilesArray.push(file);
        } else {
          console.log(`Fichier en doublon ignoré: ${file.name}`);
        }
      }

      this.updateFileListFromArray();
      console.log('Total fichiers après ajout:', this.selectedFilesArray.length);
    }

    event.target.value = '';
  }

  validateSingleFile(file: File): boolean {
    if (file.size > this.maxFileSize) {
      alert(`Le fichier "${file.name}" dépasse la taille maximale de 10MB`);
      return false;
    }

    if (!this.allowedTypes.includes(file.type)) {
      console.warn(`Type non autorisé: ${file.type}`);
      alert(`Le type de fichier "${file.name}" n'est pas autorisé`);
      return false;
    }

    return true;
  }

  updateFileListFromArray() {
    if (this.selectedFilesArray.length > 0) {
      const dt = new DataTransfer();
      this.selectedFilesArray.forEach(file => dt.items.add(file));
      this.selectedFiles = dt.files;
    } else {
      this.selectedFiles = null;
    }
  }

  removeSelectedFile(index: number) {
    console.log(`Suppression du fichier à l'index ${index}`);
    this.selectedFilesArray.splice(index, 1);
    this.updateFileListFromArray();
    console.log('Fichiers restants:', this.selectedFilesArray.length);
  }

  downloadFile(filename: string, originalName: string) {
    this.forumService.downloadFile(filename).subscribe(
      (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      (error) => {
        console.error('Erreur lors du téléchargement:', error);
        alert('Erreur lors du téléchargement du fichier');
      }
    );
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string) {
    if (this.editingMessage || this.editingReply) {
      this.editText += emoji;
    } else if (this.replyText) {
      this.replyText += emoji;
    } else {
      this.newMessage += emoji;
    }
    this.showEmojiPicker = false;
  }

  updateCharCount() {
    // Cette méthode est appelée automatiquement par le template
  }

  getCharCount(): number {
    if (this.editingMessage || this.editingReply) {
      return this.editText ? this.editText.length : 0;
    }
    return this.newMessage ? this.newMessage.length : 0;
  }

  getCurrentUserName(): string {
    if (this.currentUser) {
      return `${this.currentUser.prenom} ${this.currentUser.nom}`;
    }
    return 'Utilisateur connecté';
  }

  getCurrentUserId(): string {
    const user = this.authService.getCurrentUserValue();
    return user?._id || '';
  }

  private loadCurrentUser() {
    this.authService.currentUser$.subscribe(
      (user: any) => {
        this.currentUser = user;
        console.log('Utilisateur actuel chargé:', this.currentUser);
      }
    );
  }

  trackByMessageId(index: number, message: any): any {
    return message._id || index;
  }

  trackByReplyId(index: number, reply: any): any {
    return reply._id || index;
  }

  getMessagesCount(): number {
    return this.forumDetail?.messages ? this.forumDetail.messages.length : 0;
  }

  getShowReplyFormId(messageId: string): string {
    return this.showReplyForm[messageId] ? messageId : '';
  }

  getShowRepliesId(messageId: string): string {
    return this.showReplies[messageId] ? messageId : '';
  }

  // Méthodes de vérification des permissions
  canModerate(): boolean {
    return this.authService.canModerate();
  }

  canDeleteForum(): boolean {
    return this.authService.canDeleteForum();
  }
}
