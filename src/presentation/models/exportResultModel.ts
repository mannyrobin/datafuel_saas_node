import { ChartData } from './chartData';

export class ExportResultModel {

    public mbti:ChartData[];
    public quadra: ChartData[];
    public vals: ChartData[];
    public clubs: ChartData[];
    public jungTypes: ChartData[];
    public interests: ChartData[];
    public sex: ChartData[];
    public city: ChartData[];
    public age: ChartData[];
    public family: ChartData[];
    
    public direct: ChartData[];
    public perception: ChartData[];
    public thoughts: ChartData[];
    public tactics: ChartData[];

    public lifeTargets: ChartData[];
    public mainStats: ChartData[];

    public ignore: string[] = ['resultId', 'ignore'];
    constructor(public resultId: number) {

    }
}