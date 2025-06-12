import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class NavbarService {
  private titleSubject = new BehaviorSubject<string>('Noodle');
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  setTitle(title: string): void {
    this.titleSubject.next(title);
  }

  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  getTitle(): Observable<string> {
    return this.titleSubject.asObservable();
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }
}
