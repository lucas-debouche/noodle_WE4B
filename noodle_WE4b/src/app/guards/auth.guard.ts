import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// ===============================================
// AuthGuard : protège les routes
// Vérifie si l'utilisateur est connecté et chargé
// ===============================================
@Injectable({
  providedIn: 'root'  // Fournit le guard à l'échelle de l'application
})
export class AuthGuard implements CanActivate {

  // Injecte le service d'authentification et le router pour rediriger si besoin
  constructor(private authService: AuthService, private router: Router) {}

  // ------------------------------------------------
  // canActivate : exécution avant l'accès à une route protégée
  // ------------------------------------------------
  canActivate(
    route: ActivatedRouteSnapshot,   // Infos sur la route demandée
    state: RouterStateSnapshot       // Infos sur l'URL complète
  ): Observable<boolean> | boolean {

    // Vérifie s'il y a un token présent côté client
    const loggedIn = this.authService.isLoggedIn();
    console.log('🔒 AuthGuard → isLoggedIn =', loggedIn, '| token =', localStorage.getItem('token'));

    // Si non connecté → redirige vers /login
    if (!loggedIn) {
      console.log('❌ AuthGuard → Pas de token, redirection vers login');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }  // Mémorise l'URL pour un retour après login
      });
      return false;
    }

    // Si l'utilisateur est déjà chargé en mémoire
    if (this.authService.isUserLoaded()) {
      console.log('✅ AuthGuard → Utilisateur déjà chargé, accès autorisé');
      return true;
    }

    // Sinon → tente de charger l'utilisateur depuis le serveur
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
