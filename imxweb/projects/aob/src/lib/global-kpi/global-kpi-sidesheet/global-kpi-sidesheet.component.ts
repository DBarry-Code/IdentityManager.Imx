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

import { Component, ElementRef, inject, OnInit, viewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { EUI_SIDESHEET_DATA, EuiCoreModule } from '@elemental-ui/core';
import { ChartDto } from '@imx-modules/imx-api-aob';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { area, Chart, ChartOptions, line, pie, zoom } from 'billboard.js';
import { unzip } from 'lodash';
import { isAllIntegers, ShortDatePipe } from 'qbm';

@Component({
    imports: [EuiCoreModule, MatCardModule, TranslateModule],
    templateUrl: './global-kpi-sidesheet.component.html',
    styleUrl: './global-kpi-sidesheet.component.scss'
})
export class GlobalKpiSidesheetComponent implements OnInit {
  // Injected services
  public data: { chart: ChartDto } = inject(EUI_SIDESHEET_DATA);
  private translationService = inject(TranslateService);
  private shortDate = inject(ShortDatePipe);

  // Signals
  private lineChartContent = viewChild.required<ElementRef<HTMLElement>>('lineChartContent');
  private pieChartContent = viewChild.required<ElementRef<HTMLElement>>('pieChartContent');

  // Variables
  public hasPieChart: boolean | undefined;
  public pieChartOptions: ChartOptions;
  public lineChartOptions: ChartOptions;

  ngOnInit(): void {
    this.buildOptions();
  }

  /**
   * Check for which options to build for the charts
   */
  private buildOptions() {
    // Currently don't have a better option then to look for percent in name for pie chart
    // TODO: Can we define this better?
    this.hasPieChart = this.data.chart.Name?.toLowerCase().includes('percent');
    if (this.hasPieChart) this.buildPieChartOptions(this.data.chart);
    this.buildLineChartOptions(this.data.chart);
  }

  /**
   * Builds the pie chart options
   * @param chart
   */
  private buildPieChartOptions(chart: ChartDto) {
    const columns = chart.Data?.map((data, index) => [data.Name ?? 'data' + index.toString(), data.Points?.[0]?.Value!])!;
    this.computeOtherColumn(columns);
    this.pieChartOptions = {
      data: {
        type: pie(),
        columns: columns,
      },
      pie: {
        padAngle: 0.01,
        label: {
          format: (d) =>
            `${d.toLocaleString(this.translationService.currentLang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
          threshold: 0.06,
        },
      },
      resize: {
        auto: 'viewBox',
      },
    };
  }

  /**
   * Computes the 100 - column sums to represent an 'other' data stream
   * @param columns
   * @returns
   */
  private computeOtherColumn(columns: (string | number)[][]) {
    // Dont do this for non-pie chart kpis
    if (!this.hasPieChart) return;
    // Remove columnNames
    const filteredColumns = columns.map((row) => row.filter((val) => typeof val === 'number'));
    // Transpose
    const transposed = unzip(filteredColumns);
    const aggregates = transposed.map((row) => 100 - row.reduce((partialSum, currentVal) => partialSum + currentVal, 0));
    // Determine if we are showing nearly all of the data, if so ignore this column and do not append it
    if (aggregates.some((val) => val >= 0.1)) {
      columns.push([this.translationService.instant('#LDS#Other'), ...aggregates]);
    }
  }

  /**
   * Build the history line chart options
   * @param chart
   */
  private buildLineChartOptions(chart: ChartDto) {
    // Build data
    const data = chart.Data?.map((data) => {
      const name = data.Name ?? '';
      return [name, ...data.Points?.map<number>((point) => point.Value)!];
    })!;
    this.computeOtherColumn(data);

    // Add time axis
    const columns = [
      // Time axis
      ['x', ...chart.Data?.[0].Points?.map<Date>((point) => point.Date)!],
      // Data
      ...data,
    ];

    // Build options
    this.lineChartOptions = {
      axis: {
        x: {
          type: 'timeseries',
          tick: {
            count: 10,
            format: (x: Date) => this.shortDate.transform(x.toString()),
          },
        },
        y: {
          tick: {
            // Show only integer values if all the columns have integer values
            culling: isAllIntegers(columns) ? true : { max: 5 },
          },
        },
      },
      zoom: {
        enabled: zoom(),
        type: 'drag',
      },
      resize: {
        auto: 'viewBox',
      },
      legend: {
        show: (chart.Data?.length || 0) > 1,
      },
      interaction: {
        inputType: {
          mouse: true,
          touch: false,
        },
      },
      data: {
        x: 'x',
        type: this.hasPieChart ? area() : line(),
        columns,
      },
    };
  }

  /**
   * Resize the plot based on existing elements, use isPieChart to determine which we use
   * @param chart
   * @param isPieChart
   */
  public onChartCreated(chart: Chart, isPieChart?: boolean) {
    let size = {
      height: this.lineChartContent().nativeElement.offsetHeight,
      width: this.lineChartContent().nativeElement.offsetWidth,
    };
    if (isPieChart) {
      (size.height = this.pieChartContent().nativeElement.offsetHeight), (size.width = this.pieChartContent().nativeElement.offsetWidth);
    }
    chart.resize(size);
  }
}
