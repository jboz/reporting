import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Duration, Moment } from 'moment';
import { Observable } from 'rxjs/internal/Observable';
import { Select, Store } from '@ngxs/store';
import { map, mergeMap } from 'rxjs/operators';
import { timer, combineLatest } from 'rxjs';
import { Router } from '@angular/router';
import { TimesService } from 'projects/commons/src/lib/times/times.service';
import { CalculationService } from 'projects/commons/src/lib/times/calculation.service';
import { TimesState, SelectDate, AddTime } from 'projects/commons/src/lib/times/time.store';
import { Time, TimeAdapter } from 'projects/commons/src/lib/times/time.model';
import { ProjectState } from 'projects/commons/src/lib/settings/project.store';

@Component({
  selector: 'app-timbrage',
  templateUrl: './timbrage.component.html',
  styleUrls: ['./timbrage.component.scss']
})
export class TimbrageComponent implements OnInit {
  @Select(ProjectState.project)
  public project$: Observable<string>; // projet sélectionné

  @Select(TimesState.selectedDate)
  public selectedDate$: Observable<Moment>; // jour sélectionné

  public times$: Observable<Time[]>; // timbrage du jour

  now$: Observable<Date>; // horloge
  sumDay$: Observable<Duration>; // somme des heures travaillées du jour

  constructor(
    private calculationService: CalculationService,
    private timesService: TimesService,
    private store: Store,
    private router: Router
  ) {}

  ngOnInit() {
    this.times$ = combineLatest(this.project$, this.selectedDate$).pipe(mergeMap(pair => this.timesService.read(pair[1])));
    // basé sur un timer
    this.now$ = timer(0, 1000).pipe(map(() => new Date()));
    this.sumDay$ = combineLatest(timer(0, 1000), this.times$).pipe(mergeMap(pair => this.calculationService.calculate(pair[1])));

    this.store.dispatch(new SelectDate(moment())); // charge le jour en cours
  }

  public addTimbrage() {
    this.store.dispatch(new AddTime(TimeAdapter.createTime()));
  }

  public openCalendar() {
    this.router.navigate(['/calendar'], { replaceUrl: true });
  }
}