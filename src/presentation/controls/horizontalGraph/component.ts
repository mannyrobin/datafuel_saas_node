import { Component, Input, OnInit } from '@angular/core';
import { HorizontalGraphData } from '../../models/horizontalGraphData';

@Component({
    selector: 'horizontal-graph',
    templateUrl: './template.html',
    styleUrls: ['./styles.css']
})

export class HorizontalGraph implements OnInit {
    @Input() data: HorizontalGraphData;
    marginTop: string = '';

    public ngOnInit(): void {
    }

    public getMarginTop(): string {
        if (this.data.Median + this.data.RightValue > 100 ) {
            return '-26px';
        }
        return '';
    }

    public navigate(url, event) {
        if (event) {
            event.stopPropagation();
        }

        var win = window.open(url, '_blank');
        win.focus();
    }
}