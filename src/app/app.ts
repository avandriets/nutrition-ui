import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SessionService } from './core/auth/session.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly session = inject(SessionService);
  readonly navigation = [
    { label: 'Overview', icon: 'dashboard', path: '/overview' },
    { label: 'Products', icon: 'grocery', path: '/products' },
    { label: 'Meals', icon: 'restaurant', path: '/meals' },
    { label: 'Statistics', icon: 'monitoring', path: '/statistics' },
  ];
}
