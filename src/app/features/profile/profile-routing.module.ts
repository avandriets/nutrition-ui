import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfilePageComponent } from './components';

const routes: Routes = [{ path: '', component: ProfilePageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), ProfilePageComponent],
  exports: [RouterModule],
})
export class ProfileRoutingModule {
}
