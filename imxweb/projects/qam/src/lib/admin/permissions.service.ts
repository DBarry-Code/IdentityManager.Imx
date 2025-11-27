import { Injectable } from '@angular/core';
import { UserModelService } from 'qer';
import { isQAMAdmin } from './permission-helper';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {

  constructor(private readonly userService: UserModelService) {}
  
  public async isQAMAdmin(): Promise<boolean> {
    return isQAMAdmin((await this.userService.getFeatures()).Features || []);
  }
}
