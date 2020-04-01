export class HorizontalGraphData {
    public RightValue: number = 0;
    public Right: Details = new Details;
    public Left: Details = new Details;
    public Count: number = 0;
    public Median: number = 0;
}

class Details {
    public Title: string;
    public Url: string;
}