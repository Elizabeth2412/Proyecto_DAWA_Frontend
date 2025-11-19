import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginalPrincipal } from './paginal-principal';

describe('PaginalPrincipal', () => {
  let component: PaginalPrincipal;
  let fixture: ComponentFixture<PaginalPrincipal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginalPrincipal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaginalPrincipal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
