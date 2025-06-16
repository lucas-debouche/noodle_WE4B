import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UtilisateurComponent } from './utilisateurs/utilisateurs.component';
import { ChoixUeComponent } from './pages/choix-ue/choix-ue.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { ProfilSidebarComponent } from './profil-sidebar/profil-sidebar.component';
import { AuthInterceptor } from './services/auth.interceptor.service';
import { LoginComponent } from './pages/login/login.component';
import { UeBoxComponent } from './ue-box/ue-box.component';
import { MesUeComponent } from "./pages/mes-ue/mes-ue.component";
import { SectionsUeComponent } from './sections-ue/sections-ue.component';
import { ModulesUeComponent } from './modules-ue/modules-ue.component';
import { SidebarMesUeComponent } from './sidebar-mes-ue/sidebar-mes-ue.component';

@NgModule({
  declarations: [
    AppComponent,
    UtilisateurComponent,
    ChoixUeComponent,
    NavbarComponent,
    FooterComponent,
    ProfilSidebarComponent,
    LoginComponent,
    MesUeComponent,
    UeBoxComponent,
    SectionsUeComponent,
    ModulesUeComponent,
    SidebarMesUeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
