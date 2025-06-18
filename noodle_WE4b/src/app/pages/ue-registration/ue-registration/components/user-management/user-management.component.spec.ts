import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { UserManagementComponent } from './user-management.component';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;

  const mockUsers = [
    { id: '1', nom: 'Dupont', prenom: 'Jean', email: 'jean@test.com', role: ['ROLE_USER'], ues: [] },
    { id: '2', nom: 'Martin', prenom: 'Marie', email: 'marie@test.com', role: ['ROLE_PROF'], ues: [] }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserManagementComponent],
      imports: [FormsModule]
    });

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    component.users = mockUsers;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter users on search', async () => {
    component.userSearchTerm = 'jean';
    await component.onUserSearch();

    expect(component.searchResults.length).toBe(1);
    expect(component.searchResults[0].prenom).toBe('Jean');
  });

  it('should add user to assigned list', () => {
    spyOn(component.userAdded, 'emit');
    const user = mockUsers[0];

    component.addUser(user);

    expect(component.userAdded.emit).toHaveBeenCalledWith(user);
  });

  it('should remove user from assigned list', () => {
    spyOn(component.userRemoved, 'emit');
    const user = mockUsers[0];

    component.removeUser(user);

    expect(component.userRemoved.emit).toHaveBeenCalledWith(user);
  });

  it('should get correct role label', () => {
    expect(component.getRoleLabel(['ROLE_ADMIN'])).toBe('Administrateur');
    expect(component.getRoleLabel(['ROLE_PROF'])).toBe('Professeur');
    expect(component.getRoleLabel(['ROLE_USER'])).toBe('Étudiant');
  });
});
