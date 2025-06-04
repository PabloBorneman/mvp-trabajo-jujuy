import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatFloat } from './chat-float';

describe('ChatFloat', () => {
  let component: ChatFloat;
  let fixture: ComponentFixture<ChatFloat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatFloat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatFloat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
