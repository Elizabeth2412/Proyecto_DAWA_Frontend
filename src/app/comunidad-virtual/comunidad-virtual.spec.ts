import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComunidadVirtual } from './comunidad-virtual';

describe('ComunidadVirtual', () => {
  let component: ComunidadVirtual;
  let fixture: ComponentFixture<ComunidadVirtual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComunidadVirtual]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComunidadVirtual);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
