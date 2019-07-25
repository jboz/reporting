import { Component, OnInit } from '@angular/core';
import { ProfileService } from 'src/app/service/profile.service';
import { User } from 'src/app/model/user.model';
import { Observable, of } from 'rxjs';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { tap, mergeMap, map } from 'rxjs/operators';
import { SettingsState, SaveSettings, SelectProject } from 'src/app/store/settings.store';
import { Select, Store } from '@ngxs/store';
import { SettingsService } from 'src/app/service/settings.service';
import { Settings, DEFAULT_SETTINGS } from 'src/app/model/settings.model';
import * as moment from 'moment';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  public user$: Observable<User>;

  @Select(SettingsState.project)
  public project$: Observable<string>;

  public settings$: Observable<Settings>;
  public projects$: Observable<string[]>;

  public form: FormGroup;

  public logo$: Observable<string>;

  public uploadLogo$ = (file: File) => this.project$.pipe(mergeMap(projectName => this.settingsService.uploadLogo(file, projectName)));

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private settingsService: SettingsService,
    private store: Store,
    private authService: AuthService
  ) {}

  signOut() {
    this.authService.signOutUser();
  }

  ngOnInit() {
    this.form = this.fb.group({
      projectName: ['', Validators.required],
      timbrage: this.fb.group({
        dailyReport: ['', [Validators.required, Validators.pattern('^[0-9]*$')]]
      }),
      bill: this.fb.group({
        currency: ['', Validators.required],
        tvaNumber: ['', Validators.required],
        hourlyRate: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
        tvaRate: ['', [Validators.required, Validators.pattern(/^\d+\.\d{2}$/)]],
        account: this.fb.group({
          number: ['', Validators.required],
          iban: ['', Validators.required]
        })
      })
    });

    this.user$ = this.profileService.user$.pipe(tap(user => this.form.patchValue(user)));

    this.settings$ = this.project$.pipe(
      tap(() => this.form.reset()),
      mergeMap(projectName => this.settingsService.read(projectName)),
      map(settings => ({ ...DEFAULT_SETTINGS, ...settings })),
      tap(settings => this.form.patchValue(settings))
    );

    this.projects$ = this.settingsService.projects$;

    this.logo$ = this.project$.pipe(mergeMap(projectName => this.settingsService.readLogo(projectName)));
  }

  public selectProject(event) {
    return this.store.dispatch(new SelectProject(event.value));
  }

  public addProject(projectName: string) {
    this.settingsService
      .save({ ...DEFAULT_SETTINGS, projectName: projectName })
      .pipe(mergeMap(settings => this.store.dispatch(new SelectProject(settings.projectName))))
      .subscribe();
  }

  public removeProject(projectName: string) {
    this.settingsService
      .removeSettings(projectName)
      .pipe(mergeMap(settings => this.store.dispatch(new SelectProject(DEFAULT_SETTINGS.projectName))))
      .subscribe();
  }

  public get today() {
    return moment().format('YYYY-MM');
  }

  public save() {
    this.store.dispatch(new SaveSettings({ ...this.form.value }));
  }
}
