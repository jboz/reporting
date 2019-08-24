import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';
import { Observable } from 'rxjs';
import { mergeMap, take, map } from 'rxjs/operators';
import { User, DEFAULT_USER } from './user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private fireauth: AngularFireAuth, private firestore: AngularFirestore) {}

  get user$(): Observable<User> {
    return this.fireauth.user.pipe(
      mergeMap(user => this.firestore.doc<User>(`users/${user.uid}`).valueChanges()),
      take(1),
      map(user => ({ ...DEFAULT_USER, ...user }))
    );
  }

  async googleSignin() {
    return new Promise<any>((resolve, reject) => {
      const provider = new auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      this.fireauth.auth
        .signInWithPopup(provider)
        .then(credential => this.updateUserData(credential.user))
        .then(res => {
          resolve(res);
        });
    });
    // const provider = new auth.GoogleAuthProvider();
    // return this.fireauth.auth.signInWithPopup(provider).then(credential => this.updateUserData(credential.user));
  }

  createNewUser(email: string, password: string) {
    return this.fireauth.auth.createUserWithEmailAndPassword(email, password).then(credential => this.updateUserData(credential.user));
  }

  signInUser(email: string, password: string) {
    return this.fireauth.auth.signInWithEmailAndPassword(email, password).then(credential => this.updateUserData(credential.user));
  }

  signOutUser() {
    return this.fireauth.auth.signOut();
  }

  public updateUserData(user: firebase.User) {
    // Sets user data to firestore on login
    const data = {
      uid: user.uid,
      email: user.email,
      phoneNumber: user.phoneNumber,
      displayName: user.displayName,
      photoURL: user.photoURL
    } as User;

    return this.firestore.doc(`users/${user.uid}`).set(data, { merge: true });
  }
}
