import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {

    const loggedIn = this.authService.isLoggedIn();
    console.log('🔒 AuthGuard → isLoggedIn =', loggedIn, '| token =', localStorage.getItem('token'));

    if (!loggedIn) {
      console.log('❌ AuthGuard → Pas de token, redirection vers login');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    // Si l'utilisateur est déjà chargé, on peut continuer
    if (this.authService.isUserLoaded()) {
      console.log('✅ AuthGuard → Utilisateur déjà chargé, accès autorisé');
      return true;
    }

    // Sinon, charger l'utilisateur depuis le serveur
    console.log('🔄 AuthGuard → Chargement de l\'utilisateur...');
    return this.authService.getCurrentUserFromServer().pipe(
      map(user => {
        if (user) {
          console.log('✅ AuthGuard → Utilisateur chargé, accès autorisé:', user.nom, user.prenom);
          return true;
        } else {
          console.log('❌ AuthGuard → Impossible de charger l\'utilisateur, redirection vers login');
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
      }),
      catchError(error => {
        console.error('❌ AuthGuard → Erreur lors du chargement:', error);
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return of(false);
      })
    );
  }
}
