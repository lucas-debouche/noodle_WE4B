import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-user-account-info',
  templateUrl: './user-account-info.component.html',
  styleUrls: ['./user-account-info.component.scss']
})
export class UserAccountInfoComponent implements OnInit {
  @Input() form!: FormGroup;

  showPassword: boolean = false;
  passwordStrength: number = 0;

  ngOnInit(): void {
    // Écoute les changements du mot de passe pour la force
    this.form.get('plainPassword')?.valueChanges.subscribe(password => {
      this.calculatePasswordStrength(password);
    });
  }

  // Gestion de la force du mot de passe
  calculatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = 0;
      return;
    }

    let strength = 0;

    // Longueur
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;

    // Caractères
    if (/[a-z]/.test(password)) strength += 12.5;
    if (/[A-Z]/.test(password)) strength += 12.5;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

    this.passwordStrength = Math.min(100, strength);
  }

  getPasswordStrengthClass(): string {
    if (this.passwordStrength < 40) return 'weak';
    if (this.passwordStrength < 70) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    if (this.passwordStrength < 40) return 'Faible';
    if (this.passwordStrength < 70) return 'Moyen';
    return 'Fort';
  }
}
