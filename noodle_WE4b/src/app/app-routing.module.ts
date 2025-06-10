import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import {UtilisateurComponent} from "./utilisateurs/utilisateurs.component";
import { ChoixUeComponent } from './pages/choix-ue/choix-ue.component';

const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  { path: 'utilisateurs', component: UtilisateurComponent},
  { path: 'choix-ue', component:  ChoixUeComponent},
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
