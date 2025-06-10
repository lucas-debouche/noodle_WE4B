import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import {UtilisateurComponent} from "./utilisateurs/utilisateurs.component";
import {Admin_panelComponent} from "./admin/admin_panel/admin_panel.component";

const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  { path: 'utilisateurs', component: UtilisateurComponent},
  { path: 'admin_panel', component: Admin_panelComponent },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
