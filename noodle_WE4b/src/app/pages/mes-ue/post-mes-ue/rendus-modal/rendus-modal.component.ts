import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-rendus-modal',
  templateUrl: './rendus-modal.component.html',
  styleUrls: ['./rendus-modal.component.scss']
})
export class RendusModalComponent {
  @Input() rendus: any[] | undefined;
  @Input() isProf: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() noteChange = new EventEmitter<{rendu: any, note: number}>();
  @Output() commentaireChange = new EventEmitter<{rendu: any, commentaire: string}>();

  showNoteInputIndex: number | null = null;
  noteInputs: { [index: number]: number } = {};

  closeModal() {
    this.close.emit();
  }

  toggleNoteInput(index: number) {
    this.showNoteInputIndex = this.showNoteInputIndex === index ? null : index;
  }

  validerNote(rendu: any, index: number) {
    const newNote = this.noteInputs[index];
    if (newNote !== undefined && newNote >= 0 && newNote <= 20) {
      this.noteChange.emit({ rendu, note: newNote });
      this.showNoteInputIndex = null; // Fermer l'input de note
    } else {
      alert('Veuillez entrer une note valide entre 0 et 20.');
    }
  }

  enregistrerCommentaire(rendu: any) {
    this.commentaireChange.emit({rendu, commentaire: rendu.commentaire});
  }
}
