import { Component, Input } from '@angular/core';

@Component({
    selector: 'dropdown-menu',
    templateUrl: './template.html'
})
export class DropdownMenuComponent {
    public status: { isopen: boolean } = { isopen: false };

    @Input() items: string[];

    public toggleDropdown($event: MouseEvent): void {
        $event.preventDefault();
        $event.stopPropagation();
        this.status.isopen = !this.status.isopen;
    }
}