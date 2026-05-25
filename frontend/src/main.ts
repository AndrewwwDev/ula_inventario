import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

console.log('1. Arrancando main.ts');

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => {
    console.error(err);
    document.body.innerHTML += `<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:red;color:white;z-index:99999;padding:20px;overflow:auto;font-family:monospace;">
      <h2>Error fatal durante la carga de Angular:</h2>
      <pre>${err.stack || err.message || err}</pre>
    </div>`;
  });
