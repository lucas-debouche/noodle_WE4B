import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { UeFormComponent } from './ue-form.component';
import { UesService } from '../../../../../services/ues.service';

describe('UeFormComponent', () => {
  let component: UeFormComponent;
  let fixture: ComponentFixture<UeFormComponent>;
  let uesService: jasmine.SpyObj<UesService>;

  beforeEach(() => {
    const uesServiceSpy = jasmine.createSpyObj('UesService', ['createUe', 'updateUe']);

    TestBed.configureTestingModule({
      declarations: [UeFormComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: UesService, useValue: uesServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(UeFormComponent);
    component = fixture.componentInstance;
    uesService = TestBed.inject(UesService) as jasmine.SpyObj<UesService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with validators', () => {
    expect(component.ueForm).toBeTruthy();
    expect(component.ueForm.get('code')?.hasError('required')).toBeTruthy();
    expect(component.ueForm.get('intitule')?.hasError('required')).toBeTruthy();
  });

  it('should validate code pattern', () => {
    const codeControl = component.ueForm.get('code');

    codeControl?.setValue('we4a'); // minuscules
    expect(codeControl?.hasError('pattern')).toBeTruthy();

    codeControl?.setValue('WE4A'); // valide
    expect(codeControl?.hasError('pattern')).toBeFalsy();
  });

  it('should create UE on valid submission', async () => {
    const mockUe = { id: '1', code: 'TEST', intitule: 'Test UE', ects: 6 } as any;
    uesService.createUe.and.returnValue(of(mockUe));

    component.ueForm.patchValue({
      code: 'TEST',
      intitule: 'Test UE',
      ects: 6,
      departementId: '1'
    });

    spyOn(component.ueCreated, 'emit');
    await component.onSubmit();

    expect(uesService.createUe).toHaveBeenCalled();
    expect(component.ueCreated.emit).toHaveBeenCalledWith(mockUe);
  });
});
