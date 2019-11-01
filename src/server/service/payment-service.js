'use strict';
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename: './logs/payment.log',
            maxsize: 1024 * 1024 * 10,
            maxFiles: 10,
            json: false,
            eol: '\r\n'
        })
    ]
});

(function (exports, require, module) {
    class PaymentService {
        constructor(expressServer, dataFuelContext) {
            this.app = expressServer;
            this.dataFuelContext = dataFuelContext;
            console.log('PaymentService is initialized');
            this.initialize();
        }

        initialize() {
            this.app.post('/paymentCheck', (req, res) => {
                console.log('paymentCheck');
                console.log(req.body);

                this.dataFuelContext.getUser(req.body.customerNumber, user => {
                    let response = `<?xml version="1.0" encoding="utf-8"?>
                    <checkOrderResponse 
                        performedDatetime="${(new Date()).toISOString()}"
                        code="${user != null ? 0 : 1}" 
                        invoiceId="${req.body.invoiceId}" 
                        shopId="130413"/>`;

                    console.log(`response: ${response}`);

                    logger.info(`paymentCheck: ${JSON.stringify(req.body)}`);

                    res.setHeader('Content-Type', 'application/xml');
                    res.write(response);
                    res.status(200).end();
                });
            });
            this.app.post('/paymentAviso', (req, res) => {
                console.log('paymentAviso');
                console.log(req.body);
                logger.info(`paymentAviso: ${JSON.stringify(req.body)}`);

                let response = `<?xml version="1.0" encoding="utf-8"?>
                    <paymentAvisoResponse 
                        performedDatetime="${(new Date()).toISOString()}"
                        code="0" 
                        invoiceId="${req.body.invoiceId}" 
                        shopId="130413"/>`;

                res.setHeader('Content-Type', 'application/xml');
                res.write(response);
                res.status(200).end();

                this.dataFuelContext.addMoney(req.body.customerNumber, req.body.orderSumAmount, () => { });
            });
            this.app.post('/paymentSuccess', (req, res) => {
                console.log('paymentSuccess');
                console.log(req.body);
                logger.info(`paymentSuccess: ${JSON.stringify(req.body)}`);

            });
            this.app.post('/paymentFailed', (req, res) => {
                console.log('paymentFailed');
                console.log(req.body);
                logger.info(`paymentFailed: ${JSON.stringify(req.body)}`);

            });
        }
    }

    module.exports = PaymentService;
})(module.exports, null, module);