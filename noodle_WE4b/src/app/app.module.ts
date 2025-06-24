import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Admin_panelComponent } from './admin/admin_panel/admin_panel.component';
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

import { ForumListComponent } from './pages/forums/forum-list/forum-list.component';
import { ForumDetailComponent } from './pages/forums/forum-detail/forum-detail.component';
import { ForumHeaderComponent } from './pages/forums/forum-header/forum-header.component';
import { ForumCreateCardComponent } from './pages/forums/forum-create-card/forum-create-card.component';
import { ForumFiltersCardComponent } from './pages/forums/forum-filters-card/forum-filters-card.component';
import { ForumDiscussionCardComponent } from './pages/forums/forum-discussion-card/forum-discussion-card.component';
import { ForumEmptyStateComponent } from './pages/forums/forum-empty-state/forum-empty-state.component';
import { ForumMessageComponent } from './pages/forums/forum-message/forum-message.component';
import { ForumReplyComponent } from './pages/forums/forum-reply/forum-reply.component';
import { ForumMessageFormComponent } from './pages/forums/forum-message-form/forum-message-form.component';
import { ForumFileAttachmentComponent } from './pages/forums/forum-file-attachment/forum-file-attachment.component';
import { ForumEmojiPickerComponent } from './pages/forums/forum-emoji-picker/forum-emoji-picker.component';

import { ParticipantsListComponent } from './pages/partipants-ue/participants-list/participants-list.component';
import { UeHeaderComponent } from './pages/partipants-ue/ue-header/ue-header.component';
import { ParticipantsFiltersComponent } from './pages/partipants-ue/participants-filters/participants-filters.component';
import { ParticipantsGridComponent } from './pages/partipants-ue/participants-grid/participants-grid.component';
import { ParticipantCardComponent } from './pages/partipants-ue/participant-card/participant-card.component';
import { ParticipantsEmptyStateComponent } from './pages/partipants-ue/participants-empty-state/participants-empty-state.component';
import { UeFormComponent } from './pages/ue-registration/ue-registration/components/ue-form/ue-form.component';
import { UeListComponent } from './pages/ue-registration/ue-registration/components/ue-list/ue-list.component';
import { UserManagementComponent } from './pages/ue-registration/ue-registration/components/user-management/user-management.component';
import { UeCardComponent } from './pages/ue-registration/ue-registration/components/ue-card/ue-card.component';
import { ImageUploadComponent } from './pages/ue-registration/ue-registration/components/image-upload/image-upload.component';
import { UeRegistrationComponent} from "./pages/ue-registration/ue-registration/ue-registration.component";

@NgModule({
  declarations: [
    AppComponent,
    Admin_panelComponent,
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
    ForumListComponent,
    ForumDetailComponent,
    ParticipantsListComponent,
    ForumHeaderComponent,
    ForumCreateCardComponent,
    ForumFiltersCardComponent,
    ForumDiscussionCardComponent,
    ForumEmptyStateComponent,
    ForumMessageComponent,
    ForumReplyComponent,
    ForumMessageFormComponent,
    ForumFileAttachmentComponent,
    ForumEmojiPickerComponent,
    UeHeaderComponent,
    ParticipantsFiltersComponent,
    ParticipantsGridComponent,
    ParticipantCardComponent,
    ParticipantsEmptyStateComponent,
    UeFormComponent,
    UeListComponent,
    UserManagementComponent,
    UeCardComponent,
    ImageUploadComponent,
    UeRegistrationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
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

