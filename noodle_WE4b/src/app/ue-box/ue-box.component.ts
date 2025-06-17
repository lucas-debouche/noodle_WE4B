import { Component, OnInit, Input } from '@angular/core';
import { Ue } from '../models/ue.model';

@Component({
  selector: 'app-ue-box',
  templateUrl: './ue-box.component.html',
  styleUrls: ['./ue-box.component.scss']
})
export class UeBoxComponent implements OnInit {
  @Input() ue!: Ue;

  constructor() { }

  ngOnInit(): void {
    console.log(this.ue);
  }
}
