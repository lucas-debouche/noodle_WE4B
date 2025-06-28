import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// ===============================================
// AuthAdminGuard : protège les routes réservées aux ADMIN
// Vérifie d'abord l'authentification, puis le rôle ROLE_ADMIN
// ===============================================
@Injectable({
  providedIn: 'root' // Disponible partout dans l'app
})
export class AuthAdminGuard implements CanActivate {

  // Injection du service Auth et du Router pour redirection
  constructor(private authService: AuthService, private router: Router) {}

  // ------------------------------------------------
  // canActivate : vérifie avant l'accès à une route admin
  // ------------------------------------------------
  canActivate(
    route: ActivatedRouteSnapshot,   // Infos route
    state: RouterStateSnapshot       // URL demandée
  ): Observable<boolean> | boolean {

    console.log('🔐 AuthAdminGuard → Vérification auth + admin...');

    // 1️⃣ Vérifie la présence d'un token
    if (!this.authService.isLoggedIn()) {
      console.log('❌ AuthAdminGuard → Pas de token');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    // 2️⃣ Si l'utilisateur est déjà chargé en mémoire
    if (this.authService.isUserLoaded()) {
      console.log('✅ AuthAdminGuard → Utilisateur déjà chargé, vérification des droits...');
      return this.checkAdminAccess(state.url);
    }

    // 3️⃣ Sinon, charge l'utilisateur depuis le serveur
    console.log('🔄 AuthAdminGuard → Chargement utilisateur...');
    return this.authService.getCurrentUserFromServer().pipe(
      map(user => {
        if (!user) {
          console.log('❌ AuthAdminGuard → Utilisateur non chargé');
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }

        console.log('✅ AuthAdminGuard → Utilisateur chargé, vérification des droits...');
        return this.checkAdminAccess(state.url);
      }),
      catchError(error => {
        console.error('❌ AuthAdminGuard → Erreur:', error);
        this.authService.logout(); // Déconnecte proprement si erreur
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }

  // ------------------------------------------------
  // checkAdminAccess : vérifie le rôle ROLE_ADMIN
  // ------------------------------------------------
  private checkAdminAccess(url: string): boolean {
    const user = this.authService.getCurrentUserValue();

    if (!user) {
      console.log('❌ AuthAdminGuard → Pas d\'utilisateur');
      this.router.navigate(['/login']);
      return false;
    }

    console.log('👤 AuthAdminGuard → Utilisateur:', `${user.nom} ${user.prenom}`);
    console.log('🎭 AuthAdminGuard → Rôles:', user.role);

    // Vérifie si l'utilisateur a le rôle ADMIN
    if (this.authService.hasRole('ROLE_ADMIN')) {
      console.log('✅ AuthAdminGuard → Accès admin autorisé');
      return true;
    } else {
      console.log('❌ AuthAdminGuard → Accès admin refusé');
      this.router.navigate(['/choix-ue'], {
        queryParams: { error: 'access-denied' }
      });
      return false;
    }
  }
}
