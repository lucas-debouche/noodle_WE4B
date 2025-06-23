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
import { SectionsUeComponent } from './pages/mes-ue/sections-ue/sections-ue.component';
import { SidebarMesUeComponent } from './pages/mes-ue/sidebar-mes-ue/sidebar-mes-ue.component';
import { PostMesUeComponent } from './pages/mes-ue/post-mes-ue/post-mes-ue.component';
import { CreatePostUeComponent } from './pages/mes-ue/create-post-ue/create-post-ue.component';
import { DevoirRenduComponent } from './pages/mes-ue/post-mes-ue/devoir-rendu/devoir-rendu.component';
import { CorrectionModalComponent } from './pages/mes-ue/post-mes-ue/correction-modal/correction-modal.component';
import { RendusModalComponent } from './pages/mes-ue/post-mes-ue/rendus-modal/rendus-modal.component';
import { FichierContentComponent } from './pages/mes-ue/post-mes-ue/fichier-content/fichier-content.component';
import { DevoirContentComponent } from './pages/mes-ue/post-mes-ue/devoir-content/devoir-content.component';

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
    SidebarMesUeComponent,
    PostMesUeComponent,
    CreatePostUeComponent,
    DevoirRenduComponent,
    CorrectionModalComponent,
    RendusModalComponent,
    FichierContentComponent,
    DevoirContentComponent,
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
