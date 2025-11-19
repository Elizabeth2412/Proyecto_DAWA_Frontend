import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrudArchivos } from './crud-archivos';

describe('CrudArchivos', () => {
  let component: CrudArchivos;
  let fixture: ComponentFixture<CrudArchivos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrudArchivos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrudArchivos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
