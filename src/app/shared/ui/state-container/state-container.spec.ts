import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import type { UIState } from '../../types/state-container.types';
import { UIStateContainerComponent } from './state-container';

@Component({
  imports: [UIStateContainerComponent],
  template: `
    <app-ui-state-container [height]="'380px'" [state]="state" [resolved]="resolved" [empty]="empty" [rejected]="rejected" [pending]="pending" [updating]="updating">
      <ng-template #resolved>resolved</ng-template>
      <ng-template #empty>empty</ng-template>
      <ng-template #rejected>rejected</ng-template>
      <ng-template #pending>pending</ng-template>
      <ng-template #updating>updating</ng-template>
    </app-ui-state-container>
  `,
})
class TestHost {
  state?: UIState;
}

@Component({
  imports: [UIStateContainerComponent],
  template: `<app-ui-state-container [state]="state" />`,
})
class DefaultTestHost {
  state?: UIState;
}

describe('UIStateContainerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DefaultTestHost, TestHost] }).compileComponents();
  });

  it('shows pending by default and applies the minimum height', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('app-ui-state-container') as HTMLElement;
    expect(container.style.minHeight).toBe('380px');
    expect(container.querySelector('.ui-state-container__pending')?.textContent).toContain('pending');
  });

  it('shows resolved content', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.state = { resolved: true, rejected: false, pending: false, err: null };
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-state-container__resolved')?.textContent).toContain('resolved');
    expect(fixture.nativeElement.querySelector('.ui-state-container__pending')).toBeNull();
  });

  it('shows custom empty content instead of resolved content', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.state = { resolved: true, rejected: false, pending: false, err: null, empty: true };
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-state-container__empty')?.textContent).toContain('empty');
    expect(fixture.nativeElement.querySelector('.ui-state-container__resolved')).toBeNull();
  });

  it('shows rejected content when any state is rejected', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.state = {
      request: { resolved: false, rejected: true, pending: false, err: 'Ошибка' },
      dictionary: { resolved: true, rejected: false, pending: false, err: null },
    };
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-state-container__rejected')?.textContent).toContain('rejected');
  });

  it('keeps resolved content visible while updating', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.state = [
      { resolved: true, rejected: false, pending: true, err: null },
      { resolved: true, rejected: false, pending: false, err: null },
    ];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-state-container__resolved')?.textContent).toContain('resolved');
    expect(fixture.nativeElement.querySelector('.ui-state-container__updating')?.textContent).toContain('updating');
  });

  it('shows the default pending state', () => {
    const fixture = TestBed.createComponent(DefaultTestHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-state-container__pending')?.textContent).toContain('Загрузка данных…');
  });

  it('shows the default rejected state and error details', () => {
    const fixture = TestBed.createComponent(DefaultTestHost);
    fixture.componentInstance.state = { resolved: false, rejected: true, pending: false, err: 'Сервис недоступен' };
    fixture.detectChanges();

    const rejected = fixture.nativeElement.querySelector('.ui-state-container__rejected') as HTMLElement;
    expect(rejected.textContent).toContain('Произошла ошибка при загрузке данных');
    expect(rejected.textContent).toContain('Сервис недоступен');
  });

  it('shows the default empty state', () => {
    const fixture = TestBed.createComponent(DefaultTestHost);
    fixture.componentInstance.state = { resolved: true, rejected: false, pending: false, err: null, empty: true };
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-state-container__empty')?.textContent).toContain('Нет данных');
  });
});
