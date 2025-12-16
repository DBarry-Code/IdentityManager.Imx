/*
 * ONE IDENTITY LLC. PROPRIETARY INFORMATION
 *
 * This software is confidential.  One Identity, LLC. or one of its affiliates or
 * subsidiaries, has supplied this software to you under terms of a
 * license agreement, nondisclosure agreement or both.
 *
 * You may not copy, disclose, or use this software except in accordance with
 * those terms.
 *
 *
 * Copyright 2025 One Identity LLC.
 * ALL RIGHTS RESERVED.
 *
 * ONE IDENTITY LLC. MAKES NO REPRESENTATIONS OR
 * WARRANTIES ABOUT THE SUITABILITY OF THE SOFTWARE,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE IMPLIED WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, OR
 * NON-INFRINGEMENT.  ONE IDENTITY LLC. SHALL NOT BE
 * LIABLE FOR ANY DAMAGES SUFFERED BY LICENSEE
 * AS A RESULT OF USING, MODIFYING OR DISTRIBUTING
 * THIS SOFTWARE OR ITS DERIVATIVES.
 *
 */

import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Injector, signal, DOCUMENT } from '@angular/core';


import { V2Client } from '@imx-modules/imx-api-qbm';
import { ApiClient } from '@imx-modules/imx-qbm-dbts';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { ApiClientFetch } from '../api-client/api-client-fetch';
import { ClassloggerService } from '../classlogger/classlogger.service';
import { AppConfig } from './appconfig.interface';

// @dynamic
@Injectable()
export class AppConfigService {
  public get Config(): AppConfig {
    return this.config;
  }
  public get BaseUrl(): string {
    return this.baseUrl;
  }

  public get client(): V2Client {
    return this._v2client;
  }

  private _v2client: V2Client;
  public get v2client(): V2Client {
    return this._v2client;
  }

  private _apiClient: ApiClient;
  public get apiClient(): ApiClient {
    return this._apiClient;
  }

  private config: AppConfig;
  private baseUrl: string;

  public initializedSubject = new Subject<void>();
  public title = signal<string>('');

  constructor(
    private readonly httpClient: HttpClient,
    private readonly logger: ClassloggerService,
    private readonly injector: Injector,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  public async init(apiServerUrl: string): Promise<void> {
    this.config = (await this.httpClient.get('appconfig.json').toPromise()) as AppConfig;
    this.title.set(this.config.Title);
    this.initialize(apiServerUrl);
    await this.client.loadSchema();
  }

  public initSynchronous(apiServerUrl: string, config: AppConfig): void {
    this.config = config;
    this.title.set(this.config.Title);
    const basepathArray = window.location.pathname.split('html');
    this.config.Basepath = basepathArray[0].slice(0, -1);
    this.initialize(apiServerUrl);
  }

  public setTitle(title: string) {
    this.config.Title = title;
    this.title.set(title);
  }

  public async loadSchema(): Promise<void> {
    await this.client.loadSchema();
  }

  private initialize(apiServerUrl: string): void {
    // Logic to determine baseURL
    switch (true) {
      // Provided apiSeverUrl, use this
      case !!apiServerUrl:
        this.baseUrl = apiServerUrl;
        break;
      // We have a provided basepath
      case !!this.config.Basepath:
        // The basepath is a full url, use it
        if (this.config.Basepath.startsWith('http')) {
          this.baseUrl = this.config.Basepath;
          break;
        }
        // The basepath is relative, append it to window origin
        if (this.config.Basepath.startsWith('/')) {
          this.baseUrl = [window.location.origin, this.config.Basepath].join('');
        } else {
          // Perhaps they forgot the /, so we now join with a separator
          this.baseUrl = [window.location.origin, this.config.Basepath].join('/');
        }
        break;
      default:
        // We use the window origin by default
        this.baseUrl = window.location.origin.slice();
        break;
    }
    this.logger.info(this, `BaseUrl set to ${this.baseUrl}`);

    // avoid cyclic dependency
    const translation = this.injector.get(TranslateService);
    this._apiClient = new ApiClientFetch(this.baseUrl, this.logger, translation);
    this._v2client = new V2Client(this._apiClient);
    this.initializedSubject.next();
  }

  /**
   * Load custom css configuration.
   */
  public async loadCustomStyle(): Promise<void> {
    const head = this.document.getElementsByTagName('head')[0];
    const styleComponent = this.document.createElement('link');
    styleComponent.id = 'imx-custom-style';
    styleComponent.rel = 'stylesheet';
    styleComponent.type = 'text/css';
    styleComponent.href = `${this.baseUrl}/imx/customstyles`;
    this.document.getElementById('imx-custom-style')?.remove();
    head.appendChild(styleComponent);
  }
}
