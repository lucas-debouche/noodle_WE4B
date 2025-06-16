import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarService } from "../../services/navbar.service";
import { UesService } from "../../services/ues.service";
import { Ue } from "../../models/ue.model";


@Component({
  selector: 'app-mes-ue',
  templateUrl: './mes-ue.component.html',
  styleUrls: ['./mes-ue.component.scss']
})
export class MesUeComponent implements OnInit {
  currentUe!: Ue;

  constructor(
    private navbarService: NavbarService,
    private route: ActivatedRoute,
    private uesService: UesService,
  ) {}

  ngOnInit(): void {
    const ueId = this.route.snapshot.paramMap.get('id');
    if (typeof ueId === 'string') {
      this.uesService.getUeById(ueId).subscribe((ue: Ue) => {
        this.currentUe = ue;
        console.log(this.currentUe);
        this.navbarService.setTitle(this.currentUe.intitule);
      });
    }
  }

}
