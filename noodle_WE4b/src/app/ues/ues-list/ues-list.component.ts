import { Component, OnInit } from '@angular/core';
import { UesService } from '../../services/ues.service';
import { Ue } from '../../models/ue.model';

@Component({
  selector: 'app-ues-list',
  templateUrl: './ues-list.component.html',
  styleUrls: ['./ues-list.component.scss'],
})
export class UesListComponent implements OnInit {
  ues: Ue[] = [];

  constructor(private uesService: UesService) {}

  ngOnInit() {
    this.uesService.getAllUes().subscribe({
      next: (data) => (this.ues = data),
      error: (err) => console.error('Failed to load UEs', err),
    });
  }
}
