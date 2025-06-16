import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-sections-ue',
  templateUrl: './sections-ue.component.html',
  styleUrls: ['./sections-ue.component.scss']
})
export class SectionsUeComponent implements OnInit, AfterViewInit {
  @Input() sectionTitle: string = '';
  modules = [
    { name: 'Module 1' },
    { name: 'Module 2' },
    { name: 'Module 3' }
  ];

  opened = true;
  modulesListHeight = 0;

  @ViewChild('modulesList') modulesList!: ElementRef;
  @ViewChild('modulesListWrapper') modulesListWrapper!: ElementRef;

  constructor() { }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => this.updateModulesListHeight());
  }

  toggleSection() {
    this.opened = !this.opened;
    setTimeout(() => this.updateModulesListHeight());
  }

  updateModulesListHeight() {
    if (this.opened && this.modulesList) {
      this.modulesListHeight = this.modulesList.nativeElement.scrollHeight;
    } else {
      this.modulesListHeight = 0;
    }
  }
}
