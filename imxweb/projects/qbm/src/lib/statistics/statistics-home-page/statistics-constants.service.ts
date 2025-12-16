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

import { ElementRef, Injectable, OnDestroy } from '@angular/core';
import { EuiThemeService } from '@elemental-ui/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ColorValues } from '../heatmaps/block-properties.interface';

export interface ColorThresholds {
  LightWarn?: number;
  Warn?: number;
  SevereWarn?: number;
  Error?: number;
}

@Injectable({
  providedIn: 'root',
})
export class StatisticsConstantsService implements OnDestroy {
  public colorValues: ColorValues;

  // Translated text
  public noDataText: string;
  public otherDataText: string;
  public defaultDataText: string;
  public nStatsText: string;
  public decreasedText: string;
  public increasedText: string;
  public errorStatusText: string;
  public severeWarningStatusText: string;
  public warningStatusText: string;
  public lightWarningStatusText: string;
  public okStatusText: string;
  public valueText: string;
  public allStatsSearchText: string;
  public myFavoritesSearchText: string;
  public resetZoomText: string;

  public pointStatusText: {
    Stable: string;
    Rising: string;
    Falling: string;
  };

  private themeSub$: Subscription;

  constructor(
    private translate: TranslateService,
    private themeService: EuiThemeService,
  ) {
    this.getAndStoreTranslatedText();
  }

  public ngOnDestroy(): void {
    this.themeSub$.unsubscribe();
  }

  public getAndStoreColor(element: ElementRef): void {
    // Check for theme subscription, if not then subscribe and change css values each time
    this.themeSub$ = this.themeService.getThemeSwitcherState().subscribe(() => {
      this.colorValues = {
        Primary: getComputedStyle(element.nativeElement).getPropertyValue('--stat-primary'),
        Ok: getComputedStyle(element.nativeElement).getPropertyValue('--stat-ok'),
        LightWarn: getComputedStyle(element.nativeElement).getPropertyValue('--stat-light-warn'),
        Warn: getComputedStyle(element.nativeElement).getPropertyValue('--stat-warn'),
        SevereWarn: getComputedStyle(element.nativeElement).getPropertyValue('--stat-severe-warn'),
        Error: getComputedStyle(element.nativeElement).getPropertyValue('--stat-error'),
        Light: getComputedStyle(element.nativeElement).getPropertyValue('--stat-light'),
        Dark: getComputedStyle(element.nativeElement).getPropertyValue('--stat-dark'),
      };
    });
  }

  public getAndStoreTranslatedText() {
    // Here we store all translated text that will be used within the stats portal. We can translate ahead of time and avoid asyncs later.
    this.noDataText = this.translate.instant('#LDS#No data');
    this.otherDataText = this.translate.instant('#LDS#Other');
    this.defaultDataText = this.translate.instant('#LDS#Value');
    this.nStatsText = this.translate.instant('#LDS#{0} statistics');
    this.decreasedText = this.translate.instant('#LDS#decreased');
    this.increasedText = this.translate.instant('#LDS#increased');
    this.errorStatusText = this.translate.instant('#LDS#Error');
    this.severeWarningStatusText = this.translate.instant('#LDS#Severe warning');
    this.warningStatusText = this.translate.instant('#LDS#Warning');
    this.lightWarningStatusText = this.translate.instant('#LDS#Light warning');
    this.okStatusText = this.translate.instant('#LDS#OK');
    this.allStatsSearchText = this.translate.instant('#LDS#Search all statistics');
    this.myFavoritesSearchText = this.translate.instant('#LDS#Search your favorite statistics');
    this.resetZoomText = this.translate.instant('#LDS#Reset view');

    this.pointStatusText = {
      Stable: this.translate.instant('#LDS#Stable'),
      Rising: this.translate.instant('#LDS#Increasing'),
      Falling: this.translate.instant('#LDS#Decreasing'),
    };
  }

  public getColorsForValues(values: number[], thresholds: ColorThresholds): string[] {
    return values.map((value) => this.getColorForValue(value, thresholds));
  }

  public getColorForValue(value: number, thresholds: ColorThresholds): string {
    if (thresholds.LightWarn && thresholds.SevereWarn) {
      // We have a 5-level color map
      switch (true) {
        case thresholds.LightWarn && value < thresholds.LightWarn:
          return this.colorValues.Ok;
        case thresholds.Warn && value < thresholds.Warn:
          return this.colorValues.LightWarn;
        case thresholds.SevereWarn && value < thresholds.SevereWarn:
          return this.colorValues.Warn;
        case thresholds.Error && value < thresholds.Error:
          return this.colorValues.SevereWarn;
        default:
          return this.colorValues.Error;
      }
    }
    if (thresholds.Warn && thresholds.Warn > 0) {
      // We are using only a 3-color map
      switch (true) {
        case thresholds.Warn && value < thresholds.Warn:
          return this.colorValues.Ok;
        case thresholds.Error && value < thresholds.Error:
          return this.colorValues.Warn;
        default:
          return this.colorValues.Error;
      }
    }
    if (thresholds.Error && thresholds.Error > 0) {
      // We are using only a 2-color
      switch (true) {
        case thresholds.Error && value < thresholds.Error:
          return this.colorValues.Ok;
        default:
          return this.colorValues.Error;
      }
    }
    // If all above fails, then we will stick to using the default primary color of the portal
    return this.colorValues.Primary;
  }
}
