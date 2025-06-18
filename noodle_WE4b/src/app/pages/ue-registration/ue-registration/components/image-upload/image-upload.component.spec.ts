import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageUploadComponent } from './image-upload.component';

describe('ImageUploadComponent', () => {
  let component: ImageUploadComponent;
  let fixture: ComponentFixture<ImageUploadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ImageUploadComponent]
    });

    fixture = TestBed.createComponent(ImageUploadComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit file when valid image selected', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [mockFile] } };

    spyOn(component.fileSelected, 'emit');
    component.onFileSelected(event);

    expect(component.fileSelected.emit).toHaveBeenCalledWith(mockFile);
  });

  it('should reject non-image files', () => {
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const event = { target: { files: [mockFile] } };

    spyOn(window, 'alert');
    component.onFileSelected(event);

    expect(window.alert).toHaveBeenCalledWith('Veuillez sélectionner un fichier image');
  });

  it('should remove image', () => {
    spyOn(component.fileSelected, 'emit');
    spyOn(component.previewChanged, 'emit');

    component.removeImage();

    expect(component.fileSelected.emit).toHaveBeenCalledWith(null);
    expect(component.previewChanged.emit).toHaveBeenCalledWith(null);
  });
});
