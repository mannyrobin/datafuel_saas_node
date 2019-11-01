import { Injectable }     from '@angular/core';

@Injectable()
export class  RequestType {
    public static analisys:string = 'analisys';
    public static segment:string = 'segment';
    public static phone:string = 'usersByPhones';
};