import { Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonService } from '../../services/commonService';
import { Router } from '@angular/router';


import { User } from '../../models/user';
import { Rate } from '../../models/rate';

import { MessageBus } from '../../messageBus/messageBus';
import { MessageBusEvents } from '../../messageBus/messageBusEvents';
import { MessageType } from '../../dynamicSystemMessage/messageType';
import { DataFuelCache } from '../../cache/dataFuelCache';
import { ShowDynamicSystemMessageData } from '../../messageBus/showDynamicSystemMessageData';

import { Capability } from '../../helpers/capabilities';

@Component({
    selector: 'admin-page',
    templateUrl: './admin.page.html',
    styleUrls: ['./admin.page.css', '../../app/app.css'],/*['../app/app.css', '../../dist/css/pixeladmin-dark.min.css',
        '../../dist/css/bootstrap.css',
        '../../dist/css/pixeladmin.css', '../../dist/css/themes/default.css'],*/
    providers: [CommonService]
})

export class AdminPage implements OnInit {
    private showModal: boolean = false;
    private modalMessage: string = '';

    public rows: Array<any> = [];
    public columns: Array<any> = [
        { title: 'id', name: 'Id', className: ['bg-primary', 'text-white', 'sorting_asc', 'align-middle'], sort: 'asc', type: 'int' },
        { title: 'имя', name: 'Name', className: ['bg-primary', 'text-white', 'sorting', 'align-middle'], sort: '' },
        { title: 'потрачено реквестов', name: 'TotalRequests', className: ['bg-primary', 'text-white', 'sorting', 'align-middle'], sort: '', type: 'int' },
        { title: 'остаток экспорта', name: 'ExportLimit', className: ['bg-primary', 'text-white', 'sorting', 'align-middle'], sort: '', type: 'int' },
        {
            title: 'остаток реквестов',
            name: 'TotalRequestLimit',
            className: ['bg-primary', 'text-white', 'sorting', 'align-middle'], sort: '', type: 'int'
            //  filtering: { filterString: '', placeholder: 'фильтр по типу' }
        },
        { title: 'ВК страница', className: ['bg-primary', 'text-white', 'sorting', 'align-middle'], name: 'UserProfileUrl', sort: '' },
        { title: 'ВК Id', name: 'UserId', className: ['bg-primary', 'text-white', 'sorting', 'align-middle'], sort: '' },
        { title: 'email', name: 'Email', className: ['bg-primary', 'text-white', 'sorting', 'align-middle'], sort: '' },
        { title: 'rate', name: 'rate', className: ['bg-primary', 'text-white', 'sorting', 'align-middle'], sort: '' },
        { title: 'окончание', name: 'End_Date', className: ['bg-primary', 'text-white', 'sorting', 'align-middle'], sort: '' },
    ];
    public config: any = {
        paging: true,
        sorting: { columns: this.columns },
        filtering: { filterString: '' },
        className: ['table-striped', 'table-bordered']
    };
    public page: number = 1;
    public itemsPerPage: number = 10;
    public length: number = 0;
    public maxSize: number = 5;

    private users: User[] = [];
    private userId: string;
    private requests: number = 500000;
    private rateId: number;
    private permissions: number;

    private rates: Rate[] = [];
    private capabilitiesArray: any[] = [];

    private proceedHandler: any;
    private setRateHandler: any;
    private userIdChangedHandler: any;
    private setPermissionsHandler: any;

    constructor(
        private service: CommonService,
        private router: Router,
        private ref: ChangeDetectorRef,
        private messageBus: MessageBus,
        private cache: DataFuelCache,
        private capabilities: Capability) {

        //messageBus.subscribe(MessageBusEvents.RatesReceived, (rates: Rate[]) => this.rates = rates);

        this.proceedHandler = this.proceed.bind(this);
        this.setRateHandler = this.setRate.bind(this);
        this.userIdChangedHandler = this.userIdChanged.bind(this);
        this.setPermissionsHandler = this.setPermissions.bind(this);

        if (this.users.length == 0) {
            this.service.getUsers().then((data) => {
                data.usersInfo.forEach(info => {
                    let rate = this.cache.Rates.filter(r => r.Id == info.Rate_Id)[0];
                    let name = '';
                    if (rate == null) {
                        name = 'нет';
                    } else {
                        name = rate.Name;
                    }

                    info.rate = name;

                    if (info.End_Date) {
                        info.End_Date = this.getDateString(info.End_Date);
                    }
                });

                this.users = data.usersInfo; //.filter(i => this.stringToDate(i.End_Date) > new Date() || !i.End_Date);
                this.onChangeTable(this.config);
            });
        }

        let props = Object.getOwnPropertyNames(capabilities);
        props.forEach(p => this.capabilitiesArray.push({name: p, value: capabilities[p]}));
    }

    getDateString(dateTime) {
        return (new Date(dateTime)).toLocaleString();
    }

    ngOnInit() {
        this.service.getRates(false).then(this.rateListRecieved.bind(this));

        this.rates = this.cache.Rates;
    }

    private rateListRecieved(ratesJson: any) {
        this.rates = ratesJson.json();
        this.messageBus.perform(MessageBusEvents.RatesReceived, this.rates);
    }

    userIdChanged(event) {
        this.service.getUserRate(event.target.value).then(res => this.rateId = res.Id);
    }

    setPermissions() {
        this.service.setPermissions(this.userId, this.permissions)
            .then(res => this.messageBus.perform(
                MessageBusEvents.ShowDynamicSystemMessage,
                new ShowDynamicSystemMessageData(res.success ? MessageType.success : MessageType.error, res.message)));
    }

    getUserId(url): string {
        let parts = url.split('/'),
            index = parts.indexOf('vk.com');
        if (index > parts.length) {
            return null;
        }

        if (parts.length == 1) {
            return url;
        }

        return parts[index + 1];
    }

    proceed() {
        this.service.addRequests(this.getUserId(this.userId), this.requests).then(response => {
            this.userId = null;
            this.modalMessage = response['message'];
            this.showModal = true;

            setTimeout(() => this.showModal = false, 5000);
        });
    }

    private changeRateId(event) {
        let rateId = event.target['value'];
    }

    private setRate() {
        this.service.setRateForUser(this.userId, this.rateId)
            .then(res => this.messageBus.perform(
                MessageBusEvents.ShowDynamicSystemMessage,
                new ShowDynamicSystemMessageData(res.success ? MessageType.success : MessageType.error, res.message)));
    }

    private stringToDate(date) {
        // Convert to a number YYYYMMDD which we can use to order
        return new Date(date);
    }

    // define the sorts
    private dateTimeAsc(a, b) {
        var ordA = this.stringToDate(a),
            ordB = this.stringToDate(b);

        return (ordA < ordB) ? -1 : ((ordA > ordB) ? 1 : 0);
    };

    private dateTimeDesc(a, b) {
        var ordA = this.stringToDate(a),
            ordB = this.stringToDate(b);
        return (ordA < ordB) ? 1 : ((ordA > ordB) ? -1 : 0);
    };

    public onChangeTable(config: any, page: any = { page: this.page, itemsPerPage: this.itemsPerPage }): any {
        if (config.filtering) {
            Object.assign(this.config.filtering, config.filtering);
        }

        if (config.sorting) {
            Object.assign(this.config.sorting, config.sorting);
        }

        let filteredData = this.changeFilter(this.users, this.config);
        let sortedData = this.changeSort(filteredData, this.config);
        this.rows = page && config.paging ? this.changePage(page, sortedData) : sortedData;
        this.length = sortedData.length;
    }

    public onCellClick(data: any): any {
        if (data.column === 'UserProfileUrl') {
            //        this.router.navigateByUrl(`/results/${data.row.Id}`);
        }
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
                if ((item[column.name] || '').toString().match(this.config.filtering.filterString)) {
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

    public changePage(page: any, data: Array<any> = this.users): Array<any> {
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
        let type: string = void 0;
        let sort: string = void 0;

        for (let i = 0; i < columns.length; i++) {
            if (columns[i].sort !== '' && columns[i].sort !== false) {
                columnName = columns[i].name;
                type = columns[i].type;
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
            let previousValue = type === 'int' ? parseInt(previous[columnName] || 0) : previous[columnName],
                currentValue = type === 'int' ? parseInt(current[columnName] || 0) : current[columnName];

            if (columnName === 'End_Date') {
                if (sort === 'desc') {
                    return this.dateTimeDesc(currentValue, previousValue);
                }

                return this.dateTimeAsc(currentValue, previousValue);
            }
            if (previousValue > currentValue) {
                return sort === 'desc' ? -1 : 1;
            } else if (previousValue < currentValue) {
                return sort === 'asc' ? -1 : 1;
            }
            return 0;
        });
    }
}