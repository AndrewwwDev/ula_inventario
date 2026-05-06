import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { appConfig } from './app.config';
import { SessionService } from './services/session.service';
import { ToastsComponent } from './components/toasts/toasts.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastsComponent],
  template: `
    <app-toasts></app-toasts>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  constructor(private sessionService: SessionService) {}
}

bootstrapApplication(AppComponent, appConfig).catch(console.error);

