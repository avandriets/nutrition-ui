import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-feature-placeholder',
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './feature-placeholder.html',
  styleUrl: './feature-placeholder.scss',
})
export class FeaturePlaceholder {
  private readonly route = inject(ActivatedRoute);
  protected readonly data = this.route.snapshot.data;
}
