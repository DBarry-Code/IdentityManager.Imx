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
import { Chart, ChartOptions, line, zoom } from 'billboard.js';
import { isAllIntegers, ShortDatePipe } from 'qbm';

@Component({
    imports: [EuiCoreModule, MatCardModule, TranslateModule],
    templateUrl: './application-kpi-sidesheet.component.html',
    styleUrl: './application-kpi-sidesheet.component.scss'
})
export class ApplicationKpiSidesheetComponent implements OnInit {
  // Injected services
  private shortDate = inject(ShortDatePipe);
  private translateService = inject(TranslateService);
  public data: {
    chart: ChartDto;
    isPassing: boolean;
  } = inject(EUI_SIDESHEET_DATA);

  // Signals
  private lineChartContent = viewChild.required<ElementRef<HTMLElement>>('lineChartContent');

  // Variables
  public options: ChartOptions;

  ngOnInit(): void {
    this.buildOptions(this.data.chart);
  }

  /**
   * Callback function to resize chart after sidesheet has opened
   * @param chart
   */
  public onChartCreated(chart: Chart) {
    chart.resize({
      height: this.lineChartContent().nativeElement.offsetHeight,
      width: this.lineChartContent().nativeElement.offsetWidth,
    });
  }

  /**
   * Build chart options for displaying this data
   * @param chart
   */
  private buildOptions(chart: ChartDto) {
    const columns = [
      // Time axis
      ['x', ...chart.Data?.[0].Points?.map<Date>((point) => point.Date)!],
      // Data
      ...chart.Data?.map((data) => {
        const name = data.Name ?? '';
        return [name, ...data.Points?.map<number>((point) => point.Value)!];
      })!,
    ];

    this.options = {
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
      grid: {
        y: {
          lines: [
            {
              value: chart.ErrorThreshold,
              text: this.translateService.instant('#LDS#Error threshold'),
            },
          ],
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
        show: false,
      },
      interaction: {
        inputType: {
          mouse: true,
          touch: false,
        },
      },
      data: {
        x: 'x',
        type: line(),
        columns,
      },
    };
  }
}
