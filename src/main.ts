import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { app } from './app/app';
// import { registerLicense} from  '@syncfusion/ej2-base ';

// registerLicense(`Your License Key`);

bootstrapApplication(app, appConfig)
  .catch((err) => console.error(err));
