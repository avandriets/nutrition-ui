import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardPageComponent } from './components';

const routes: Routes = [{ path: '', component: DashboardPageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), DashboardPageComponent],
  exports: [RouterModule],
})
export class DashboardRoutingModule {
}
