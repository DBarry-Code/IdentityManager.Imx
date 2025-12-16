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

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EuiCoreModule, EuiSidesheetService } from '@elemental-ui/core';
import { ChartDto } from '@imx-modules/imx-api-aob';
import { TranslateModule } from '@ngx-translate/core';
import { BusyIndicatorModule, calculateSidesheetWidth, HELP_CONTEXTUAL, HelpContextualModule } from 'qbm';
import { GlobalKpiSidesheetComponent } from '../global-kpi-sidesheet/global-kpi-sidesheet.component';
import { GlobalKpiService } from '../global-kpi.service';

@Component({
  selector: 'imx-global-kpi-home',
  imports: [EuiCoreModule, MatCardModule, MatTooltipModule, HelpContextualModule, TranslateModule, BusyIndicatorModule],
  templateUrl: './global-kpi-home.component.html',
  styleUrl: './global-kpi-home.component.scss',
})
export class GlobalKpiHomeComponent implements OnInit {
  // Injected services
  private kpiService = inject(GlobalKpiService);
  private sidesheetService = inject(EuiSidesheetService);

  // Signals
  public isLoading = signal(true);
  public allKpis = signal<ChartDto[]>([]);
  public isNoData = computed(() => this.allKpis().length === 0);

  // Variables
  public contextId = HELP_CONTEXTUAL.GlobalKPI;

  ngOnInit(): void {
    this.initializeData();
  }

  private async initializeData(): Promise<void> {
    if (!this.isLoading()) this.isLoading.set(true);
    this.allKpis.set(await this.kpiService.get());
    this.isLoading.set(false);
  }

  /**
   * Check if we have data to display
   * @param kpi
   * @returns
   */
  public isCalculated(kpi: ChartDto): boolean {
    return (kpi.Data?.[0]?.Points?.length || 0) > 0;
  }

  /**
   * Check if we have a value to display
   * @param kpi
   * @returns
   */
  public hasCurrentValue(kpi: ChartDto): number | undefined {
    return kpi.Data?.[0]?.Points?.[0].Value;
  }

  /**
   * Format the current value to 2 decimals
   * @param kpi
   * @returns
   */
  public formatCurrentValue(kpi: ChartDto): string | number {
    const value = this.hasCurrentValue(kpi)!;
    return Number.isInteger(value) ? value : value.toFixed(2);
  }

  /**
   * Opens a sidesheet to display the kpi
   * @param chart
   */
  public async showDetails(chart: ChartDto): Promise<void> {
    this.sidesheetService.open(GlobalKpiSidesheetComponent, {
      title: chart.Display!,
      subTitle: chart.Description,
      icon: 'areachart',
      padding: '0',
      width: calculateSidesheetWidth(),
      data: {
        chart,
      },
    });
  }
}
