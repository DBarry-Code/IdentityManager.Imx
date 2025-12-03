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

import { Component, ElementRef, EventEmitter, Input, OnInit, Output, afterEveryRender } from '@angular/core';
import { ChartDisplayType, ChartDto } from '@imx-modules/imx-api-qbm';
import { GaugeType } from '@imx-modules/imx-qbm-dbts';
import { Chart, ChartOptions, bar, donut, gauge, line } from 'billboard.js';
import { ClassloggerService } from '../../../classlogger/classlogger.service';
import { ChartInfoTyped } from '../../statistics-home-page/chart-info-typed';
import { StatisticsConstantsService } from '../../statistics-home-page/statistics-constants.service';
import { StatisticsChartHandlerService } from '../statistics-chart-handler.service';
import { ChartDetails } from './chart-details';
import { PointStatTyped } from './point-stat-visual/point-stat-typed';
import { PointStatVisualService } from './point-stat-visual/point-stat-visual.service';

@Component({
    selector: 'imx-s-chart-tile',
    templateUrl: './s-chart-tile.component.html',
    styleUrls: ['./s-chart-tile.component.scss'],
    standalone: false
})
export class SChartTileComponent implements OnInit {
  @Input() public chartInfo: ChartInfoTyped;
  @Input() public summaryStat: ChartDto;

  /**
   * Optional input to specify bypass autoplotting and specify the chart type
   */
  @Input() public chartType?: GaugeType;

  @Output() chart = new EventEmitter<Chart>();
  @Output() chartDetails = new EventEmitter<ChartDetails>();

  // Used to determine the type of chart to plot
  public type: 'table' | 'point' | 'pie' | 'bar' | 'line' | 'gauge' | 'no-data';
  public currentChart: Chart;
  public chartOptions: ChartOptions;
  public dataHasNonZero: boolean;
  public pointStatStatus: PointStatTyped;
  public hasUniqueObjectDisplay: boolean;
  public smallCutoff = 10;

  constructor(
    private chartHandler: StatisticsChartHandlerService,
    private pointStatService: PointStatVisualService,
    private constantsService: StatisticsConstantsService,
    private hostElement: ElementRef,
    private logger: ClassloggerService,
  ) {
    afterEveryRender(() => {
      if (this.currentChart) {
        this.currentChart.resize({ height: 150, width: 200 });
      }
    });
  }

  public ngOnInit(): void {
    // Check if we have already initialized color values from css
    if (!this.constantsService.colorValues) {
      this.constantsService.getAndStoreColor(this.hostElement);
    }

    this.determinePlot();
    this.createChartOptions();

    this.chartDetails.emit({
      type: this.chartOptions?.data?.type,
      pointStatus: this.pointStatStatus,
      hasUniqueObjectDisplay: this.hasUniqueObjectDisplay,
      dataHasNonZero: this.dataHasNonZero,
      icon: this.determineIcon(),
    });
  }

  public cacheChart(chart: Chart): void {
    this.currentChart = chart;
    this.chart.emit(chart);
  }

  /**
   * Checks to see if the array has less then a cutoff value
   * @param len length of the array
   * @returns
   */
  public isSmallButNot1(len: number | undefined): boolean {
    if (!len) {
      return false;
    }
    return len > 1 && len < this.smallCutoff;
  }

  public determinePlot(): void {
    if (!this.summaryStat.Data) {
      // No data,
      this.type = 'no-data';
      return;
    }
    // Check if we have interesting data
    this.dataHasNonZero = this.chartHandler.dataHasNonZero(this.summaryStat);

    // Handle the manual input type and don't continue to auto
    if (this.chartType) {
      switch (this.chartType) {
        case GaugeType.Table:
          this.type = 'table';
          break;
        case GaugeType.TrafficLight:
          this.type = 'point';
          break;
        case GaugeType.ChartBar:
          this.type = 'bar';
          break;
        case GaugeType.ChartPie:
          this.type = 'pie';
          break;
        case GaugeType.ChartLine:
          this.type = 'line';
          break;
        case GaugeType.VOneNeedle:
          this.type = 'gauge';
          break;
        default:
          this.logger.warn(this, 'Invalid chart type specified, falling back to auto determine');
          break;
      }
      if (this.type) return;
    }

    // Table: ChartDisplayType.Table
    if (this.chartInfo?.DisplayType?.value == ChartDisplayType.Table) {
      this.type = 'table';
      return;
    }

    // The following is the auto determine logic
    // ChartDisplayType.Auto

    // Point stat: History > 0, Data = 1 OR History > 0, Data = 1, Points = !small but not 1
    if (this.summaryStat.Data?.length === 1 && !this.isSmallButNot1(this.summaryStat.Data[0]?.Points?.length)) {
      this.type = 'point';
      return;
    }

    // Bar chart: History = 0, Data > 1
    if (this.summaryStat.HistoryLength === 0 && this.summaryStat?.Data?.length > 1) {
      this.type = 'bar';
      return;
    }
    // Pie chart: History > 0, Data > 1
    if (this.summaryStat.HistoryLength > 0 && this.summaryStat.Data.length > 1) {
      this.type = 'pie';
      return;
    }
    // Line chart: History > 0, Data = 1, Points ~ small but not 1
    if (
      this.summaryStat.HistoryLength > 0 &&
      this.summaryStat.Data.length === 1 &&
      this.isSmallButNot1(this.summaryStat?.Data[0]?.Points?.length)
    ) {
      this.type = 'line';
      return;
    }
    // If we make it here, then the data does not fit any of the above criteria
    this.type = 'no-data';
  }

  private createChartOptions(): void {
    switch (this.type) {
      case 'point':
        this.pointStatStatus = this.pointStatService.extractStatus(this.summaryStat);
        break;
      case 'pie':
        this.chartOptions = this.chartHandler.getPieData(this.summaryStat, {
          dataLimit: 5,
        });
        break;
      case 'bar':
        this.hasUniqueObjectDisplay = this.chartHandler.hasUniqueObjectDisplay(this.summaryStat.Data!);
        this.chartOptions = this.chartHandler.getBarData(this.summaryStat, {
          dataLimit: 5,
          hasUniqueObjectDisplay: this.hasUniqueObjectDisplay,
        });
        break;
      case 'line':
        this.chartOptions = this.chartHandler.getLineData(this.summaryStat, {
          dataLimit: 5,
          pointLimit: 10,
        });
        break;
      case 'gauge':
        this.chartOptions = this.chartHandler.getGaugeData(this.summaryStat);
        break;
      default:
        break;
    }

    // If we have no data on a pie chart, then we can't show anything
    if (!this.dataHasNonZero && this.type === 'pie') this.type = 'no-data';
  }

  /**
   * Decides which cadence icon to use from the chart type / data
   * @returns
   */
  public determineIcon(): string | undefined {
    switch (true) {
      case this.chartType === GaugeType.Table || this.chartInfo?.DisplayType?.value == ChartDisplayType.Table:
        return 'table';
      case this.type === 'point':
        return 'arrowsvertical';
      case this.chartOptions?.data?.type === donut():
        return 'piechart';
      case this.chartOptions?.data?.type === bar():
        return 'barchart';
      case this.chartOptions?.data?.type === line():
        return 'linechart';
      case this.chartOptions?.data?.type === gauge():
        return 'performance';
      default:
        return;
    }
  }
}
