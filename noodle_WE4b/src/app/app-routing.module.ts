import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { UtilisateurComponent } from "./utilisateurs/utilisateurs.component";
import { ChoixUeComponent } from './pages/choix-ue/choix-ue.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'utilisateurs', component: UtilisateurComponent},
  { path: 'choix-ue', component:  ChoixUeComponent, canActivate: [AuthGuard]},
  { path: '**', redirectTo: '/login'},
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
