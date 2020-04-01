'use strict';

let _rates = [];

const _rateMap = {
    Light: 'Optimum',
    Optimum: 'Pro',
    Pro: 'The King',
    Business: 'Corporate'
}

class Rates {
    constructor(dataBaseService) {
        this.Id = 0;
        this.Name = '';
        this.Request = 0;
        this.Permissions = 0;
        this.Limitation = 0;
        this.Cost = 0;

        dataBaseService.getAllRates(false, rates => {
            _rates = rates;
        });
    }

    static getInstance(dataBaseService) {
        return new Rates(dataBaseService);
    }

    getAll() {
        return _rates;
    }

    getRate(id) {
        return _rates.filter(rate => rate.Id == id)[0];
    }

    getGuestRate() {
        return _rates.filter(rate => rate.Name == 'Guest')[0];
    }

    getPromoRate() {
        return _rates.filter(rate => rate.Name == 'Promo')[0];
    }

    getAvailableRate(billable) {
        return _rates.filter(rate => rate.Requests > 0 && (rate.Cost > 0 || !billable));
    }

    getNextRate(rate) {
        //console.log(JSON.stringify(rate));
        //console.log(JSON.stringify(_rates));
        //console.log(JSON.stringify(_rateMap));
        
        let betteRates = _rates.filter(r => r.Name == _rateMap[rate.Name]);
        //console.log(JSON.stringify(betteRates));
        return betteRates.filter(r => r.Limitation = rate.Limitation)[0] || rate;
    }
}

module.exports = Rates.getInstance;