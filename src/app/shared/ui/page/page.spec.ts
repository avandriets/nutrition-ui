import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import type { UIPageSize, UIPageSpacing } from '../../types/page.types';
import { UIPageComponent } from './page';

@Component({
  imports: [UIPageComponent],
  template: `
    <app-ui-page [header]="header()" [size]="size()" [spacing]="spacing()">
      @if (showTitle()) {
        <span title>Заголовок</span>
      }
      <span action>Действие</span>
      <span body>Содержимое</span>
    </app-ui-page>
  `,
})
class TestHost {
  readonly header = signal(true);
  readonly showTitle = signal(true);
  readonly size = signal<UIPageSize>('default');
  readonly spacing = signal<UIPageSpacing>('default');
}

describe('UIPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
  });

  it('projects header and body content', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-page-header-primary')?.textContent).toContain('Заголовок');
    expect(fixture.nativeElement.querySelector('.ui-page-header-secondary')?.textContent).toContain('Действие');
    expect(fixture.nativeElement.querySelector('.ui-page-body')?.textContent).toContain('Содержимое');
    expect((fixture.nativeElement.querySelector('app-ui-page') as HTMLElement).style.maxWidth).toBe('1180px');
  });

  it('hides header content without hiding the body', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.header.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-page-header')).toBeNull();
    expect(fixture.nativeElement.querySelector('.ui-page-body')?.textContent).toContain('Содержимое');
  });

  it('maps semantic variants to layout values', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.size.set('wide');
    fixture.componentInstance.spacing.set('compact');
    fixture.detectChanges();

    const page = fixture.nativeElement.querySelector('app-ui-page') as HTMLElement;
    expect(page.style.maxWidth).toBe('1240px');
    expect(page.style.padding).toBe('46px 28px 80px');
    expect(page.style.getPropertyValue('--ui-page-mobile-padding')).toBe('32px 16px 60px');
  });
});
