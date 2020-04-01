import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonService } from '../../../services/commonService';
import { vkService } from '../../../services/vkService';
import { Router } from '@angular/router';
import { Capability } from '../../../helpers/capabilities';

import { ImportSegmentData } from '../../../models/importSegmentData';
import { User } from '../../../models/user';
import { NameCountPair } from '../../../models/nameCountPair';
import { HorizontalGraphData } from '../../../models/horizontalGraphData';
import { Mbti_Types } from '../../../models/mbti_types';
import { MedianValue } from '../../../models/medianValue';
import { ResultViewModel } from '../../../models/resultViewModel';
import { ExportResultModel } from '../../../models/exportResultModel';
import { ChartData } from '../../../models/chartData';
import { Sex } from '../../../models/sex';

import { DescriptionUrl } from '../../../helpers/descriptionUrl';
import { ResultStrings } from '../../../strings/result';
import { DataFuelCache } from '../../../cache/dataFuelCache';

@Component({
    selector: 'analisys',
    templateUrl: './analisys.component.html',
    styleUrls: ['../../analisys.component.css', '../../../app/app.css',
        '../result.component.css',
        '../../../../dist/css/pixeladmin.css', '../../../../dist/css/themes/default.css'],
    providers: [CommonService]
})

export class AnalisysComponent implements OnInit {
    private descriptionUrls: DescriptionUrl = new DescriptionUrl();

    private exportSegmentModal: boolean = false;
    private exportSegmentsAvailable: boolean = false;
    private exportPeoplesAvailable: boolean = false;

    private viewModel = new ResultViewModel();
    private exportModel = new ExportResultModel(parseInt(window.location.pathname.split(`/`)[2]));
    private medianValues: MedianValue = new MedianValue();
    private progress: number = 0;
    private totalCount = 0;

    private mbti_types = new Mbti_Types();
    private testRightValue: number = 30;
    private testRightTitle: string = "right";
    private testLeftTitle: string = "left";

    private Introvert: HorizontalGraphData = new HorizontalGraphData();
    private Perception: HorizontalGraphData = new HorizontalGraphData();
    private Thought: HorizontalGraphData = new HorizontalGraphData();
    private Tactics: HorizontalGraphData = new HorizontalGraphData();

    private pageReady: boolean = false;
    private groupsReady: boolean = false;
    private results: any;
    private type: string;
    private name: string;
    private barChartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true,
        title: {
            display: true,
            text: `семейное положение`
        },
        legend: {
            display: false,
            onClick: () => { return false; }
        }
    };
    private city_stateBarChartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true,
        title: {
            display: true,
            text: `города`
        },
        legend: {
            display: false,
            onClick: () => { return false; }
        }
    };
    private bday_stateBarChartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true,
        title: {
            display: true,
            text: `возраст`
        },
        legend: {
            display: false,
            onClick: () => { return false; }
        }
    }
    private sex_stateBarChartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true,
        title: {
            display: true,
            text: `пол`
        },
        legend: {
            display: false,
            onClick: () => { return false; }
        }
    };
    private group_stateBarChartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true,
        title: {
            display: true,
            text: `популярные группы`
        },
        legend: {
            display: false,
            onClick: () => { return false; }
        }
    };
    private mbti_stateBarChartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true,
        title: {
            display: true,
            text: `психотипы`
        },
        legend: {
            display: false,
            onClick: (q) => { console.log(q); return false; }
        }
    };

    private barChartLegend: boolean = true;
    private pieChartType: string = `pie`;
    private barChartType: string = `bar`;
    private doughnutChartType: string = `doughnut`;

    private relation_statChartLabels: string[] = [];
    private relation_statChartData: any[] = [];
    private city_stateChartData: any[] = [];
    private bday_stateChartData: any[] = [];
    private sex_stateChartData: any[] = [];
    private group_stateChartData: any[] = [];
    private mbti_stateChartData: ChartData[] = [];
    private life_stateChartData: any[] = [];
    private people_stateChartData: any[] = [];

    private interests_stateChartData: ChartData[] = [];
    private club_stateChartData: ChartData[] = [];
    private jungType_stateChartData: ChartData[] = [];
    private vals_stateChartData: ChartData[] = [];

    private bday_state: any;
    private city_state: any;
    private mbti_state: any;
    private popular_groups_state: any;
    private sex_state: any;

    private popularGroupsInfo: any[];

    private empty: boolean;

    private segments: NameCountPair[] = [];

    private resultId: string;

    private deleteHandler: any;
    private hasPermissions: boolean = false;

    private exportResultHandler: any;
    private nameChangeHandler: any;
    private nameEditHandler: any;
    private nameChangeCancelHandler: any;
    private showExportDialogHandler: any;
    private runSexAnalisysHandler: any;
    private hideConfirmDialogHandler: any;
    private runGroupAnalisysHandler: any;
    private showConfirmDialogHandler: any;
    private hideGroupAnalisysHandler: any;
    private markBrokenHandler: any;

    private newName: string;
    private nameUpdated: boolean = true;
    private showConfirm: boolean = false;
    private showGroupConfirm: boolean = false;

    private hasDevCapability: boolean = false;

    private dataset: any[] = [];
    private options = {
        series: {
            pie: {
                show: true,
                radius: 1,
                label: {
                    show: true,
                    radius: 3 / 4,
                    background: { opacity: 0 },

                    formatter: function (label, series) {
                        return Math.round(series.percent) > 0 ? '<div style="font-size:11px;text-align:center;color:white;">' + Math.round(series.percent) + '%</div>' : '';
                    }
                }
            }
        },
        legend: {
            show: true
        },
        grid: {
            hoverable: true,
            clickable: true
        }
    };
    private interest_options = {
        series: {
            pie: {
                show: true,
                radius: 1,
                label: {
                    show: true,
                    radius: 3 / 4,
                    background: { opacity: 0 },

                    formatter: function (label, series) {
                        return Math.round(series.percent) > 0 ? '<div style="font-size:11px;text-align:center;color:white;">' + Math.round(series.percent) + '%</div>' : '';
                    },
                    //    threshold: 0.025,
                },
                combine: {
                    threshold: 0.029,
                    label: `другие`
                }
            }
        },
        legend: {
            show: true
        },
        grid: {
            hoverable: true,
            clickable: true
        }
    };
    private donutOptions = {
        series: {
            pie: {
                innerRadius: 0.5,
                show: true,
                radius: 1,
                label: {
                    show: true,
                    radius: 3 / 4,
                    background: { opacity: 0 },

                    formatter: function (label, series) {
                        return Math.round(series.percent) > 0 ? '<div style="font-size:11px;text-align:center;color:white;">' + Math.round(series.percent) + '%</div>' : '';
                    }
                }
            }
        },
        legend: {
            show: true
        },
        grid: {
            hoverable: true,
            clickable: true
        }
    };

    private categoriesOptions = {
        series: {
            bars: {
                show: true,
                barWidth: 0.6,
                align: "center",
                lineWidth: 0,
                fill: 1
            }
        },
        xaxis: {
            mode: "categories",
            tickLength: 0,
            labelWidth: 35
        },
        grid: {
            hoverable: true,
            clickable: true
        },
        colors: [`#85AFD0`]
    };

    private categoriesSitiesOptions = {
        series: {
            bars: {
                show: true,
                barWidth: 0.6,
                align: "center",
                lineWidth: 0,
                fill: 1
            }
        },
        xaxis: {
            mode: "categories",
            tickLength: 0,
            labelWidth: 35,
            rotateTicks: 140
        },
        grid: {
            hoverable: true,
            clickable: true
        },
        colors: [`#85AFD0`]
    };

    private emptyMessage: string;
    private selectedSex: number = 0;

    private dev: boolean = false;
    private confirmDialogBody: string = '';

    private errorMessage: string;

    constructor(
        private service: CommonService,
        private router: Router,
        private capability: Capability,
        private vkService: vkService,
        private ref: ChangeDetectorRef,
        private cache: DataFuelCache) {

        this.dev = localStorage.getItem('DEV') === '1';

        this.hideGroupAnalisysHandler = this.hideGroupAnalisys.bind(this);
        this.showConfirmDialogHandler = this.showConfirmDialog.bind(this);
        this.nameChangeHandler = this.nameChanged.bind(this);
        this.nameChangeCancelHandler = this.changeNameCanceled.bind(this);
        this.nameEditHandler = this.editName.bind(this);
        this.exportResultHandler = this.exportResult.bind(this);
        this.deleteHandler = this.delete.bind(this);
        this.markBrokenHandler = this.markBroken.bind(this);
        this.showExportDialogHandler = this.showExportDialog.bind(this);
        this.runSexAnalisysHandler = this.runSexAnalisys.bind(this);
        this.hideConfirmDialogHandler = this.hideConfirmDialog.bind(this);
        this.runGroupAnalisysHandler = this.runGroupAnalisys.bind(this);

        this.hasPermissions = !!(Number(localStorage.getItem(`capability`)) & capability.admin);
        this.hasDevCapability = !!(Number(localStorage.getItem(`capability`)) & capability.dev);
        this.exportPeoplesAvailable = !!((capability.peoplesToExcel & this.cache.CurrentUser.Capability) | (this.cache.CurrentUser.Capability & capability.admin));
    }

    public init(data) {

        var romanticTypes = ['ESFJ', 'ESFP', 'ISFP', 'ISFJ'];
        var novatorTypes = ['ENFP', 'ENFJ', 'INFJ', 'INFP'];
        var pragmaticTypes = ['ENTP', 'INTJ', 'ENTJ', 'INTJ'];
        var conservativeTypes = ['ISTJ', 'ESTJ', 'ESTP', 'ISTP'];
        this.resultId = window.location.pathname.split(`/`)[2];
        this.name = data.Name || data.Result.name;
        this.newName = data.Name || data.Result.name;

        if (data.Result.error) {
            this.type = 'error';
            this.empty = true;
            this.errorMessage = data.Result.error;
            return;
        }

        if (data.Result == null) {
            this.progress = data.Progress;

            if (this.progress != 100) {
                this.emptyMessage = `ваш запрос выполняется: ${(this.progress || 0).toFixed(2)}%`;
            }
            else {
                this.emptyMessage = `нет данных по вашему запросу`;
            }

            this.empty = true;
            return;
        }

        if (data.Result != null && Object.keys(data.Result).length > 0 && data.Type) {
            this.type = data.Type.toLowerCase();
            this.results = data.Result;

            if (this.results.relation_stat && this.results.relation_stat.stats && this.results.relation_stat.stats.length) {
                this.results.relation_stat.stats.forEach(element => {
                    let propName = Object.getOwnPropertyNames(element)[0];
                    this.relation_statChartData.push({ label: ResultStrings[propName] || propName, data: element[propName.toString()] * 100 });
                });
                this.relation_statChartData = this.relation_statChartData.sort(this.comparerByData);
                this.exportModel.family = this.relation_statChartData;
            }

            if (this.results.sex_stat && this.results.sex_stat.stats) {
                this.sex_stateChartData.push({ label: `мужчин`, data: this.results.sex_stat.stats[`M`] * 100, type: Sex.M });
                this.sex_stateChartData.push({ label: `женщин`, data: this.results.sex_stat.stats[`F`] * 100, type: Sex.F });
                this.sex_stateChartData = this.sex_stateChartData.sort(this.comparerByData);

                this.exportModel.sex = this.sex_stateChartData;
                this.exportModel.sex[0].medianValue = 0;
                this.exportModel.sex[1].medianValue = 0;
            }

            var groupIds = [];

            /*if (this.results.popular_groups_stat && this.results.popular_groups_stat.stats && this.results.popular_groups_stat.stats.length > 0) {
                this.results.popular_groups_stat.stats.forEach(element => {
                    let propName = Object.getOwnPropertyNames(element)[0];
                    groupIds.push(propName.toString());
                    //this.group_stateChartData[0].data.push(element[propName.toString()] * 100);
                });
                this.getGroupsInfo(groupIds, this.results.popular_groups_stat.stats, (info) => {
                    this.popularGroupsInfo = info;
                    this.groupsReady = true;
                });
            }*/

            if (this.results.mbti_stat && this.results.mbti_stat.stats && this.results.mbti_stat.stats.length) {
                this.results.mbti_stat.stats.forEach(element => {
                    let propName = Object.getOwnPropertyNames(element)[0];
                    let item: string = `${(element[propName.toString()] * 100).toFixed(1)}%`,
                        value: number = 0;

                    if (data.Result.count) {
                        value = element[propName.toString()] * 100; // * (data.Result.count || 1));
                    } else {
                        value = element[propName.toString()] * 100;
                    }

                    switch (propName) {
                        case `ENFJ`:
                            this.viewModel.active.data += value;
                            this.viewModel.etyek.data += value;
                            break;
                        case `ESFP`:
                            this.viewModel.active.data += value;
                            break;
                        case `ENFP`:
                            this.viewModel.actualizer.data += value;
                            this.viewModel.intuit.data += value;
                            break;
                        case `INTP`:
                            this.viewModel.actualizer.data += value;
                            this.viewModel.intuit.data += value;
                            break;
                        case `ENTJ`:
                            this.viewModel.aspiring.data += value;
                            this.viewModel.logician.data += value;
                            break;
                        case `INTJ`:
                            this.viewModel.aspiring.data += value;
                            this.viewModel.logician.data += value;
                            break;
                        case `ENTP`:
                            this.viewModel.dostigatel.data += value;
                            this.viewModel.intuit.data += value;
                            break;
                        case `ESTP`:
                            this.viewModel.dostigatel.data += value;
                            break;
                        case `ESFJ`:
                            this.viewModel.experimenter.data += value;
                            this.viewModel.etyek.data += value;
                            break;
                        case `INFP`:
                            this.viewModel.experimenter.data += value;
                            this.viewModel.intuit.data += value;
                            break;
                        case `ESTJ`:
                            this.viewModel.skilled.data += value;
                            this.viewModel.logician.data += value;
                            break;
                        case `ISTJ`:
                            this.viewModel.skilled.data += value;
                            this.viewModel.logician.data += value;
                            break;
                        case `INFJ`:
                            this.viewModel.fighter.data += value;
                            this.viewModel.etyek.data += value;
                            break;
                        case `ISFP`:
                            this.viewModel.fighter.data += value;
                            break;
                        case `ISFJ`:
                            this.viewModel.conservative.data += value;
                            this.viewModel.etyek.data += value;
                            break;
                        case `ISTP`:
                            this.viewModel.conservative.data += value;
                            break;
                    }

                    if (propName[0] === `I`) {
                        this.Introvert.RightValue += element[propName.toString()] * 100;
                    }

                    if (propName[1] === `S`) {
                        this.Perception.RightValue += element[propName.toString()] * 100;
                        this.viewModel.sensorik.data += value;
                    }

                    if (propName[2] === `T`) {
                        this.Thought.RightValue += element[propName.toString()] * 100;
                    }

                    if (propName[3] === `P`) {
                        this.Tactics.RightValue += element[propName.toString()] * 100;
                    }

                    if (romanticTypes.indexOf(propName) > -1) {
                        this.viewModel.pragmatic.data += value;
                    }

                    if (novatorTypes.indexOf(propName) > -1) {
                        this.viewModel.humanities.data += value;
                    }

                    if (pragmaticTypes.indexOf(propName) > -1) {
                        this.viewModel.realists.data += value;
                    }

                    if (conservativeTypes.indexOf(propName) > -1) {
                        this.viewModel.innovators.data += value;
                    }

                    this.mbti_stateChartData.push(new ChartData(
                        `${this.mbti_types[propName.toString()]} (${propName.toString()}), дельта: ${(value - this.medianValues[propName.toString()]).toFixed(2)}`,
                        value,
                        propName.toString(),
                        this.medianValues[propName.toString()]
                    ));
                });

                this.mbti_stateChartData = this.mbti_stateChartData.sort(this.comparerByData);
                this.exportModel.mbti = this.mbti_stateChartData;

                this.vals_stateChartData.push(this.viewModel.active);
                this.vals_stateChartData.push(this.viewModel.actualizer);
                this.vals_stateChartData.push(this.viewModel.aspiring);
                this.vals_stateChartData.push(this.viewModel.dostigatel);
                this.vals_stateChartData.push(this.viewModel.experimenter);
                this.vals_stateChartData.push(this.viewModel.skilled);
                this.vals_stateChartData.push(this.viewModel.fighter);
                this.vals_stateChartData.push(this.viewModel.conservative);
                this.vals_stateChartData = this.vals_stateChartData.sort(this.comparerByData);
                this.exportModel.vals = this.vals_stateChartData;

                this.club_stateChartData.push(this.viewModel.pragmatic);
                this.club_stateChartData.push(this.viewModel.humanities);
                this.club_stateChartData.push(this.viewModel.realists);
                this.club_stateChartData.push(this.viewModel.innovators);
                this.club_stateChartData = this.club_stateChartData.sort(this.comparerByData);
                this.exportModel.clubs = this.club_stateChartData;

                this.jungType_stateChartData.push(this.viewModel.etyek);
                this.jungType_stateChartData.push(this.viewModel.intuit);
                this.jungType_stateChartData.push(this.viewModel.logician);
                this.jungType_stateChartData.push(this.viewModel.sensorik);
                this.jungType_stateChartData = this.jungType_stateChartData.sort(this.comparerByData);
                this.exportModel.jungTypes = this.jungType_stateChartData;

                this.updateLabels();

                this.totalCount = this.results.mbti_stat.count;

                this.Perception.Left.Title = `Интуит`;
                this.Perception.Left.Url = 'http://datafuel.ru/psychographics/#rec14559810';
                this.Perception.Right.Title = `Сенсорик`;
                this.Perception.Right.Url = `http://datafuel.ru/psychographics/#rec14559817`;
                this.Perception.Count = this.results.mbti_stat.count;
                this.Perception.Median = this.medianValues.Perception;
                this.exportModel.perception = [];
                this.exportModel.perception.push(new ChartData(this.Perception.Left.Title, 100 - this.Perception.RightValue, '', this.medianValues.Perception));
                this.exportModel.perception.push(new ChartData(this.Perception.Right.Title, this.Perception.RightValue, '', 100 - this.medianValues.Perception));

                this.Introvert.Left.Title = "Экстраверт";
                this.Introvert.Left.Url = "http://datafuel.ru/psychographics/#rec14559320";
                this.Introvert.Right.Title = "Интроверт";
                this.Introvert.Right.Url = "http://datafuel.ru/psychographics/#rec14559481";
                this.Introvert.Count = this.results.mbti_stat.count;
                this.Introvert.Median = (100 - this.medianValues.Introvert);
                this.exportModel.direct = [];
                this.exportModel.direct.push(new ChartData(this.Introvert.Left.Title, 100 - this.Introvert.RightValue, '', this.medianValues.Introvert));
                this.exportModel.direct.push(new ChartData(this.Introvert.Right.Title, this.Introvert.RightValue, '', 100 - this.medianValues.Introvert));

                this.Thought.Count = this.results.mbti_stat.count;
                this.Thought.Left.Title = `Этик`;
                this.Thought.Left.Url = 'http://datafuel.ru/psychographics/#rec14732010';
                this.Thought.Right.Title = `Логик`;
                this.Thought.Right.Url = 'http://datafuel.ru/psychographics/#rec14732009';
                this.Thought.Median = this.medianValues.Thought;
                this.exportModel.thoughts = [];
                this.exportModel.thoughts.push(new ChartData(this.Thought.Left.Title, 100 - this.Thought.RightValue, '', this.medianValues.Thought));
                this.exportModel.thoughts.push(new ChartData(this.Thought.Right.Title, this.Thought.RightValue, '', 100 - this.medianValues.Thought));

                this.Tactics.Count = this.results.mbti_stat.count;
                this.Tactics.Left.Title = `Рационал`;
                this.Tactics.Left.Url = 'http://datafuel.ru/psychographics/#rec14733709';
                this.Tactics.Right.Title = `Иррационал`;
                this.Tactics.Right.Url = 'http://datafuel.ru/psychographics/#rec14733712';
                this.Tactics.Median = this.medianValues.Tactics;
                this.exportModel.tactics = [];
                this.exportModel.tactics.push(new ChartData(this.Tactics.Left.Title, 100 - this.Tactics.RightValue, '', this.medianValues.Tactics));
                this.exportModel.tactics.push(new ChartData(this.Tactics.Right.Title, this.Tactics.RightValue, '', 100 - this.medianValues.Tactics));
            }

            if (this.results.city_stat && this.results.city_stat.stats && this.results.city_stat.stats.length) {
                this.exportModel.city = [];
                this.results.city_stat.stats.forEach(element => {
                    let propName = Object.getOwnPropertyNames(element)[0];
                    this.city_stateChartData.push([propName, element[propName.toString()] * 100]);

                    this.exportModel.city.push(new ChartData(propName, element[propName.toString()] * 100, propName, 0));
                });

                this.city_stateChartData = this.city_stateChartData.sort(this.comparerArray).slice(0, Math.min(15, this.city_stateChartData.length));
            }


            if (this.results.life_main_stat) {
                let life_main_stat_ordered = this.results.life_main_stat.stats.sort(this.comparer);

                life_main_stat_ordered.forEach(element => {
                    let label = Object.getOwnPropertyNames(element)[0];
                    this.life_stateChartData.push({ label: ResultStrings[label] || label, data: element[label.toString()] * 100 });
                });

                this.exportModel.lifeTargets = this.life_stateChartData;
            }

            if (this.results.people_main_stat) {
                let people_main_stat_ordered = this.results.people_main_stat.stats.sort(this.comparer);

                people_main_stat_ordered.forEach(element => {
                    let label = Object.getOwnPropertyNames(element)[0];
                    this.people_stateChartData.push({ label: ResultStrings[label] || label, data: element[label.toString()] * 100 });
                });

                this.exportModel.mainStats = this.people_stateChartData;
            }

            if (this.results.bday_stat) {
                this.exportModel.age = [];
                this.bday_state = JSON.stringify(this.results.bday_stat.stats);
                let bday_stateChartLabels = Object.getOwnPropertyNames(this.results.bday_stat.stats.distribution).sort();

                for (let i = 0; i < bday_stateChartLabels.length; i++) {
                    this.bday_stateChartData.push([bday_stateChartLabels[i], this.results.bday_stat.stats.distribution[bday_stateChartLabels[i]]]);
                    this.exportModel.age.push(new ChartData(bday_stateChartLabels[i], parseInt(this.results.bday_stat.stats.distribution[bday_stateChartLabels[i]]), bday_stateChartLabels[i]));
                }
            }

            if (this.results.interests) {
                var orderedArray = this.results.interests.stats.sort(this.comparer);

                for (let i = 0; i < orderedArray.length; i++) {
                    let label = Object.getOwnPropertyNames(orderedArray[i])[0];

                    if (orderedArray[i][label] > 0) {
                        this.interests_stateChartData.push(new ChartData(label, orderedArray[i][label], label, 0));
                    }
                }

                this.exportModel.interests = this.interests_stateChartData;
            }

            this.pageReady = true;
            this.initializeCharts();
            this.segments = data.segments.Result.data;
            this.exportSegmentsAvailable = this.segments.length > 0;
            return;
        } else if (data.Result.data != null && data.Result.data.length > 0) {
            this.type = `segment`;
            this.segments = data.Result.data;
            this.pageReady = true;
            this.ref.detectChanges();
            return;
        }

        this.empty = true;
        return;
    }

    updateLabels() {
        let properties = Object.getOwnPropertyNames(this.viewModel);
        properties.forEach(property => {
            let object = this.viewModel[property];
            if (this.medianValues[this.capitalizeFirstLetter(property)]) {
                object.label += `${((object.data || 0) - this.medianValues[this.capitalizeFirstLetter(property)]).toFixed(2)}`;
            }
        });
    }

    comparer(elem1, elem2) {
        let label1 = Object.getOwnPropertyNames(elem1)[0],
            label2 = Object.getOwnPropertyNames(elem2)[0];

        if (elem1[label1] > elem2[label2]) {
            return -1;
        }

        if (elem1[label1] < elem2[label2]) {
            return 1;
        }

        return 0;
    }

    comparerArray(arr1, arr2) {
        const index = 1;

        if (arr1[index] > arr2[index]) {
            return -1;
        }

        if (arr1[index] < arr2[index]) {
            return 1;
        }

        return 0;

    }

    comparerByData(elem1, elem2) {
        if (elem1.data > elem2.data) {
            return -1;
        }

        if (elem1.data < elem2.data) {
            return 1;
        }

        return 0;
    }

    ngOnInit(): void{

    }

    initializeCharts(): void {
        if (this.type == "segment") {
            return;
        }

        const showTooltipHandler = this.showTooltip.bind(this);
        const showCategoryTooltipHandler = this.showCategoryTooltip.bind(this);
        const showCategoryTooltip2Handler = this.showCategoryTooltip2.bind(this);

        if (this.relation_statChartData.length) {
            var placeholder2 = window[`jQuery`]("#relation_placeholder");
            window[`jQuery`].plot(placeholder2, this.relation_statChartData, this.options);
            placeholder2.bind("plothover", showTooltipHandler);
        }

        if (this.sex_stateChartData.length) {
            var placeholder3 = window[`jQuery`]("#sex_placeholder");
            window[`jQuery`].plot(placeholder3, this.sex_stateChartData, this.donutOptions);
            placeholder3.bind("plothover", showTooltipHandler);
            placeholder3.bind("plotclick", (a, b, c) => {
                var val = this.sex_stateChartData[c.seriesIndex];
                this.showConfirm = true;
                this.selectedSex = val.type;
                this.confirmDialogBody = `проанализировать ${val.label} из этой группы?`;
            });
        }

        if (this.city_stateChartData.length) {
            var placeholder4 = window[`jQuery`]("#city_placeholder");
            window[`jQuery`].plot(placeholder4, [this.city_stateChartData], this.categoriesSitiesOptions);
            placeholder4.bind("plothover", showCategoryTooltipHandler);
        }

        if (this.bday_stateChartData.length > 0) {
            var placeholder5 = window[`jQuery`]("#bday_placeholder");
            window[`jQuery`].plot(placeholder5, [this.bday_stateChartData], this.categoriesOptions);
            placeholder5.bind("plothover", showCategoryTooltip2Handler);
        }

        /*if (this.interests_stateChartData.length > 0) {
            var placeholder6 = window[`jQuery`]("#interests_placeholder");
            window[`jQuery`].plot(placeholder6, this.interests_stateChartData, this.interest_options);
            placeholder6.bind("plothover", showTooltipHandler);
        }*/

        if (this.life_stateChartData.length > 0) {
            var placeholder7 = window[`jQuery`]("#life_placeholder");
            window[`jQuery`].plot(placeholder7, this.life_stateChartData, this.options);
            placeholder7.bind("plothover", showTooltipHandler);
        }

        if (this.people_stateChartData.length > 0) {
            var placeholder8 = window[`jQuery`]("#people_placeholder");
            window[`jQuery`].plot(placeholder8, this.people_stateChartData, this.options);
            placeholder8.bind("plothover", showTooltipHandler);
        }

        if (this.mbti_stateChartData.length) {
            var placeholder = window[`jQuery`]("#mbti_placeholder");
            window[`jQuery`].plot(placeholder, this.mbti_stateChartData, this.options);
            placeholder.bind("plothover", showTooltipHandler);
            placeholder.bind("plotclick", (a, b, c) => {
                var win = window.open(this.descriptionUrls[this.mbti_stateChartData[c.seriesIndex].type], '_blank');
                win.focus();
            });

            var placeholder9 = window[`jQuery`]("#club_placeholder");
            window[`jQuery`].plot(placeholder9, this.club_stateChartData, this.options);
            placeholder9.bind("plothover", showTooltipHandler);
        }
    }

    exportUsers() {
        this.service.getUsersByPhones({resultId: this.resultId, hash: null, name: null, phones: null, fileId: null})
    }

    showTooltip(event, pos, obj) {
        if (!obj) {
            window[`jQuery`]("#hover").hide();
            return;
        }

        var percent = parseFloat(obj.series.percent).toFixed(2);
        var hover = window[`jQuery`]("#hover").html(this.labelFormatter(obj.series.label, obj.series));
        hover.offset({ top: pos.pageY - 15, left: pos.pageX + 15 }).show();
    }

    showCategoryTooltip(event, pos, obj) {
        if (!obj) {
            window[`jQuery`]("#hover").hide();
            return;
        }

        var percent = parseFloat(obj.series.data[obj.dataIndex][1]).toFixed(2);
        var hover = window[`jQuery`]("#hover").html(this.labelFormatter(obj.series.data[obj.dataIndex][0], { percent }));
        hover.offset({ top: pos.pageY - 15, left: pos.pageX + 15 }).show();
    }

    showCategoryTooltip2(event, pos, obj) {
        if (!obj) {
            window[`jQuery`]("#hover").hide();
            return;
        }

        var percent = parseFloat(obj.series.data[obj.dataIndex][1]).toFixed(2);
        var hover = window[`jQuery`]("#hover").html(this.labelFormatter(obj.series.data[obj.dataIndex][0], { percent }, false));
        hover.offset({ top: pos.pageY - 15, left: pos.pageX + 15 }).show();
    }

    labelFormatter(label, series, showPercentages: boolean = true) {
        return "<div style='text-align:center; padding:2px; color:white;'>" + label + "<br/>" + Math.round(series.percent) + (showPercentages ? '%' : '') + "</div>";
    }

    delete() {
        this.service.removeResult(window.location.pathname.split(`/`)[2]).then(res => this.router.navigateByUrl(`/results`));
    }

    markBroken() {
        this.service.removeResult(window.location.pathname.split(`/`)[2]).then(res => this.router.navigateByUrl(`/results`));
    }

    getGroupsInfo(groupIds, groups, callback) {
        window['VK'].api('groups.getById', { 'group_ids': groupIds, version: 5.73 },
            (data) => {
                var groupsInfo = [];
                data.response.forEach((responce) => {
                    groupsInfo.push({
                        id: responce.id,
                        name: responce.name,
                        url: `https://vk.com/${responce.screen_name}`,
                        img: responce.photo,
                        count: groups[responce.id]
                    });
                });

                callback(groupsInfo);
            });
    }

    capitalizeFirstLetter(value) {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    showExportDialog() {
        this.exportSegmentModal = !this.exportSegmentModal;
    }

    exportResult() {
        this.service.exportExcel(this.exportModel).then(() => {
            this.service.getExportFile(parseInt(this.resultId));
        });
    }

    hideConfirmDialog() {
        this.showConfirm = false;
    }

    runSexAnalisys() {
        localStorage.setItem('analisys-progress', '0');
        this.service.runAnalisys({
            name: this.name,
            resultId: this.resultId,
            sex: this.selectedSex
        });
        this.hideConfirmDialog();
    }

    runGroupAnalisys(groupId, name) {
        this.showGroupConfirm = false;
        localStorage.setItem('analisys-progress', '0');
        this.service.runAnalisys({
            groupId,
            name,
        });
    }

    hideGroupAnalisys() {
        this.showGroupConfirm = false;
    }

    showConfirmDialog(groupId, name) {
        this.runGroupAnalisysHandler = this.runGroupAnalisys.bind(this, groupId, name);
        this.confirmDialogBody = `проанализировать группу ${name}?`;
        this.showGroupConfirm = true;
    }

    private nameChanged() {
        this.nameUpdated = true;
        this.name = this.newName;
        this.service.updateResultName(this.resultId, this.name);
    }

    private changeNameCanceled() {
        this.nameUpdated = true;
        this.newName = this.name;
    }

    private editName() {
        this.newName = this.name;
        this.nameUpdated = false;
    }

    // events
    private chartClicked(e: any): void {
    }

    private chartHovered(e: any): void {
    }

    /*clickHandler() {
        this.service.logout().then(() => this.router.navigateByUrl(`/login`));
    }*/
}
