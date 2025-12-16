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

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { EuiSidesheetService } from '@elemental-ui/core';
import { ChartDto } from '@imx-modules/imx-api-qbm';
import { TypedEntityCollectionData } from '@imx-modules/imx-qbm-dbts';
import { ChartOptions, bar, donut, line } from 'billboard.js';
import { Subscription } from 'rxjs';
import { calculateSidesheetWidth } from '../../base/sidesheet-helper';
import { ChartDataTyped } from '../charts/chart-data-typed';
import { ChartTableService } from '../charts/chart-table/chart-table-service.service';
import { ChartsSidesheetComponent } from '../charts/charts-sidesheet/charts-sidesheet.component';
import { ChartDetails } from '../charts/s-chart-tile/chart-details';
import { StatisticsChartHandlerService } from '../charts/statistics-chart-handler.service';
import { ChartInfoTyped } from '../statistics-home-page/chart-info-typed';
import { StatisticsForObjectsService } from './statistics-for-objects.service';
@Component({
    selector: 'imx-statistics-for-objects',
    templateUrl: './statistics-for-objects.component.html',
    styleUrls: ['./statistics-for-objects.component.scss'],
    standalone: false
})
export class StatisticsForObjectsComponent implements OnInit, OnDestroy {
  @Input() objectType: string;
  @Input() objectUid: string;

  public charts: ChartInfoTyped[];
  public summaryStats: {
    [id: string]: ChartDto;
  } = {};
  public chartDetails: {
    [id: string]: ChartDetails;
  } = {};

  private subscriptions$: Subscription[] = [];

  constructor(
    private statisticsApi: StatisticsForObjectsService,
    private tableService: ChartTableService,
    private chartHandler: StatisticsChartHandlerService,
    private sidesheetService: EuiSidesheetService,
  ) {}

  ngOnInit() {
    this.getDataFromApi();
  }

  private async getDataFromApi(): Promise<void> {
    this.charts = await this.statisticsApi.getCharts(this.objectType, this.objectUid);
    if (!this.charts) return;
    this.subscriptions$.push(
      ...this.charts.map((chart) => {
        return this.statisticsApi.summaryStats$[chart.Id.value].subscribe((summaryStat) => {
          if (summaryStat) this.summaryStats[chart.Id.value] = summaryStat;
        });
      }),
    );
  }

  public ngOnDestroy(): void {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }

  public get isLoading(): boolean {
    return !this.charts;
  }

  public get hasData(): boolean {
    return this.charts && this.charts.length > 0;
  }

  public chartHasData(chartInfo: ChartInfoTyped): boolean {
    const stat = this.getSummaryStat(chartInfo);
    return !!stat?.Data?.length;
  }

  public chartIsLoading(chartInfo: ChartInfoTyped): boolean {
    return !this.getSummaryStat(chartInfo);
  }

  public getSummaryStat(chartInfo: ChartInfoTyped): ChartDto | undefined {
    return this.summaryStats[chartInfo.Id.value];
  }

  public async openStatistic(chartInfo: ChartInfoTyped): Promise<void> {
    if (!this.chartHasData(chartInfo)) {
      // Prevent any further click progression
      return;
    }

    this.sidesheetService.open(ChartsSidesheetComponent, {
      title: chartInfo.GetEntity().GetDisplay(),
      subTitle: chartInfo?.Description.value,
      icon: this.chartDetails[chartInfo.Id.value].icon,
      width: calculateSidesheetWidth(800, 0.5),
      data: {
        chartInfo,
        ...this.getChartOptionsWithHistory(chartInfo),
        dataHasNonZero: this.chartDetails[chartInfo.Id.value].dataHasNonZero,
        pointStatStatus: this.chartDetails[chartInfo.Id.value]?.pointStatus,
      },
    });
  }

  public getChartOptionsWithHistory(chartInfo: ChartInfoTyped):
    | {
        chartData: ChartDto;
        tableData: TypedEntityCollectionData<ChartDataTyped>;
        chartOptions: ChartOptions;
      }
    | undefined {
    const chartData = this.getSummaryStat(chartInfo);
    if (chartData?.Data == null) {
      return;
    }
    const tableData = this.tableService.getDataSource(chartData.Data);
    let chartOptions: ChartOptions = {};
    switch (true) {
      case !!this.chartDetails[chartInfo.Id.value]?.pointStatus:
        chartOptions = this.chartHandler.getLineData(chartData, {
          dataLimit: 1,
          nXTicks: 10,
          enableZoom: true,
        });
        break;
      case this.chartDetails[chartInfo.Id.value].type === donut():
        chartOptions = this.chartHandler.getPieData(chartData, {
          dataLimit: 10,
        });
        break;
      case this.chartDetails[chartInfo.Id.value].type === bar():
        chartOptions = this.chartHandler.getBarData(chartData, {
          dataLimit: 10,
          hasUniqueObjectDisplay: this.chartDetails[chartInfo.Id.value].hasUniqueObjectDisplay,
        });
        break;
      case this.chartDetails[chartInfo.Id.value].type === line():
        chartOptions = this.chartHandler.getLineData(chartData, {
          dataLimit: 10,
          pointLimit: 20,
          enableZoom: true,
        });
        break;
    }
    return {
      chartData,
      tableData,
      chartOptions,
    };
  }

  public getDetails(chartInfo: ChartInfoTyped, chartDetails: ChartDetails): void {
    this.chartDetails[chartInfo.Id.value] = chartDetails;
  }
}
