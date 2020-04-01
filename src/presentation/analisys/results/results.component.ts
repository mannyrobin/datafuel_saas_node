"use strict";

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonService } from '../../services/commonService';
import { Router } from '@angular/router';
import { Ng2TableModule } from 'ng2-table/ng2-table';
import { Capability } from '../../helpers/capabilities';

import { ResultListItem } from '../../models/resultListItem';
//import { NgTableComponent, NgTableFilteringDirective, NgTablePagingDirective, NgTableSortingDirective } from 'ng2-table/ng2-table';

@Component({
    selector: 'result-list-page',
    templateUrl: './results.component.html',
    styleUrls: ['../analisys.component.css', '../../app/app.css', './results.component.css', 
        '../../../dist/css/bootstrap.css',
        '../../../dist/css/pixeladmin.css', '../../../dist/css/themes/default.css'],
    providers: [CommonService]
})

export class ResultListPage implements OnInit {
    private tableReady: boolean = false;
    public results: any[] = [];

    public rows: Array<any> = [];
    public columns: Array<any> = [
        { title: 'id', name: 'Id', className: ['bg-primary', 'text-white', 'sorting_desc', 'align-middle'], sort: 'desc' },
        { title: 'название запроса', name: 'Name', className: ['bg-primary', 'text-white', 'sorting', 'align-middle'], sort: '' },
        {
            title: 'тип запроса',
            name: 'Type',
            sort: false,
            className: ['bg-primary', 'text-white', 'align-middle'],
            //  filtering: { filterString: '', placeholder: 'фильтр по типу' }
        },
        { title: 'дата создания', className: ['bg-primary', 'text-white', 'sorting', 'align-middle'], name: 'CreatedOn', sort: '' },
        { title: 'статус', name: 'Status', className: ['bg-primary', 'text-white', 'sorting', 'align-middle'], sort: '' },
    ];
    public page: number = 1;
    public itemsPerPage: number = 25;
    public maxSize: number = 5;
    public numPages: number = 1;
    public length: number = 0;
    public data: ResultListItem[] = [];

    public config: any = {
        paging: true,
        sorting: { columns: this.columns },
        filtering: { filterString: '' },
        className: ['table-striped', 'table-bordered']
    };


    constructor(
        private service: CommonService,
        private router: Router,
        private capabilities: Capability,
        private ref: ChangeDetectorRef) {

        this.service.getResults().then((data) => {
            this.results = data;
            this.length = data.length;
            this.prepareData();

            if (this.columns.length == 5 && (parseInt(localStorage.getItem('capability')) & this.capabilities.dev) > 0) {
                this.columns.push({ title: 'User Id', name: 'User_Id', className: 'bg-primary text-white align-middle', sort: false });
            }

            this.tableReady = true;
            this.onChangeTable(this.config);
        //    this.ref.detectChanges();
        });
    }

    public ngOnInit(): void {
        //this.onChangeTable(this.config);
    }

    public changePage(page: any, data: Array<any> = this.data): Array<any> {
        const itemsPerPage = parseInt(page.itemsPerPage);
        let start = (page.page - 1) * itemsPerPage;
        let end = itemsPerPage > -1 ? (start + itemsPerPage) : data.length;
        return data.slice(start, end);
    }

    public changeRowsCount(event: Event) {
        this.itemsPerPage = event.target['value'];
        this.onChangeTable(this.config);
    }

    public changeSort(data: any, config: any): any {
        if (!config.sorting) {
            return data;
        }

        let columns = this.config.sorting.columns || [];
        let columnName: string = void 0;
        let sort: string = void 0;

        for (let i = 0; i < columns.length; i++) {
            if (columns[i].sort !== '' && columns[i].sort !== false) {
                columnName = columns[i].name;
                sort = columns[i].sort;

                if (!!sort && columns[i].className.replace) {
                    columns[i].className = columns[i].className.replace(/sorting.*?\s/, `sorting_${sort} `);
                }
            } else {
                if (!!columns[i].className.replace) {
                    columns[i].className = columns[i].className.replace(/sorting.*?\s/, `sorting `);
                }
            }
        }

        if (!columnName) {
            return data;
        }

        // simple sorting
        return data.sort((previous: any, current: any) => {
            let previousValue = columnName === 'Id' ? parseInt(previous[columnName]) : previous[columnName],
                currentValue = columnName === 'Id' ? parseInt(current[columnName]) : current[columnName];

            if (columnName === 'CreatedOn') {
                if (sort === 'desc') {
                    return this.dateTimeDesc(previousValue, currentValue);
                } 

                return this.dateTimeAsc(previousValue, currentValue);
            }

            if (previousValue > currentValue) {
                return sort === 'desc' ? -1 : 1;
            } else if (previousValue < currentValue) {
                return sort === 'asc' ? -1 : 1;
            }
            return 0;
        });
    }

    public changeFilter(data: any, config: any): any {
        let filteredData: Array<any> = data;
        this.columns.forEach((column: any) => {
            if (column.filtering) {
                filteredData = filteredData.filter((item: any) => {
                    return item[column.name].match(column.filtering.filterString);
                });
            }
        });

        if (!config.filtering) {
            return filteredData;
        }

        if (config.filtering.columnName) {
            return filteredData.filter((item: any) =>
                item[config.filtering.columnName].match(this.config.filtering.filterString));
        }

        let tempArray: Array<any> = [];
        filteredData.forEach((item: any) => {
            let flag = false;
            this.columns.forEach((column: any) => {
                if (item[column.name].toString().match(this.config.filtering.filterString)) {
                    flag = true;
                }
            });
            if (flag) {
                tempArray.push(item);
            }
        });
        filteredData = tempArray;

        return filteredData;
    }

    public onChangeTable(config: any, page: any = { page: this.page, itemsPerPage: this.itemsPerPage }): any {
        if (config.filtering) {
            Object.assign(this.config.filtering, config.filtering);
        }

        if (config.sorting) {
            Object.assign(this.config.sorting, config.sorting);
        }

        let filteredData = this.changeFilter(this.data, this.config);
        let sortedData = this.changeSort(filteredData, this.config);
        this.rows = page && config.paging ? this.changePage(page, sortedData) : sortedData;
        this.length = sortedData.length;
    }

    public onCellClick(data: any): any {
        if (data.column === 'Name') {
            this.router.navigateByUrl(`/results/${data.row.Id}`);
        }
    }

    public getDateString(dateTime) {
        return (new Date(dateTime)).toLocaleString();
    }

    public getStatus(result) {
        if (result.Broken) {
            return "ошибка";
        }

        if (result.Ready) {
            return "готово";
        }

        return "обрабатывается";
    }

    public getType(result) {
        switch (result.Type.toLowerCase()) {
            case 'analisys':
                return 'анализ'
            case 'segment':
                return 'сегментация'
            case 'usersbyphones':
                return 'обогащение';
            default:
                return 'look alike'
        }
    }

    private prepareData() {
        const Max_Length = 55;
        for (let i = 0; i < this.length; i++) {
            let item = new ResultListItem(),
                resultName = this.results[i].Name;
            item.Name = resultName.substr(0, Math.min(Max_Length, resultName.length)) + (resultName.length > Max_Length ? '..' : '');
            item.CreatedOn = this.getDateString(this.results[i].CreatedOn);
            item.Status = this.getStatus(this.results[i]);
            item.Type = this.getType(this.results[i]);
            item.Id = this.results[i].Id;
            item.User_Id = this.results[i].User_Id;

            this.data.push(item);
        }
    }


    private customDateDDMMMYYYYToOrd(date) {
        // Convert to a number YYYYMMDD which we can use to order
        return new Date(date);
    }

    // define the sorts
    private dateTimeAsc(a, b) {
        var ordA = this.customDateDDMMMYYYYToOrd(a),
            ordB = this.customDateDDMMMYYYYToOrd(b);
        
        return (ordA < ordB) ? -1 : ((ordA > ordB) ? 1 : 0);
    };

    private dateTimeDesc(a, b) {
        var ordA = this.customDateDDMMMYYYYToOrd(a),
            ordB = this.customDateDDMMMYYYYToOrd(b);
        return (ordA < ordB) ? 1 : ((ordA > ordB) ? -1 : 0);
    };

    /*clickHandler() {
        this.service.logout().then(() => this.router.navigateByUrl('/login'));
    }*/
}
