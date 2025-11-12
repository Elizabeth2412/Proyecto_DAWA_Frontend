import { TestBed } from '@angular/core/testing';
import { ServicioAlmacenamientoIndexedDB } from './servicio-almacenamiento-indexeddb';
describe('ServicioAlmacenamientoIndexeddb', () => {
  let service: ServicioAlmacenamientoIndexedDB;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicioAlmacenamientoIndexedDB);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
