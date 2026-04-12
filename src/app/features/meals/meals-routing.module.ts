import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MealsPageComponent } from './meals-page.component';

const routes: Routes = [{ path: '', component: MealsPageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), MealsPageComponent],
  exports: [RouterModule],
})
export class MealsRoutingModule {}
