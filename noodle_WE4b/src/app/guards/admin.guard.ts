import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {

    console.log('🔐 AdminGuard → Vérification des droits admin...');

    // Vérifier d'abord l'authentification
    if (!this.authService.isLoggedIn()) {
      console.log('❌ AdminGuard → Pas de token, redirection vers login');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    // Si l'utilisateur est déjà chargé, vérifier les droits
    if (this.authService.isUserLoaded()) {
      return this.checkAdminAccess(state.url);
    }

    // Sinon, charger l'utilisateur puis vérifier les droits
    console.log('🔄 AdminGuard → Chargement de l\'utilisateur pour vérification admin...');
    return this.authService.getCurrentUserFromServer().pipe(
      map(user => {
        if (!user) {
          console.log('❌ AdminGuard → Impossible de charger l\'utilisateur');
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }

        return this.checkAdminAccess(state.url);
      }),
      catchError(error => {
        console.error('❌ AdminGuard → Erreur lors du chargement:', error);
        this.authService.logout();
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return of(false);
      })
    );
  }

  private checkAdminAccess(url: string): boolean {
    const user = this.authService.getCurrentUserValue();

    console.log('👤 AdminGuard → Utilisateur:', user ? `${user.nom} ${user.prenom}` : 'null');
    console.log('🎭 AdminGuard → Rôles:', user ? user.role : 'aucun');

    if (this.authService.hasRole('ROLE_ADMIN')) {
      console.log('✅ AdminGuard → Accès admin autorisé');
      return true;
    } else {
      console.log('❌ AdminGuard → Accès admin refusé - Rôles insuffisants');
      console.log('🔄 AdminGuard → Redirection vers /choix-ue');
      this.router.navigate(['/choix-ue'], {
        queryParams: { error: 'access-denied' }
      });
      return false;
    }
  }
}
