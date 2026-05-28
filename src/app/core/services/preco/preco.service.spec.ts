import { TestBed } from '@angular/core/testing';

import { PrecoService } from './preco.service';

describe('PrecoService', () => {
  let service: PrecoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrecoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
