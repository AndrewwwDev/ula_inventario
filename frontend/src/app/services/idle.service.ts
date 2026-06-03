import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, merge, Observable, Subject, Subscription, timer } from 'rxjs';
import { throttleTime, switchMap, takeUntil, map, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class IdleService {
  private readonly MAX_IDLE_TIME = 270000; // 4 minutes 30 seconds in ms
  private readonly WARNING_TIME = 30000; // 30 seconds in ms

  private userActivitySubscription?: Subscription;
  private countdownSubscription?: Subscription;

  private showWarningSubject = new Subject<boolean>();
  public showWarning$ = this.showWarningSubject.asObservable();

  private countdownSubject = new Subject<number>();
  public countdown$ = this.countdownSubject.asObservable();

  private stopTimers$ = new Subject<void>();

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private ngZone: NgZone
  ) {}

  public startMonitoring() {
    this.stopMonitoring(); // Clear any existing

    // Listen to these events to detect user activity
    const activityEvents$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'click'),
      fromEvent(document, 'scroll')
    ).pipe(
      // Prevent handling too many events
      throttleTime(1000)
    );

    // Run outside Angular to prevent triggering change detection on every mouse move
    this.ngZone.runOutsideAngular(() => {
      this.userActivitySubscription = activityEvents$
        .pipe(
          takeUntil(this.stopTimers$),
          // Every time there is an activity, restart the 4.5m timer
          switchMap(() => timer(this.MAX_IDLE_TIME))
        )
        .subscribe(() => {
          // Idle time reached. Enter warning phase.
          this.ngZone.run(() => this.triggerWarningPhase());
        });
    });

    // Manually trigger the first cycle without waiting for a mouse move
    this.ngZone.runOutsideAngular(() => {
      timer(this.MAX_IDLE_TIME).pipe(
        takeUntil(activityEvents$),
        takeUntil(this.stopTimers$)
      ).subscribe(() => {
        this.ngZone.run(() => this.triggerWarningPhase());
      });
    });
  }

  private triggerWarningPhase() {
    this.showWarningSubject.next(true);

    let timeLeft = this.WARNING_TIME / 1000;
    this.countdownSubject.next(timeLeft);

    this.countdownSubscription = timer(1000, 1000)
      .pipe(
        takeUntil(this.stopTimers$)
      )
      .subscribe(() => {
        timeLeft--;
        this.countdownSubject.next(timeLeft);

        if (timeLeft <= 0) {
          this.forceLogout();
        }
      });
  }

  public resetTimer() {
    this.showWarningSubject.next(false);
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
    // Monitoring restarts automatically via the switchMap on activity
  }

  public stopMonitoring() {
    this.stopTimers$.next();
    if (this.userActivitySubscription) {
      this.userActivitySubscription.unsubscribe();
    }
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
    this.showWarningSubject.next(false);
  }

  private async forceLogout() {
    this.stopMonitoring();
    console.log('[IdleService] Inactividad superada. Delegando salida a AuthService...');
    
    // El AuthService se encargará de hacer el signOut.
    // Al detectarse el evento SIGNED_OUT, todas las pestañas se limpiarán reactivamente.
    try {
      // Necesitamos acceder a authService. Como ya tenemos dependencias inyectadas,
      // usaremos el supabaseService que ya llama internamente a signOut de supabase
      const client = await this.supabaseService.getClient();
      await client.auth.signOut();
    } catch (error) {
      console.warn('[IdleService] Fallo durante el signOut:', error);
      // Fallback estricto en caso de que Supabase esté colgado
      localStorage.clear();
      sessionStorage.clear();
      this.router.navigate(['/login']).catch(() => {
        window.location.href = '/login';
      });
    }
  }
}
