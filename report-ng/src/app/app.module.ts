import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';


import {AppComponent} from './app.component';
import {MonthComponent} from './page/month/month.component';
import {MomentPipe} from './pipe/moment/moment.pipe';
import {DurationPipe} from './pipe/moment/duration.pipe';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './page/home/home.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  MatButtonModule,
  MatCardModule,
  MatDatepickerModule,
  MatDialogModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatNativeDateModule,
  MatOptionModule,
  MatSelectModule,
  MatTableModule,
  MatToolbarModule,
} from '@angular/material';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from "@angular/common/http";
import {ActivityClient} from "./client/activity-client.service";
import {FlexLayoutModule} from "@angular/flex-layout";
import {TimeClient} from "./client/time-client.service";
import {DailyReportComponent} from './page/month/daily-report/daily-report.component';

const appRoutes: Routes = [
  {
    path: '', redirectTo: '/home', pathMatch: 'full'
  },
  {path: 'home', component: HomeComponent},
  {path: 'month/:month', component: MonthComponent}
];

@NgModule({
  declarations: [
    AppComponent,
    MonthComponent,
    MomentPipe,
    DurationPipe,
    HomeComponent,
    DailyReportComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot(appRoutes, {enableTracing: false}),
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatNativeDateModule,
    MatTableModule,
    MatToolbarModule,
    MatListModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FlexLayoutModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule
  ],
  providers: [ActivityClient, TimeClient],
  bootstrap: [AppComponent],
  entryComponents: [DailyReportComponent]
})
export class AppModule {
}
