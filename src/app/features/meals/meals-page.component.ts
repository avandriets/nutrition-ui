import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-meals-page',
  imports: [MatCardModule],
  templateUrl: './meals-page.component.html',
  styleUrl: './meals-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealsPageComponent {}
