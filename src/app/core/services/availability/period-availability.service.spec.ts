import { TestBed } from '@angular/core/testing';

import { PeriodAvailability } from './period-availability';

describe('PeriodAvailability', () => {
  let service: PeriodAvailability;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PeriodAvailability);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
