import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { ChoixUeComponent } from './pages/choix-ue/choix-ue.component';
import { MesUeComponent } from './pages/mes-ue/mes-ue.component';
import { ForumListComponent } from './pages/forums/forum-list/forum-list.component';
import { ForumDetailComponent } from './pages/forums/forum-detail/forum-detail.component';
import { ParticipantsListComponent } from './pages/partipants-ue/participants-list/participants-list.component';
import { UeRegistrationComponent } from './pages/ue-registration/ue-registration/ue-registration.component';
import { Admin_panelComponent } from './admin/admin_panel/admin_panel.component';

import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AuthAdminGuard } from './guards/auth-admin.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },

  // Routes accessibles uniquement après authentification
  { path: 'choix-ue', component: ChoixUeComponent, canActivate: [AuthGuard] },
  { path: 'mes-ue/:id', component: MesUeComponent, canActivate: [AuthGuard] },
  { path: 'mes-ue/:id/forums', component: ForumListComponent, canActivate: [AuthGuard] },
  { path: 'forums/:forumId', component: ForumDetailComponent, canActivate: [AuthGuard] },
  { path: 'ues/:ueId/participants', component: ParticipantsListComponent, canActivate: [AuthGuard] },

  // Route admin protégée
  { path: 'admin/ue-registration', component: UeRegistrationComponent, canActivate: [AuthAdminGuard] },
  { path: 'admin_panel', component: Admin_panelComponent, canActivate: [AdminGuard] },

  // Redirection par défaut
  { path: '**', redirectTo: '/login' }
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
export class AppRoutingModule {}
