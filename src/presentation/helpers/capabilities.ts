import { Injectable } from '@angular/core';

@Injectable()
export class Capability {
    public admin: number = 1;
    public analisys: number = 2;
    public segment: number = 4;
    public dev: number = 8;
    public lal: number = 64;
    public exportToFile: number = 128;
    public searchByPhone: number = 128 * 2;
    public peoplesToExcel: number = 512;

    constructor() {
        this['look-a-like'] = this.lal;
    }
};