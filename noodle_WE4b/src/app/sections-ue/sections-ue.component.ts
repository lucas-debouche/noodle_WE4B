import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-sections-ue',
  templateUrl: './sections-ue.component.html',
  styleUrls: ['./sections-ue.component.scss']
})
export class SectionsUeComponent implements OnInit {
  @Input() sectionTitle: string = '';
  modules = [
    { name: 'Module 1' },
    { name: 'Module 2' },
    { name: 'Module 3' }
  ];

  opened = true;

  constructor() { }

  ngOnInit(): void {}

  toggleSection() {
    this.opened = !this.opened;
  }
}
