import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import {FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import { ViewEncapsulation } from '@angular/core';
import {UtilisateurService} from "../../services/utilisateur.service";
import {UesService} from "../../ues/ues.service";
import {PostsService} from "../../posts/posts.service";
import {Router} from "@angular/router";
import {AuthService} from "../auth.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent implements OnInit{
  loginForm = new FormGroup({
    email : new FormControl('', [Validators.required, Validators.email]),
    password : new FormControl('', [Validators.required, passwordValidator])
  })
  showPassword: boolean = false;

  stats = {
    user: 0,
    ue: 0,
    post: 0,
  };

  constructor(
    private utilisateurService: UtilisateurService,
    private ueService: UesService,
    private postService: PostsService,
    private cdRef: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService
  ){}

  ngOnInit() {
    this.utilisateurService.getUtilisateurs().subscribe(data => {
      this.stats.user = data.length;
    });
    this.ueService.getUes().subscribe(data => {
      this.stats.ue = data.length;
    });
    this.postService.getPosts().subscribe(data => {
      this.stats.post = data.length;
      this.cdRef.detectChanges();
      this.triggerStatAnimation();
    });

  }

  // Gestion de la soumission du formulaire
  onSubmit() {
    if (this.loginForm.invalid) {
      console.log('Formulaire invalide');
    }
    const { email, password} = this.loginForm.value;
    this.authService.login({email, mot_passe: password}).subscribe({
      next: (response: any) => {
        if (response.token) {
          console.log('Connexion réussie !', response);
          localStorage.setItem('token', response.token);

          if (response.roles.includes('ROLE_ADMIN')) {
            // Rediriger vers /dashboard
            console.log("Redirection vers le dashboard");
            this.router.navigate(['/dashboard']);
          } else {
            // Sinon, rediriger vers une autre page (par exemple accueil)
            console.log("Redirection vers l'accueil");
            this.router.navigate(['/']);
          }

        } else {
          console.log('Identifiants incorrects');
        }
      },
      error: (err) => {
        console.error('Erreur lors de la connexion :', err);
      }
    });
  }

  // Gestion de l'affichage/masquage du mot de passe
  togglePassword() {
    this.showPassword = !this.showPassword;
    const passwordField: any = document.getElementById('password');
    passwordField.type = this.showPassword ? 'text' : 'password';
  }

  // Gestion du bouton "Mot de passe oublié"
  forgotPassword() {
    alert(
      'Pour réinitialiser votre mot de passe, veuillez contacter votre administrateur système.'
    );
  }

  triggerStatAnimation() {
    const elements = document.querySelectorAll('.stat-count');

    elements.forEach((element) => {
      const finalValue = parseInt(element.textContent || '0', 10);
      const duration = 2000; // Durée totale (en ms)
      const stepTime = 50; // Intervalle (ms)
      const increment = finalValue / (duration / stepTime);

      let currentValue = 0;
      const counter = setInterval(() => {
        currentValue += increment;
        if (currentValue >= finalValue) {
          element.textContent = finalValue.toString();
          clearInterval(counter);
        } else {
          element.textContent = Math.floor(currentValue).toString();
        }
      }, stepTime);
    });
  }
}

function passwordValidator(control: FormControl): ValidationErrors | null {

  const errors: any = {}  //dictionary to store all the errors

  if (control.value.length < 10)
    errors["minLength"] = 'ok'
  if (!/[A-Z]/.test(control.value))
    errors["uppercase"] = 'ok'
  if (!/\d/.test(control.value))
    errors["number"] = 'ok'
  if ((control.value.match(/[!@#$%^&*()_+\-=\[\]{} ':"\\|,.<>\/?]/g) || []).length < 2)
    errors["specialChars"] = 'ok'

  console.log(errors)

  return errors
}
