import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { UeRegistrationComponent } from './ue-registration.component';
import { UesService } from '../../services/ues.service';
import { UtilisateurService } from '../../services/utilisateur.service';

describe('UeRegistrationComponent', () => {
  let component: UeRegistrationComponent;
  let fixture: ComponentFixture<UeRegistrationComponent>;
  let uesService: jasmine.SpyObj<UesService>;
  let utilisateurService: jasmine.SpyObj<UtilisateurService>;

  const mockUes = [
    {
      id: '1',
      code: 'WE4A',
      intitule: 'Développement Web',
      description: 'Description test',
      ects: 6,
      participants: ['1', '2']
    },
    {
      id: '2',
      code: 'MT101',
      intitule: 'Mathématiques',
      description: 'Description math',
      ects: 4,
      participants: ['1']
    }
  ];

  const mockUsers = [
    {
      id: '1',
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@example.com',
      role: ['ROLE_USER'],
      ues: []
    },
    {
      id: '2',
      nom: 'Martin',
      prenom: 'Marie',
      email: 'marie.martin@example.com',
      role: ['ROLE_PROF'],
      ues: []
    }
  ];

  const mockDepartements = [
    { id: '1', nom: 'Informatique', description: 'Département informatique' },
    { id: '2', nom: 'Mathématiques', description: 'Département mathématiques' }
  ];

  beforeEach(async () => {
    const uesServiceSpy = jasmine.createSpyObj('UesService', [
      'getAllUes',
      'createUe',
      'updateUe',
      'deleteUe',
      'getParticipantsByUe'
    ]);
    const utilisateurServiceSpy = jasmine.createSpyObj('UtilisateurService', [
      'getUtilisateurs'
    ]);

    await TestBed.configureTestingModule({
      declarations: [UeRegistrationComponent],
      imports: [ReactiveFormsModule, FormsModule, HttpClientTestingModule],
      providers: [
        { provide: UesService, useValue: uesServiceSpy },
        { provide: UtilisateurService, useValue: utilisateurServiceSpy }
      ]
    }).compileComponents();

    uesService = TestBed.inject(UesService) as jasmine.SpyObj<UesService>;
    utilisateurService = TestBed.inject(UtilisateurService) as jasmine.SpyObj<UtilisateurService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UeRegistrationComponent);
    component = fixture.componentInstance;

    // Configuration des mocks par défaut
    uesService.getAllUes.and.returnValue(of(mockUes));
    utilisateurService.getUtilisateurs.and.returnValue(of(mockUsers));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.ueForm).toBeTruthy();
    expect(component.ueForm.get('code')?.value).toBe('');
    expect(component.ueForm.get('intitule')?.value).toBe('');
    expect(component.ueForm.get('ects')?.value).toBe('');
    expect(component.ueForm.get('departementId')?.value).toBe('');
  });

  it('should load initial data on ngOnInit', async () => {
    component.ngOnInit();

    expect(uesService.getAllUes).toHaveBeenCalled();
    expect(utilisateurService.getUtilisateurs).toHaveBeenCalled();
  });

  it('should validate required fields', () => {
    const codeControl = component.ueForm.get('code');
    const intituleControl = component.ueForm.get('intitule');
    const ectsControl = component.ueForm.get('ects');
    const departementControl = component.ueForm.get('departementId');

    // Test champs vides
    codeControl?.setValue('');
    intituleControl?.setValue('');
    ectsControl?.setValue('');
    departementControl?.setValue('');

    expect(codeControl?.hasError('required')).toBeTruthy();
    expect(intituleControl?.hasError('required')).toBeTruthy();
    expect(ectsControl?.hasError('required')).toBeTruthy();
    expect(departementControl?.hasError('required')).toBeTruthy();
  });

  it('should validate code format', () => {
    const codeControl = component.ueForm.get('code');

    // Test format invalide
    codeControl?.setValue('we4a'); // minuscules
    expect(codeControl?.hasError('pattern')).toBeTruthy();

    codeControl?.setValue('WE4A123456789'); // trop long
    expect(codeControl?.hasError('pattern')).toBeTruthy();

    // Test format valide
    codeControl?.setValue('WE4A');
    expect(codeControl?.hasError('pattern')).toBeFalsy();
  });

  it('should validate ECTS range', () => {
    const ectsControl = component.ueForm.get('ects');

    // Test valeur trop petite
    ectsControl?.setValue(0);
    expect(ectsControl?.hasError('min')).toBeTruthy();

    // Test valeur trop grande
    ectsControl?.setValue(31);
    expect(ectsControl?.hasError('max')).toBeTruthy();

    // Test valeur valide
    ectsControl?.setValue(6);
    expect(ectsControl?.hasError('min')).toBeFalsy();
    expect(ectsControl?.hasError('max')).toBeFalsy();
  });

  it('should filter UEs on search', () => {
    component.ues = mockUes;
    component.searchTerm = 'web';
    component.onUeSearchChange();

    expect(component.filteredUes.length).toBe(1);
    expect(component.filteredUes[0].intitule).toContain('Web');
  });

  it('should filter users on search', async () => {
    component.users = mockUsers;
    component.userSearchTerm = 'marie';
    await component.onUserSearch();

    expect(component.searchResults.length).toBe(1);
    expect(component.searchResults[0].prenom).toBe('Marie');
  });

  it('should add user to assigned list', () => {
    const user = mockUsers[0];
    component.addUser(user);

    expect(component.assignedUsers).toContain(user);
  });

  it('should remove user from assigned list', () => {
    const user = mockUsers[0];
    component.assignedUsers = [user];
    component.removeUser(user);

    expect(component.assignedUsers).not.toContain(user);
  });

  it('should not add duplicate user', () => {
    const user = mockUsers[0];
    component.assignedUsers = [user];
    component.addUser(user);

    expect(component.assignedUsers.length).toBe(1);
  });

  it('should create UE on valid form submission', async () => {
    uesService.createUe.and.returnValue(of(mockUes[0]));

    // Remplir le formulaire avec des données valides
    component.ueForm.patchValue({
      code: 'WE4A',
      intitule: 'Développement Web',
      description: 'Description test',
      ects: 6,
      departementId: '1'
    });

    await component.onSubmit();

    expect(uesService.createUe).toHaveBeenCalled();
    expect(component.success).toBeTruthy();
  });

  it('should update UE in edit mode', async () => {
    uesService.updateUe.and.returnValue(of(mockUes[0]));

    component.isEditMode = true;
    component.editingUe = mockUes[0];

    // Remplir le formulaire avec des données valides
    component.ueForm.patchValue({
      code: 'WE4A',
      intitule: 'Développement Web Avancé',
      description: 'Description mise à jour',
      ects: 8,
      departementId: '1'
    });

    await component.onSubmit();

    expect(uesService.updateUe).toHaveBeenCalledWith(mockUes[0].id, jasmine.any(Object));
    expect(component.success).toBeTruthy();
  });

  it('should not submit invalid form', async () => {
    // Laisser le formulaire vide (invalide)
    await component.onSubmit();

    expect(uesService.createUe).not.toHaveBeenCalled();
    expect(uesService.updateUe).not.toHaveBeenCalled();
  });

  it('should handle form submission error', async () => {
    uesService.createUe.and.returnValue(throwError(() => new Error('Erreur serveur')));

    // Remplir le formulaire avec des données valides
    component.ueForm.patchValue({
      code: 'WE4A',
      intitule: 'Développement Web',
      ects: 6,
      departementId: '1'
    });

    await component.onSubmit();

    expect(component.error).toBeTruthy();
    expect(component.error).toContain('Erreur serveur');
  });

  it('should delete UE after confirmation', async () => {
    uesService.deleteUe.and.returnValue(of({ success: true }));
    spyOn(window, 'confirm').and.returnValue(true);

    await component.deleteUe(mockUes[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(uesService.deleteUe).toHaveBeenCalledWith(mockUes[0].id);
    expect(component.success).toBeTruthy();
  });

  it('should not delete UE without confirmation', async () => {
    spyOn(window, 'confirm').and.returnValue(false);

    await component.deleteUe(mockUes[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(uesService.deleteUe).not.toHaveBeenCalled();
  });

  it('should enter edit mode', async () => {
    uesService.getParticipantsByUe.and.returnValue(of([]));

    component.editUe(mockUes[0]);

    expect(component.isEditMode).toBeTruthy();
    expect(component.editingUe).toEqual(mockUes[0]);
    expect(component.ueForm.get('code')?.value).toBe(mockUes[0].code);
    expect(component.ueForm.get('intitule')?.value).toBe(mockUes[0].intitule);
  });

  it('should cancel edit mode', () => {
    component.isEditMode = true;
    component.editingUe = mockUes[0];

    component.cancelEdit();

    expect(component.isEditMode).toBeFalsy();
    expect(component.editingUe).toBeNull();
    expect(component.ueForm.get('code')?.value).toBeFalsy();
  });

  it('should handle image selection', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file] } };

    component.onImageSelected(event);

    expect(component.selectedFile).toBe(file);
  });

  it('should remove selected image', () => {
    component.selectedFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    component.imagePreview = 'data:image/jpeg;base64,test';

    component.removeImage();

    expect(component.selectedFile).toBeNull();
    expect(component.imagePreview).toBeNull();
  });

  it('should generate correct error messages', () => {
    const codeControl = component.ueForm.get('code');
    codeControl?.setValue('');
    codeControl?.markAsTouched();

    const errorMessage = component.getFieldError('code');
    expect(errorMessage).toContain('Code UE est requis');
  });

  it('should detect invalid fields correctly', () => {
    const codeControl = component.ueForm.get('code');
    codeControl?.setValue('');
    codeControl?.markAsTouched();

    expect(component.isFieldInvalid('code')).toBeTruthy();
  });

  it('should track items by ID', () => {
    const ue = mockUes[0];
    const user = mockUsers[0];

    expect(component.trackByUeId(0, ue)).toBe(ue.id);
    expect(component.trackByUserId(0, user)).toBe(user.id);
  });

  it('should build correct image URL', () => {
    const imagePath = 'test-image.jpg';
    const fullPath = '/uploads/test-image.jpg';
    const httpPath = 'http://example.com/image.jpg';

    expect(component.getImageUrl(imagePath)).toBe(`http://localhost:3000/uploads/${imagePath}`);
    expect(component.getImageUrl(httpPath)).toBe(httpPath);
  });

  it('should reset form correctly', () => {
    // Remplir le formulaire et les données
    component.ueForm.patchValue({
      code: 'TEST',
      intitule: 'Test UE'
    });
    component.assignedUsers = [mockUsers[0]];
    component.selectedFile = new File(['test'], 'test.jpg');
    component.imagePreview = 'data:image/jpeg;base64,test';
    component.error = 'Test error';
    component.success = 'Test success';

    component.resetForm();

    expect(component.ueForm.get('code')?.value).toBeFalsy();
    expect(component.ueForm.get('intitule')?.value).toBeFalsy();
    expect(component.assignedUsers.length).toBe(0);
    expect(component.selectedFile).toBeNull();
    expect(component.imagePreview).toBeNull();
    expect(component.error).toBe('');
    expect(component.success).toBe('');
  });

  it('should handle loading states correctly', () => {
    expect(component.loading).toBeFalsy();
    expect(component.submitting).toBeFalsy();
    expect(component.loadingUsers).toBeFalsy();
  });

  it('should filter search results to exclude already assigned users', async () => {
    component.users = mockUsers;
    component.assignedUsers = [mockUsers[0]]; // Jean déjà assigné
    component.userSearchTerm = 'dupont';

    await component.onUserSearch();

    // Jean ne devrait pas apparaître dans les résultats car déjà assigné
    expect(component.searchResults.length).toBe(0);
  });

  it('should show search results when users found', async () => {
    component.users = mockUsers;
    component.assignedUsers = []; // Aucun utilisateur assigné
    component.userSearchTerm = 'marie';

    await component.onUserSearch();

    expect(component.showSearchResults).toBeTruthy();
    expect(component.searchResults.length).toBe(1);
  });

  it('should hide search results when search term is empty', async () => {
    component.userSearchTerm = '';
    await component.onUserSearch();

    expect(component.showSearchResults).toBeFalsy();
    expect(component.searchResults.length).toBe(0);
  });

  it('should handle data loading error', async () => {
    uesService.getAllUes.and.returnValue(throwError(() => new Error('Network error')));

    await component.loadInitialData();

    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalsy();
  });
});
