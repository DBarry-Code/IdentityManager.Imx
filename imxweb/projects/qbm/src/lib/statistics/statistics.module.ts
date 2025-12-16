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

import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule, Routes } from '@angular/router';
import { EuiCoreModule, EuiMaterialModule } from '@elemental-ui/core';
import { TranslateModule } from '@ngx-translate/core';
import { CdrModule } from '../cdr/cdr.module';
import { ClassloggerService } from '../classlogger/classlogger.service';
import { DataSourceToolbarModule } from '../data-source-toolbar/data-source-toolbar.module';
import { DataTableModule } from '../data-table/data-table.module';
import { DataViewModule } from '../data-view/data-view.module';
import { DateModule } from '../date/date.module';
import { ExtModule } from '../ext/ext.module';
import { StatisticsGuardService } from '../guards/statistics-guard.service';
import { HelpContextualModule } from '../help-contextual/help-contextual.module';
import { InfoModalDialogModule } from '../info-modal-dialog/info-modal-dialog.module';
import { LdsReplaceModule } from '../lds-replace/lds-replace.module';
import { MenuItem } from '../menu/menu-item/menu-item.interface';
import { MenuService } from '../menu/menu.service';
import { RouteGuardService } from '../route-guard/route-guard.service';
import { SidenavTreeComponent } from '../sidenav-tree/sidenav-tree.component';
import { ChartTableComponent } from './charts/chart-table/chart-table.component';
import { ChartsSidesheetComponent } from './charts/charts-sidesheet/charts-sidesheet.component';
import { PointStatVisualComponent } from './charts/s-chart-tile/point-stat-visual/point-stat-visual.component';
import { SChartTileComponent } from './charts/s-chart-tile/s-chart-tile.component';
import { TableStatVisualComponent } from './charts/s-chart-tile/table-stat-visual/table-stat-visual.component';
import { BlockDetailSidesheetComponent } from './heatmaps/block-detail-sidesheet/block-detail-sidesheet.component';
import { DiscreteLegendComponent } from './heatmaps/discrete-legend/discrete-legend.component';
import { HeatmapChartComponent } from './heatmaps/heatmap-chart/heatmap-chart.component';
import { HeatmapSidesheetComponent } from './heatmaps/heatmap-sidesheet/heatmap-sidesheet.component';
import { HeatmapTileComponent } from './heatmaps/heatmap-tile/heatmap-tile.component';
import { TreemapChartComponent } from './heatmaps/treemap-chart/treemap-chart.component';
import { StatisticsForObjectsComponent } from './statistics-for-objects/statistics-for-objects.component';
import { FavoritesTabComponent } from './statistics-home-page/favorites-tab/favorites-tab.component';
import { HeatmapVisualComponent } from './statistics-home-page/statistics-cards-visuals/heatmap-visual/heatmap-visual.component';
import { StatisticsCardsVisualsComponent } from './statistics-home-page/statistics-cards-visuals/statistics-cards-visuals.component';
import { StatisticsCardsComponent } from './statistics-home-page/statistics-cards/statistics-cards.component';
import { StatisticsHomePageComponent } from './statistics-home-page/statistics-home-page.component';
import { StatisticsOrderingSidesheetComponent } from './statistics-home-page/statistics-ordering-sidesheet/statistics-ordering-sidesheet.component';
import { StatisticsTreeComponent } from './statistics-home-page/statistics-tree/statistics-tree.component';
const routes: Routes = [
  {
    path: 'statistics',
    component: StatisticsHomePageComponent,
    canActivate: [StatisticsGuardService],
    resolve: [RouteGuardService],
  },
];

@NgModule({
  declarations: [
    HeatmapSidesheetComponent,
    TreemapChartComponent,
    HeatmapChartComponent,
    BlockDetailSidesheetComponent,
    DiscreteLegendComponent,
    StatisticsHomePageComponent,
    StatisticsTreeComponent,
    StatisticsCardsComponent,
    StatisticsCardsVisualsComponent,
    HeatmapVisualComponent,
    PointStatVisualComponent,
    FavoritesTabComponent,
    StatisticsOrderingSidesheetComponent,
    ChartsSidesheetComponent,
    ChartTableComponent,
    StatisticsForObjectsComponent,
    SChartTileComponent,
    HeatmapTileComponent,
    TableStatVisualComponent,
  ],
  imports: [
    CommonModule,
    CdrModule,
    EuiCoreModule,
    EuiMaterialModule,
    TranslateModule,
    DataSourceToolbarModule,
    DataTableModule,
    DataViewModule,
    InfoModalDialogModule,
    MatExpansionModule,
    SidenavTreeComponent,
    DragDropModule,
    ScrollingModule,
    LdsReplaceModule,
    DateModule,
    FormsModule,
    MatCheckboxModule,
    RouterModule.forChild(routes),
    HelpContextualModule,
    ExtModule,
  ],
  exports: [StatisticsForObjectsComponent, SChartTileComponent],
})
export class StatisticsModule {
  constructor(
    private readonly menuService: MenuService,
    private readonly logger: ClassloggerService,
    private guard: StatisticsGuardService,
  ) {
    this.logger.info(this, '▶️ Statistics Module loaded');
    this.setupMenu();
  }

  /** This method defines the menu structure for the portal. */
  private setupMenu(): void {
    this.menuService.addMenuFactories((preProps: string[], features: string[]) => {
      if (this.guard.isStatistics(features)) {
        const menu: MenuItem = {
          id: 'ROOT_Statistics',
          title: '#LDS#Statistics',
          sorting: '50',
          route: routes[0].path,
        };
        return menu;
      }

      return;
    });
  }
}
