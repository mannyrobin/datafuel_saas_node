import { ChartData } from './chartData';
import { MedianValue } from './medianValue';

const medianValues: MedianValue = new MedianValue();

export class ResultViewModel {

    public etyek = new ChartData(`Этик, дельта: `, 0, 'Etyek', medianValues.Etyek);
    public intuit = new ChartData(`Интуит, дельта: `, 0, 'Intuit', medianValues.Intuit);
    public logician = new ChartData(`Логик, дельта: `, 0, 'Logician', medianValues.Logician);
    public sensorik = new ChartData(`Сенсорик, дельта: `, 0, 'Sensorik', medianValues.Sensorik);
    
    public pragmatic = new ChartData(`Романтики`, 0, null);
    public realists = new ChartData(`Прагматики `, 0, null );
    public humanities = new ChartData(`Новаторы`, 0, null);
    public innovators = new ChartData(`Консерваторы`, 0, null);

    public active = new ChartData(`Практик, дельта: `, 0, 'Active', medianValues.Active);
    public actualizer = new ChartData(`Актуализатор, дельта: `, 0, 'Actualizer', medianValues.Actualizer);
    public aspiring = new ChartData(`Стремящийся, дельта: `, 0, 'Aspiring', medianValues.Aspiring);
    public dostigatel = new ChartData(`Достигатель, дельта: `, 0, 'Dostigatel', medianValues.Dostigatel);
    public experimenter = new ChartData(`Экспериментатор, дельта: `, 0, 'Experimenter', medianValues.Experimenter);
    public skilled = new ChartData(`Квалифицированный, дельта: `, 0, 'Skilled', medianValues.Skilled);
    public fighter = new ChartData(`Борец, дельта: `, 0, 'Fighter', medianValues.Fighter);
    public conservative = new ChartData(`Консерватор, дельта: `, 0, 'Conservative', medianValues.Conservative);
}