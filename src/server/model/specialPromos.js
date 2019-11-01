'use strict';

var rates = require('./rates.js');

let _promos = [];

class SpecialPromos {
    constructor(dataBaseService) {
        this.Id = 0;
        this.Name = '';
        this.Rate_Id = 0;
        this.Times = 1;

        dataBaseService.getSpecialPromos(promos => {
            _promos = promos;
        });
    }

    static getInstance(dataBaseService) {
        return new SpecialPromos(dataBaseService);
    }

    getRateByPromo(name) {
        var promo = _promos.filter(p => {
            return p.Name == name;
        });

        return promo.length > 0 ? promo[0].Rate_Id : null;
    }

    getPromo(name) {
        var promo = _promos.filter(p => {
            return p.Name == name;
        });

        return promo.length > 0 ? promo[0] : null;
    }
}

module.exports = SpecialPromos.getInstance;