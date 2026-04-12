import { ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { appConfig } from './app.config';
import { App } from './app';

describe('App', () => {
  let appRef: ApplicationRef | undefined;

  beforeEach(() => {
    document.body.innerHTML = '<app-root></app-root>';
  });

  afterEach(() => {
    appRef?.destroy();
    appRef = undefined;
    document.body.innerHTML = '';
  });

  it('should bootstrap the app', async () => {
    appRef = await bootstrapApplication(App, appConfig);

    expect(appRef.components[0]?.instance).toBeInstanceOf(App);
  });

  it('should show toolbar title', async () => {
    appRef = await bootstrapApplication(App, appConfig);
    await appRef.whenStable();

    expect(document.querySelector('mat-toolbar')?.textContent).toContain('Nutrition');
  });
});
