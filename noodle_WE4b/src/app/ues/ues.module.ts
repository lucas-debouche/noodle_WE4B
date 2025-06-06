import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UesRoutingModule } from './ues-routing.module';
import { UesListComponent } from './ues-list/ues-list.component';
import { UeRegisterComponent } from './ue-register/ue-register.component';
import { ParticipantsComponent } from './participants/participants.component';


@NgModule({
  declarations: [
    UesListComponent,
    UeRegisterComponent,
    ParticipantsComponent
  ],
  imports: [
    CommonModule,
    UesRoutingModule
  ]
})
export class UesModule { }
