import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any) {
    console.error('GlobalErrorHandler caught:', error);
    document.body.innerHTML += `<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:darkred;color:white;z-index:99999;padding:20px;overflow:auto;font-family:monospace;">
      <h2>Error fatal en tiempo de ejecución de Angular:</h2>
      <pre>${error.stack || error.message || error}</pre>
    </div>`;
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
