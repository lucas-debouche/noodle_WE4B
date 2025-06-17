import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-sidebar-mes-ue',
  templateUrl: './sidebar-mes-ue.component.html',
  styleUrls: ['./sidebar-mes-ue.component.scss']
})
export class SidebarMesUeComponent implements OnInit {
  @Input() ueId: string = '';

  constructor() { }

  ngOnInit(): void {
  }

}
