import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthAdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {

    console.log('🔐 AuthAdminGuard → Vérification auth + admin...');

    // Vérifier le token
    if (!this.authService.isLoggedIn()) {
      console.log('❌ AuthAdminGuard → Pas de token');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    // Si utilisateur déjà chargé, vérifier directement
    if (this.authService.isUserLoaded()) {
      console.log('✅ AuthAdminGuard → Utilisateur déjà chargé, vérification des droits...');
      return this.checkAdminAccess(state.url);
    }

    // Charger l'utilisateur puis vérifier
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
        this.authService.logout();
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }

  private checkAdminAccess(url: string): boolean {
    const user = this.authService.getCurrentUserValue();

    if (!user) {
      console.log('❌ AuthAdminGuard → Pas d\'utilisateur');
      this.router.navigate(['/login']);
      return false;
    }

    console.log('👤 AuthAdminGuard → Utilisateur:', `${user.nom} ${user.prenom}`);
    console.log('🎭 AuthAdminGuard → Rôles:', user.role);

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
