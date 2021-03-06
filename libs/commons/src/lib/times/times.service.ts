import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngxs/store';
import * as moment from 'moment';
import { Moment } from 'moment';
import { Observable } from 'rxjs';
import { map, mergeMap, take } from 'rxjs/operators';
import { User } from '../auth/user/user.model';
import { UserService } from '../auth/user/user.service';
import { Bill } from '../bill/bill.model';
import { BusinessError } from '../error/business.error';
import { SettingsState } from '../settings/settings.store';
import { DATETIME_ISO_FORMAT, Time, TimeAdapter, TimeModel } from './time.model';

export type Unit = 'day' | 'week' | 'month';

@Injectable()
export class TimesService {
  constructor(
    private firestore: AngularFirestore,
    private userService: UserService,
    private store: Store,
    private translateService: TranslateService
  ) {}

  private readData(): Observable<{ user: User; project: string }> {
    return this.userService.user$.pipe(
      mergeMap(user => this.store.select(SettingsState.project).pipe(map(project => ({ user, project }))))
    );
  }

  public read(date: string | Moment, unit: Unit = 'day'): Observable<Time[]> {
    // define timestamp range
    let start = moment(date).startOf('day');
    let end = moment(date).endOf('day');

    if (unit === 'month') {
      start = start.startOf('month');
      end = end.endOf('month');
    } else if (unit === 'week') {
      start = start.startOf('week');
      end = end.endOf('week');
    }

    return this.readBetween(start, end);
  }

  readBetween(start: Moment, end: Moment): Observable<Time[]> {
    return this.readData().pipe(
      mergeMap(data =>
        this.firestore
          .collection<TimeModel>(`users/${data.user.uid}/projects/${data.project}/times`, ref =>
            ref.where('timestamp', '>=', start.valueOf()).where('timestamp', '<=', end.valueOf()).orderBy('timestamp')
          )
          .snapshotChanges()
      ),
      map(docs =>
        docs.map(
          doc =>
            ({
              id: doc.payload.doc.id,
              time: moment(doc.payload.doc.data().timestamp).format(DATETIME_ISO_FORMAT)
            } as Time)
        )
      )
    );
  }

  public create(projectName: string, time: Time): Observable<Time> {
    const timestamp = {
      timestamp: new TimeAdapter(time).timestamp
    };
    return this.verifyWriteRights$(projectName, new TimeAdapter(time).getMonth()).pipe(
      mergeMap(_ =>
        this.userService.user$.pipe(
          mergeMap(user => this.firestore.collection<TimeModel>(`users/${user.uid}/projects/${projectName}/times`).add(timestamp)),
          take(1),
          map(
            doc =>
              ({
                id: doc.id,
                ...time
              } as Time)
          )
        )
      )
    );
  }

  public update(projectName: string, time: Time): Observable<Time> {
    const timestamp = {
      timestamp: new TimeAdapter(time).timestamp
    } as TimeModel;

    return this.verifyWriteRights$(projectName, new TimeAdapter(time).getMonth()).pipe(
      mergeMap(_ =>
        this.userService.user$.pipe(
          mergeMap(user =>
            this.firestore.collection<TimeModel>(`users/${user.uid}/projects/${projectName}/times`).doc(time.id).update(timestamp)
          ),
          take(1),
          map(() => time)
        )
      )
    );
  }

  public delete(projectName: string, time: Time): Observable<void> {
    return this.verifyWriteRights$(projectName, new TimeAdapter(time).getMonth()).pipe(
      mergeMap(_ =>
        this.userService.user$.pipe(
          mergeMap(user => this.firestore.collection<TimeModel>(`users/${user.uid}/projects/${projectName}/times`).doc(time.id).delete()),
          take(1)
        )
      )
    );
  }

  public verifyWriteRights$(project: string, month: string) {
    return this.userService.user$.pipe(
      mergeMap(user => this.firestore.doc<Bill>(`users/${user.uid}/projects/${project}/bills/${month}`).valueChanges()),
      take(1),
      map(bill => {
        if (bill && bill.archived) {
          throw new BusinessError(this.translateService.instant('error.bill-emitted'));
        }
        return true;
      })
    );
  }
}
