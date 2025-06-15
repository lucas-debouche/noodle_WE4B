import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { UtilisateurComponent } from "./utilisateurs/utilisateurs.component";
import { ChoixUeComponent } from './pages/choix-ue/choix-ue.component';
import { AuthGuard } from './guards/auth.guard';
import { ForumListComponent } from './pages/forums/forum-list/forum-list.component';
import { ForumDetailComponent } from './pages/forums/forum-detail/forum-detail.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'utilisateurs', component: UtilisateurComponent},
  { path: 'choix-ue', component:  ChoixUeComponent, canActivate: [AuthGuard]},

  { path: 'ues/:ueId/forums', component: ForumListComponent, canActivate: [AuthGuard] },
  { path: 'forums/:forumId', component: ForumDetailComponent , canActivate: [AuthGuard]},



  { path: '**', redirectTo: '/login'}

];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
