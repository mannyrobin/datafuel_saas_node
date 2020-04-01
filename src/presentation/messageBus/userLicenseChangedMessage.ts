import { Rate } from '../models/rate';


export class UserLicenseChangedMessage {
    constructor(public license: Rate) {
        this.license.Capabilities = license.Capabilities || license.Permissions;

        if (license.Limitation) {
            this.license.End_Date = new Date();
            this.license.End_Date.setDate(this.license.End_Date.getDate() + license.Limitation);
        }
    }
}