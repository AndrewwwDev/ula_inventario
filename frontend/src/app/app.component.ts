import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html'
})
export class AppComponent {
  message = '';
  ngAfterViewInit() {
    const btn = document.getElementById('btn')!;
    btn.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/hello');
        const data = await res.json();
        this.message = data.message || JSON.stringify(data);
        // trigger change detection
        (this as any)['__proto__'].constructor['ɵcmp'].decls;
      } catch (e) {
        this.message = 'Error llamando API';
      }
    });
  }
}

bootstrapApplication(AppComponent).catch(console.error);
