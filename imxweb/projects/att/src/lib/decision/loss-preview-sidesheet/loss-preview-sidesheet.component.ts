import { Component, Inject } from '@angular/core';
import { EUI_SIDESHEET_DATA, EuiSidesheetRef } from '@elemental-ui/core';
import { LossPreview } from '../loss-preview.interface';

@Component({
  selector: 'imx-loss-preview-sidesheet',
  standalone: false,
  templateUrl: './loss-preview-sidesheet.component.html',
  styleUrl: './loss-preview-sidesheet.component.scss',
})
export class LossPreviewSidesheetComponent {
  constructor(
    @Inject(EUI_SIDESHEET_DATA)
    public data: {
      lossPreview: LossPreview;
      decisionFunc: () => Promise<void>;
    },
    private sidesheetRef: EuiSidesheetRef,
  ) {}

  /**
   * Cancel denial process, close sidesheet
   */
  public onCancel(): void {
    this.sidesheetRef.close();
  }

  /**
   * Continue denial process useing the passed denial function, close sidesheet after
   */
  public async onDeny(): Promise<void> {
    await this.data.decisionFunc();
    // We don't have a good way to know if the decision was cancelled at this point, close sidesheet always
    this.sidesheetRef.close();
  }
}
