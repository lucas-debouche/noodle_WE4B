import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForumFileAttachmentComponent } from './forum-file-attachment.component';

describe('ForumFileAttachmentComponent', () => {
  let component: ForumFileAttachmentComponent;
  let fixture: ComponentFixture<ForumFileAttachmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForumFileAttachmentComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForumFileAttachmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format file size correctly', () => {
    expect(component.formatFileSize(0)).toBe('0 B');
    expect(component.formatFileSize(1024)).toBe('1 KB');
    expect(component.formatFileSize(1048576)).toBe('1 MB');
  });

  it('should get correct file icon', () => {
    expect(component.getFileIcon('image/jpeg')).toBe('🖼️');
    expect(component.getFileIcon('application/pdf')).toBe('📕');
    expect(component.getFileIcon('text/plain')).toBe('📄');
  });

  it('should identify image files correctly', () => {
    expect(component.isImageFile('image/jpeg')).toBeTruthy();
    expect(component.isImageFile('application/pdf')).toBeFalsy();
  });

  it('should emit downloadFile event', () => {
    spyOn(component.downloadFile, 'emit');
    component.onDownloadFile('test.pdf', 'original.pdf');
    expect(component.downloadFile.emit).toHaveBeenCalledWith({
      filename: 'test.pdf',
      originalName: 'original.pdf'
    });
  });
});
