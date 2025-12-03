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

import { Injectable } from '@angular/core';
import { ChartDto } from '@imx-modules/imx-api-qbm';
import { ChartInfoTyped, StatisticsForObjectsService } from 'qbm';
import { QerApiService } from 'qer';

@Injectable({
  providedIn: 'root',
})
export class PortalStatisticsForObjectsService extends StatisticsForObjectsService {
  constructor(private apiClient: QerApiService) {
    super();
  }

  /**
   * Get available charts for this object
   * @param type name of the object type (Person, AccProduct, AttestationPolicy, Department etc.)
   * @param objectUid object Id
   * @returns list of chart summaries that are related to this object
   */
  public async getChartInfos(type: string, objectUid: string): Promise<ChartInfoTyped[]> {
    return (await this.apiClient.v2Client.portal_statistics_charts_forobject_get(type, objectUid))
      .filter((chart) => !!chart?.Id)
      .map((chart) => ChartInfoTyped.toTypedEntity(chart));
  }

  /**
   * Get the summary chart for the statistic associated to the object
   * @param type name of the object type (Person, AccProduct, AttestationPolicy, Department etc.)
   * @param objectUid object Id
   * @param statId chart id
   * @returns detailed chart
   */
  public async getChart(type: string, objectUid: string, statId: string): Promise<ChartDto> {
    return this.apiClient.v2Client.portal_statistics_charts_forobject_byid_get(type, objectUid, statId);
  }
}
