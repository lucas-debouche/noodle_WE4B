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
  selectedFilesArray: File[] = []; // Nouveau: tableau pour accumulation
  selectedReplyFilesArray: File[] = []; // Nouveau: tableau pour accumulation réponses
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
  showReplies: { [key: string]: boolean } = {}; // Nouvelle propriété pour masquer/afficher les réponses

  // Fonctionnalités d'édition
  editingMessage: any = null;
  editingReply: any = null;
  editText: string = '';

  // Fonctionnalités d'administration
  editingForumTitle: boolean = false;
  newForumTitle: string = '';

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
    private utilisateurService: UtilisateurService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId) {
      this.loadForumDetail();
    }
    this.loadCurrentUser();
    // Initialiser l'utilisateur si connecté
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

    this.forumDetail.messages.forEach((msg: any) => {
      this.loadUserName(msg.userId);

      // Charger les noms des auteurs des réponses
      if (msg.replies) {
        msg.replies.forEach((reply: any) => {
          this.loadUserName(reply.userId);
        });
      }
    });
  }

  loadUserName(userId: string) {
    if (!userId || this.userCache[userId]) return;

    this.utilisateurService.getUtilisateurById(userId).subscribe(
      (user: any) => {
        this.userCache[userId] = `${user.prenom} ${user.nom}`;
      },
      (error) => {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        this.userCache[userId] = 'Utilisateur inconnu';
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
          this.selectedFilesArray = []; // Reset le tableau
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
      this.selectedReplyFilesArray = []; // Reset le tableau aussi

      // Reset l'input file de réponse
      const replyFileInput = document.querySelector('#replyFileInput') as HTMLInputElement;
      if (replyFileInput) {
        replyFileInput.value = '';
      }
    }
  }

  toggleReplies(messageId: string) {
    this.showReplies[messageId] = !this.showReplies[messageId];
  }

  addReply(messageId: string) {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId && this.replyText.trim() !== '') {
      this.forumService.addReply(forumId, messageId, this.replyText, this.selectedReplyFiles || undefined).subscribe(
        () => {
          this.replyText = '';
          this.selectedReplyFiles = null;
          this.selectedReplyFilesArray = []; // Reset le tableau
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

  saveMessageEdit() {
    const forumId = this.route.snapshot.paramMap.get('forumId');
    if (forumId && this.editingMessage && this.editText.trim() !== '') {
      this.forumService.updateMessage(forumId, this.editingMessage._id, this.editText).subscribe(
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
      // Pour les réponses, nous devons utiliser un endpoint spécifique s'il existe
      // ou implémenter la logique côté serveur pour gérer l'édition des réponses

      // Pour l'instant, on peut utiliser la même logique que pour les messages
      // mais il faudrait idéalement créer un endpoint spécifique pour éditer les réponses
      console.log('Édition de réponse non encore implémentée côté serveur');

      // Alternative temporaire : recharger le forum et annuler l'édition
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
            // Rediriger vers la liste des forums
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
    this.selectedFilesArray = []; // Reset le tableau aussi
    this.showEmojiPicker = false;

    // Reset l'input file si nécessaire
    const fileInput = document.querySelector('#fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Gestion des fichiers
  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    console.log('Fichiers sélectionnés:', files.length);

    if (files && files.length > 0) {
      // Convertir FileList en Array et ajouter aux fichiers existants
      const newFiles = Array.from(files);

      // Vérifier que le total ne dépasse pas 5 fichiers
      if (this.selectedFilesArray.length + newFiles.length > 5) {
        alert(`Maximum 5 fichiers autorisés. Vous avez déjà ${this.selectedFilesArray.length} fichier(s) sélectionné(s).`);
        event.target.value = ''; // Reset l'input
        return;
      }

      // Valider chaque nouveau fichier
      for (const file of newFiles) {
        if (!this.validateSingleFile(file)) {
          event.target.value = ''; // Reset l'input
          return;
        }

        // Vérifier les doublons (même nom et même taille)
        const isDuplicate = this.selectedFilesArray.some(existingFile =>
          existingFile.name === file.name && existingFile.size === file.size
        );

        if (!isDuplicate) {
          this.selectedFilesArray.push(file);
        } else {
          console.log(`Fichier en doublon ignoré: ${file.name}`);
        }
      }

      // Convertir le tableau en FileList pour compatibilité
      this.updateFileListFromArray();

      console.log('Total fichiers après ajout:', this.selectedFilesArray.length);
    }

    // Reset l'input pour permettre la resélection du même fichier
    event.target.value = '';
  }

  onReplyFileSelected(event: any) {
    const files: FileList = event.target.files;
    console.log('Fichiers réponse sélectionnés:', files.length);

    if (files && files.length > 0) {
      // Convertir FileList en Array et ajouter aux fichiers existants
      const newFiles = Array.from(files);

      // Vérifier que le total ne dépasse pas 5 fichiers
      if (this.selectedReplyFilesArray.length + newFiles.length > 5) {
        alert(`Maximum 5 fichiers autorisés. Vous avez déjà ${this.selectedReplyFilesArray.length} fichier(s) sélectionné(s).`);
        event.target.value = ''; // Reset l'input
        return;
      }

      // Valider chaque nouveau fichier
      for (const file of newFiles) {
        if (!this.validateSingleFile(file)) {
          event.target.value = ''; // Reset l'input
          return;
        }

        // Vérifier les doublons
        const isDuplicate = this.selectedReplyFilesArray.some(existingFile =>
          existingFile.name === file.name && existingFile.size === file.size
        );

        if (!isDuplicate) {
          this.selectedReplyFilesArray.push(file);
        } else {
          console.log(`Fichier réponse en doublon ignoré: ${file.name}`);
        }
      }

      // Convertir le tableau en FileList pour compatibilité
      this.updateReplyFileListFromArray();

      console.log('Total fichiers réponse après ajout:', this.selectedReplyFilesArray.length);
    }

    // Reset l'input pour permettre la resélection
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

  updateReplyFileListFromArray() {
    if (this.selectedReplyFilesArray.length > 0) {
      const dt = new DataTransfer();
      this.selectedReplyFilesArray.forEach(file => dt.items.add(file));
      this.selectedReplyFiles = dt.files;
    } else {
      this.selectedReplyFiles = null;
    }
  }

  removeSelectedFile(index: number) {
    console.log(`Suppression du fichier à l'index ${index}`);
    this.selectedFilesArray.splice(index, 1);
    this.updateFileListFromArray();
    console.log('Fichiers restants:', this.selectedFilesArray.length);
  }

  removeSelectedReplyFile(index: number) {
    console.log(`Suppression du fichier réponse à l'index ${index}`);
    this.selectedReplyFilesArray.splice(index, 1);
    this.updateReplyFileListFromArray();
    console.log('Fichiers réponse restants:', this.selectedReplyFilesArray.length);
  }

  // Utilitaires pour l'affichage des fichiers
  formatFileSize(bytes: number): string {
    return this.forumService.formatFileSize(bytes);
  }

  getFileIcon(mimeType: string): string {
    return this.forumService.getFileIcon(mimeType);
  }

  isImageFile(mimeType: string): boolean {
    return this.forumService.isImageFile(mimeType);
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

  getImageUrl(filename: string): string {
    return `http://localhost:3000/uploads/forums/${filename}`;
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

  private loadCurrentUser() {
    // S'abonner aux changements d'utilisateur
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

  // Méthodes pour obtenir le nombre de messages
  getMessagesCount(): number {
    return this.forumDetail?.messages ? this.forumDetail.messages.length : 0;
  }

  // Méthodes pour vérifier si le message a du contenu
  hasMessageContent(): boolean {
    return this.newMessage.trim().length > 0;
  }

  hasReplyContent(): boolean {
    return this.replyText.trim().length > 0;
  }

  hasEditContent(): boolean {
    return this.editText.trim().length > 0;
  }

  // Méthodes de vérification des permissions
  canModerate(): boolean {
    return this.authService.canModerate();
  }

  canDeleteForum(): boolean {
    return this.authService.canDeleteForum();
  }

  isMessageAuthor(message: any): boolean {
    const user = this.authService.getCurrentUserValue();
    if (!user || !message || !message.userId) return false;
    return message.userId === user._id;
  }

  isReplyAuthor(reply: any): boolean {
    const user = this.authService.getCurrentUserValue();
    if (!user || !reply || !reply.userId) return false;
    return reply.userId === user._id;
  }

  canEditMessage(message: any): boolean {
    // Seul l'auteur peut modifier son message (tous les rôles)
    return this.isMessageAuthor(message);
  }

  canDeleteMessage(message: any): boolean {
    // L'auteur peut supprimer son propre message OU les profs/admins peuvent supprimer tous les messages
    return this.isMessageAuthor(message) || this.canModerate();
  }

  canEditReply(reply: any): boolean {
    // Seul l'auteur peut modifier sa réponse (tous les rôles)
    const user = this.authService.getCurrentUserValue();
    if (!user || !reply || !reply.userId) return false;
    return reply.userId === user._id;
  }

  canDeleteReply(reply: any): boolean {
    // L'auteur peut supprimer sa propre réponse OU les profs/admins peuvent supprimer toutes les réponses
    const user = this.authService.getCurrentUserValue();
    if (!user || !reply || !reply.userId) return false;
    return reply.userId === user._id || this.canModerate();
  }

  // Méthodes pour formater les dates
  getRelativeTime(date: string): string {
    if (!date) return '';

    const now = new Date();
    const messageDate = new Date(date);
    const diffInMs = now.getTime() - messageDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'À l\'instant';
    } else if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else if (diffInDays === 1) {
      return 'Hier';
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jours`;
    } else {
      return messageDate.toLocaleDateString('fr-FR');
    }
  }
}
