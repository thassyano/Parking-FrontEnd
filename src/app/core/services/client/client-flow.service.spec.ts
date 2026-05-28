import { TestBed } from '@angular/core/testing';

import { ClientFlowService } from './client-flow.service';

describe('ClienteFlowService', () => {
  let service: ClientFlowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientFlowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
