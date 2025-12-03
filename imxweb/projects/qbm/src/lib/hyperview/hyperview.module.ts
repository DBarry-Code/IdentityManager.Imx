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

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EuiCoreModule, EuiMaterialModule } from '@elemental-ui/core';

import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { HyperviewComponent } from './hyperview.component';
import { ListShapeComponent } from './listshape.component';
import { PropertyShapeComponent } from './propertyshape.component';
import { ShapeComponent } from './shape.component';
import { SimpleShapeComponent } from './simpleshape.component';
import { ZoomPanDirective } from './zoom-pan.directive';

@NgModule({
  declarations: [HyperviewComponent, PropertyShapeComponent, ListShapeComponent, SimpleShapeComponent, ShapeComponent, ZoomPanDirective],
  imports: [CommonModule, EuiCoreModule, EuiMaterialModule, MatTooltipModule, MatBadgeModule, TranslateModule, MatButtonModule],
  exports: [HyperviewComponent],
})
export class HyperViewModule {}
