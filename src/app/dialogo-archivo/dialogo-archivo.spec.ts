//src/app/dialogo-archivos/dialogo-archivos.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogoArchivoComponent } from './dialogo-archivo';

describe('DialogoArchivo', () => {
  let component: DialogoArchivoComponent;
  let fixture: ComponentFixture<DialogoArchivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogoArchivoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogoArchivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
