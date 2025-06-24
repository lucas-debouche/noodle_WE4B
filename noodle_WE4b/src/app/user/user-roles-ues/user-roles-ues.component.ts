import { Component, Input} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-user-roles-ues',
  templateUrl: './user-roles-ues.component.html',
  styleUrls: ['./user-roles-ues.component.scss']
})
export class UserRolesUesComponent {
  @Input() form!: FormGroup;
  @Input() roles: string[] = [];
  @Input() departements: any[] = [];

  // Icônes pour les rôles
  private roleIcons: { [key: string]: string } = {
    'ROLE_ADMIN': '📋',
    'ROLE_PROF': '👨‍🏫',
    'ROLE_USER': '🎓',
  };

  toggleRole(role: string): void {
    const currentRoles = this.form.get('roles')?.value || [];
    const roleIndex = currentRoles.indexOf(role);

    if (roleIndex > -1) {
      currentRoles.splice(roleIndex, 1);
    } else {
      currentRoles.push(role);
    }

    this.form.patchValue({roles: currentRoles});
  }

  isRoleSelected(role: string): boolean {
    const currentRoles = this.form.get('roles')?.value || [];
    return currentRoles.includes(role);
  }

  getRoleIcon(role: string): string {
    return this.roleIcons[role.toUpperCase()] || this.roleIcons['default'];
  }

  addUeToUserBySelect(ueId: string) {
    const ue = this.departements.find(u => u._id === ueId);
    if (ue) {
      const ues = this.form.get('ues')?.value || [];
      if (!ues.includes(ueId)) {
        ues.push(ueId);
        this.form.patchValue({ues});
      }
    }
  }

  getUeName(ueId: string): string {
    const ue = this.departements.find(u => u._id === ueId);
    return ue ? ue.intitule : ueId;
  }

  removeUeFromUser(ueId: string): void {
    let ues = this.form.get('ues')?.value || [];
    ues = ues.filter((id: string) => id !== ueId);
    this.form.patchValue({ues});
  }

}
