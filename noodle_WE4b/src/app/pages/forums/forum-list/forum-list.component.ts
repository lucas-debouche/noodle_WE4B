import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ForumService } from '../../../services/forum.service';

@Component({
  selector: 'app-forum-list',
  templateUrl: './forum-list.component.html',
  styleUrls: ['./forum-list.component.scss']
})
export class ForumListComponent implements OnInit {
  forums: any[] = [];
  filteredForums: any[] = [];
  newTitle: string = '';
  loading: boolean = false;
  creating: boolean = false;
  error: string = '';

  // Nouvelles propriétés pour les filtres
  searchTerm: string = '';
  sortBy: string = 'recent'; // 'recent', 'oldest', 'messages', 'title'
  showFilters: boolean = false;

  sortOptions = [
    { value: 'recent', label: 'Plus récents' },
    { value: 'oldest', label: 'Plus anciens' },
    { value: 'messages', label: 'Plus de messages' },
    { value: 'title', label: 'Titre A-Z' }
  ];

  constructor(
    private route: ActivatedRoute,
    private forumService: ForumService
  ) {}

  ngOnInit() {
    this.loadForums();
  }

  loadForums() {
    const ueId = this.route.snapshot.paramMap.get('ueId');
    if (ueId) {
      this.loading = true;
      this.error = '';

      this.forumService.getForumsByUe(ueId).subscribe(
        data => {
          this.forums = data || [];
          this.applyFiltersAndSort();
          this.loading = false;
          console.log('Forums chargés:', this.forums);
        },
        error => {
          console.error('Erreur lors du chargement des forums:', error);
          this.error = 'Erreur lors du chargement des forums';
          this.loading = false;
        }
      );
    } else {
      console.error('ueId non trouvé dans la route');
      this.error = 'Paramètre UE manquant';
    }
  }

  createForum() {
    const ueId = this.route.snapshot.paramMap.get('ueId');
    if (ueId && this.newTitle.trim() !== '' && !this.creating) {
      this.creating = true;
      this.error = '';

      this.forumService.createForum(ueId, this.newTitle.trim()).subscribe(
        (response) => {
          console.log('Forum créé avec succès:', response);
          this.newTitle = '';
          this.creating = false;
          // Recharge les forums après création
          this.loadForums();
        },
        error => {
          console.error('Erreur lors de la création du forum:', error);
          this.error = 'Erreur lors de la création du forum';
          this.creating = false;
        }
      );
    }
  }

  // Nouvelles méthodes pour les filtres et le tri
  applyFiltersAndSort() {
    let filtered = [...this.forums];

    // Appliquer le filtre de recherche
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(forum =>
        forum.title.toLowerCase().includes(search)
      );
    }

    // Appliquer le tri
    filtered = this.applySorting(filtered);

    this.filteredForums = filtered;
  }

  applySorting(forums: any[]): any[] {
    switch (this.sortBy) {
      case 'recent':
        return forums.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      case 'oldest':
        return forums.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      case 'messages':
        return forums.sort((a, b) => this.getMessageCount(b) - this.getMessageCount(a));

      case 'title':
        return forums.sort((a, b) => a.title.localeCompare(b.title));

      default:
        return forums;
    }
  }

  onSearchChange() {
    this.applyFiltersAndSort();
  }

  onSortChange() {
    this.applyFiltersAndSort();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFiltersAndSort();
  }

  resetFilters() {
    this.searchTerm = '';
    this.sortBy = 'recent';
    this.applyFiltersAndSort();
  }

  trackByForumId(index: number, forum: any): any {
    return forum._id || index;
  }

  // Méthode pour gérer l'appui sur Entrée dans l'input
  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.createForum();
    }
  }

  // Méthode pour formater les dates si nécessaire
  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  // Méthode pour obtenir le nombre de forums
  getForumsCount(): number {
    return this.filteredForums ? this.filteredForums.length : 0;
  }

  // Méthode pour obtenir le nombre total de forums
  getTotalForumsCount(): number {
    return this.forums ? this.forums.length : 0;
  }

  // Méthode pour valider le titre
  isValidTitle(): boolean {
    return (this.newTitle.trim().length > 0);
  }

  getParticipantCount(forum: any): number {
    // On récup^ère tout les messages du forum, on compte les utilisateurs uniques
    const participants = new Set();
    forum.messages?.forEach((message: any) => {
      if (message.userId) {
        participants.add(message.userId);
      }
    });
    return participants.size;
  }

  // Méthode pour obtenir le nombre de messages d'un forum
  getMessageCount(forum: any): number {
    return forum.messages?.length || forum.messageCount || 0;
  }

  // Méthode pour vider le message d'erreur
  clearError() {
    this.error = '';
  }

  // Méthode pour rafraîchir la liste
  refreshForums() {
    this.loadForums();
  }

  // Méthode pour obtenir le temps relatif
  getRelativeTime(date: string): string {
    if (!date) return '';

    const now = new Date();
    const forumDate = new Date(date);
    const diffInMs = now.getTime() - forumDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return diffInMinutes <= 1 ? 'À l\'instant' : `Il y a ${diffInMinutes} min`;
      }
      return `Il y a ${diffInHours}h`;
    } else if (diffInDays === 1) {
      return 'Hier';
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jours`;
    } else {
      return forumDate.toLocaleDateString('fr-FR');
    }
  }
}
