import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormPop } from './form-pop';

describe('FormPop', () => {
  let component: FormPop;
  let fixture: ComponentFixture<FormPop>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormPop]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormPop);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
