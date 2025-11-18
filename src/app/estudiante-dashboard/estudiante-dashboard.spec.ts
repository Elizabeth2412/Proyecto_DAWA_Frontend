import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstudianteDashboard } from './estudiante-dashboard';

describe('EstudianteDashboard', () => {
  let componente: EstudianteDashboard;
  let fixture: ComponentFixture<EstudianteDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstudianteDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstudianteDashboard);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse', () => {
    expect(componente).toBeTruthy();
  });
});
