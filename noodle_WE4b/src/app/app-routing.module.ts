import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { ChoixUeComponent } from './pages/choix-ue/choix-ue.component';
import { AuthGuard } from './guards/auth.guard';
import { MesUeComponent } from "./pages/mes-ue/mes-ue.component";
import { ForumListComponent } from './pages/forums/forum-list/forum-list.component';
import { ForumDetailComponent } from './pages/forums/forum-detail/forum-detail.component';
import { ParticipantsListComponent } from './pages/partipants-ue/participants-list/participants-list.component';
import { Admin_panelComponent } from "./admin/admin_panel/admin_panel.component";

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'choix-ue', component:  ChoixUeComponent, canActivate: [AuthGuard]},
  { path: 'mes-ue/:id', component: MesUeComponent, canActivate: [AuthGuard]},

  { path: 'ues/:ueId/forums', component: ForumListComponent, canActivate: [AuthGuard] },
  { path: 'forums/:forumId', component: ForumDetailComponent , canActivate: [AuthGuard]},

  {path : 'ues/:ueId/participants', component: ParticipantsListComponent, canActivate: [AuthGuard]},

  { path: 'admin_panel', component: Admin_panelComponent },

  { path: '**', redirectTo: '/login'}
];


@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      anchorScrolling: 'enabled',
      scrollPositionRestoration: 'enabled'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
