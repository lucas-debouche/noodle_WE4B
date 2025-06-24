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
    console.log(`Toggle reply form for ${messageId}:`, this.showReplyForm[messageId]);
  }

  toggleReplies(messageId: string) {
    this.showReplies[messageId] = !this.showReplies[messageId];
    console.log(`Toggle replies for ${messageId}:`, this.showReplies[messageId]);
  }

  addReply(messageId: string, text: string) {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId && text.trim() !== '') {
      console.log(`Adding reply to message ${messageId}:`, text);
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
    console.log('Starting edit for message:', message._id);
    this.cancelEdit(); // Annuler toute édition en cours
    this.editingMessage = message;
    this.editText = message.message;
  }

  startEditReply(reply: any) {
    console.log('Starting edit for reply:', reply._id);
    this.cancelEdit(); // Annuler toute édition en cours
    this.editingReply = reply;
    this.editText = reply.message;
  }

  saveMessageEdit(event: {messageId: string, text: string}) {
    console.log('Saving message edit:', event);
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId && event.text.trim() !== '') {
      this.forumService.updateMessage(forumId, event.messageId, event.text).subscribe(
        () => {
          console.log('Message edit saved successfully');

          // Mise à jour locale immédiate pour éviter le délai
          if (this.forumDetail?.messages) {
            const messageIndex = this.forumDetail.messages.findIndex((msg: any) => msg._id === event.messageId);
            if (messageIndex !== -1) {
              this.forumDetail.messages[messageIndex].message = event.text;
              this.forumDetail.messages[messageIndex].isEdited = true;
              console.log('Message updated locally:', this.forumDetail.messages[messageIndex]);
            }
          }

          this.cancelEdit();

          // Recharger quand même pour être sûr
          setTimeout(() => {
            this.loadForumDetail();
          }, 100);
        },
        (error) => {
          console.error('Erreur lors de la modification du message:', error);
        }
      );
    }
  }


  saveReplyEdit(event: {messageId: string, replyId: string, text: string}) {
    console.log('Saving reply edit:', event);
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId && event.text.trim() !== '') {
      console.log('Reply content to save:', event.text);
      this.forumService.updateReply(forumId, event.messageId, event.replyId, event.text).subscribe(
        () => {
          console.log('Reply edit saved successfully');

          // Mise à jour locale immédiate pour éviter le délai
          if (this.forumDetail?.messages) {
            const message = this.forumDetail.messages.find((msg: any) => msg._id === event.messageId);
            if (message && message.replies) {
              const replyIndex = message.replies.findIndex((reply: any) => reply._id === event.replyId);
              if (replyIndex !== -1) {
                message.replies[replyIndex].message = event.text;
                message.replies[replyIndex].isEdited = true;
                message.replies[replyIndex].updatedAt = new Date().toISOString();
                console.log('Reply updated locally:', message.replies[replyIndex]);
              }
            }
          }

          this.cancelEdit();
          setTimeout(() => {
            this.loadForumDetail();
          }, 100);
        },
        (error) => {
          console.error('Erreur lors de la modification de la réponse:', error);

          if (error.status === 403) {
            alert('Erreur 403: Vous n\'avez pas les permissions pour modifier cette réponse. Vérifiez que vous êtes bien l\'auteur de la réponse.');
          } else {
            alert(`Erreur lors de la modification: ${error.message || 'Erreur inconnue'}`);
          }
        }
      );
    }
  }

  cancelEdit() {
    console.log('Cancelling edit');
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
    console.log('Starting forum title edit');
    this.editingForumTitle = true;
    this.newForumTitle = this.forumDetail.title; // S'assurer qu'on a le bon titre
  }

  saveForumTitle() {
    console.log('Saving forum title:', this.newForumTitle);
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId && this.newForumTitle.trim() !== '') {
      this.forumService.updateForumTitle(forumId, this.newForumTitle.trim()).subscribe(
        () => {
          console.log('Forum title saved successfully');
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
    console.log('Cancelling forum title edit');
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
    const userId = user?._id || '';
    return userId;
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
    const result = this.showReplyForm[messageId] ? messageId : '';
    return result;
  }

  getShowRepliesId(messageId: string): string {
    const result = this.showReplies[messageId] ? messageId : '';
    return result;
  }

  // Méthodes de vérification des permissions (ajoutées à la fin)
  canModerate(): boolean {
    return this.authService.canModerate();
  }

  canDeleteForum(): boolean {
    return this.authService.canDeleteForum();
  }

  canEditMessage(message: any): boolean {
    const currentUserId = this.getCurrentUserId();
    console.log('Checking edit permission:', {
      messageUserId: message.userId,
      currentUserId: currentUserId,
      isAuthor: message.userId === currentUserId,
      canModerate: this.canModerate()
    });

    // Seul l'auteur peut modifier son message (tous les rôles)
    return message.userId === currentUserId && !!currentUserId;
  }

  canDeleteMessage(message: any): boolean {
    const currentUserId = this.getCurrentUserId();
    // L'auteur peut supprimer son propre message OU les profs/admins peuvent supprimer tous les messages
    return (message.userId === currentUserId && !!currentUserId) || this.canModerate();
  }

  canEditReply(reply: any): boolean {
    const currentUserId = this.getCurrentUserId();
    // Seul l'auteur peut modifier sa réponse (tous les rôles)
    return reply.userId === currentUserId && !!currentUserId;
  }

  canDeleteReply(reply: any): boolean {
    const currentUserId = this.getCurrentUserId();
    // L'auteur peut supprimer sa propre réponse OU les profs/admins peuvent supprimer toutes les réponses
    return (reply.userId === currentUserId && !!currentUserId) || this.canModerate();
  }
}
