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
import { ChartAreaData, ChartDto, ChartInfoDto, HeatmapDto, HeatmapInfoDto, HeatmapSummaryDto } from '@imx-modules/imx-api-qbm';
import { HelpContextualValues } from '../help-contextual/help-contextual.service';

@Injectable({
  providedIn: 'root',
})
export abstract class StatisticsApiService {
  public isFavoritesEnabled: boolean;
  public isOrgStatsEnabled: boolean;

  /**
   * Set the help URL for the statistics page on the respective portal
   */
  public abstract getHelpContextId(): HelpContextualValues;
  /**
   * Get the list of stat areas
   */
  public abstract getStatAreas(): Promise<ChartAreaData[]>;

  // Chart calls
  /**
   * Get the list of available charts
   */
  public abstract getChartList(): Promise<ChartInfoDto[]>;

  /**
   * Get a specific chart
   * @param id of the chart
   * @param options flag to get chart without history
   */
  public abstract getChart(id: string, options?: { nohistory?: boolean }): Promise<ChartDto>;

  // Heatmap calls
  /**
   * Get the list of available heatmaps
   */
  public abstract getHeatmapList(): Promise<HeatmapInfoDto[]>;

  /**
   * Get the high-level summary of a heatmap
   * @param id of the heatmap
   */
  public abstract getHeatmapSummary(id: string): Promise<HeatmapSummaryDto>;

  /**
   * Get a specific heatmap
   * @param id of the heatmap
   * @param options get heatmap with root element and include zero elements
   */
  public abstract getHeatmap(id: string, options?: { root?: string; includezero?: boolean }): Promise<HeatmapDto>;

  // Favorites calls
  /**
   * Get the list of favorite statistics for a user
   */
  public abstract getFavorites(): Promise<string[]>;

  /**
   * Update the list of favorite statistics for a user
   * @param favorites list of favorite statistics to set
   */
  public abstract postFavorites(favorites: string[]): Promise<void>;

  // Org stats calls
  /**
   * Get the list of organization statistics
   */
  public abstract getOrgStats(): Promise<string[]>;

  /**
   * Update the list of organization statistics
   * @param orgStats list of organization statistics to set
   */
  public abstract postOrgStats(orgStats: string[]): Promise<void>;
}
