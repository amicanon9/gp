import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastrModule } from "ngx-toastr";
import { SidebarModule } from './sidebar/sidebar.module';
import { FooterModule } from './shared/footer/footer.module';
import { NavbarModule} from './shared/navbar/navbar.module';
import { FixedPluginModule} from './shared/fixedplugin/fixedplugin.module';
import { JwtInterceptor, JwtModule, JWT_OPTIONS, JwtConfig } from '@auth0/angular-jwt';
import { ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { LoginComponent } from "./login/login/login.component";
import { AppRoutes } from './app.routing';

import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

import { CommonModule, LocationStrategy, PathLocationStrategy } from "@angular/common";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { environment } from "environments/environment";
import { ErrorInterceptor } from "./error.interceptor";

export function tokenGetter(): string | null {
  return localStorage.getItem('access_token');
}

function getJwtConfig(): JwtConfig {
  const cfg: JwtConfig = {
    tokenGetter
  };
  if (!environment.production) {
    cfg.allowedDomains = [...environment.jwt.allowedDomains];
    cfg.disallowedRoutes = [...environment.jwt.disallowedRoutes];
  }
  return cfg;
}
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AdminLayoutComponent,
  ],
  imports: [
    BrowserAnimationsModule,
    RouterModule.forRoot(AppRoutes,{
      useHash: true
    }),
    SidebarModule,
    NavbarModule,
    ToastrModule.forRoot(),
    FooterModule,
    FixedPluginModule,
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    JwtModule.forRoot({
      config: getJwtConfig(),
    }),
  ],
  providers: [
    JwtInterceptor,
    {
      provide: HTTP_INTERCEPTORS,
      useExisting: JwtInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
