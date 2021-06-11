const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;
var paypal = require('paypal-rest-sdk');
const axios = require('axios').default;

const ClientID = "";
const Secret = ""
const Access_Token = "";

//configure paypal
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': ClientID,
    'client_secret': Secret
});

//to enable req.body 
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//check server working
app.get('/', (req, res) => {
    return res.send("Worked!");
});

//payment page
app.get('/payment-page', (req, res) => {
    return res.sendFile(path.resolve("payment.html"));
});

app.get('/subscription', (req, res) => {
    return res.sendFile(path.resolve("recurring.html"));
})

//example json req for creating source
var create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://return.url",
        "cancel_url": "http://cancel.url"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "item",
                "sku": "item",
                "price": "1.00",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "1.00"
        },
        "description": "This is the payment description."
    }]
};

//create source for payment
app.post('/createSource', (req, res) => {
    paypal.payment.create(create_payment_json, function(error, payment) {
        if (error) {
            throw new Error(error);
        } else {
            console.log("Create Payment Response");
            return res.json(payment);
        }
    });
});

//complete transaction
app.post('/executePay', (req, res) => {
    let paymentID = req.body.paymentID; //getting from payment.html
    let execute_payment_json = {
        "payer_id": req.body.payerID, //getting from payment.html
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "1.00"
            }
        }]
    };
    paypal.payment.execute(paymentID, execute_payment_json, function(error, payment) {
        if (error) {
            throw new Error(error);
        } else {
            return res.json(payment);
        }
    });
})


//recurring
app.get('/create-product', (req, res) => {
    var data = JSON.stringify({
        "name": "Video Streaming Service",
        "description": "Video streaming service",
        "type": "SERVICE",
        "category": "SOFTWARE",
        "image_url": "https://example.com/streaming.jpg",
        "home_url": "https://example.com/home"
    });

    var config = {
        method: 'post',
        url: 'https://api.sandbox.paypal.com/v1/catalogs/products',
        headers: {
            'Content-Type': 'application/json'
        },
        auth: {
            username: ClientID,
            password: Secret
        },
        data: data
    };

    axios(config)
        .then(function(response) {
            // console.log(JSON.stringify(response.data));
            return res.json(response.data);
        })
        .catch(function(error) {
            // console.log(error);
            return res.json(error);
        });
});

app.get('/create-plan', (req, res) => {
    var data = JSON.stringify({
        "product_id": "PROD-8WC027174L363212V",
        "name": "Basic Plan",
        "description": "Basic plan",
        "billing_cycles": [{
                "frequency": {
                    "interval_unit": "MONTH",
                    "interval_count": 1
                },
                "tenure_type": "TRIAL",
                "sequence": 1,
                "total_cycles": 1
            },
            {
                "frequency": {
                    "interval_unit": "MONTH",
                    "interval_count": 1
                },
                "tenure_type": "REGULAR",
                "sequence": 2,
                "total_cycles": 12,
                "pricing_scheme": {
                    "fixed_price": {
                        "value": "10",
                        "currency_code": "USD"
                    }
                }
            }
        ],
        "payment_preferences": {
            "auto_bill_outstanding": true,
            "setup_fee": {
                "value": "10",
                "currency_code": "USD"
            },
            "setup_fee_failure_action": "CONTINUE",
            "payment_failure_threshold": 3
        },
        "taxes": {
            "percentage": "10",
            "inclusive": false
        }
    });

    var config = {
        method: 'post',
        url: 'https://api.sandbox.paypal.com/v1/billing/plans',
        headers: {
            'Content-Type': 'application/json'
        },
        auth: {
            username: ClientID,
            password: Secret
        },
        data: data
    };

    axios(config)
        .then(function(response) {
            // console.log(JSON.stringify(response.data));
            return res.json(response.data);
        })
        .catch(function(error) {
            // console.log(error);
            return res.json(error);
        });
});

app.get('/products', (req, res) => {
    var config = {
        method: 'get',
        url: 'https://api.sandbox.paypal.com/v1/catalogs/products',
        headers: {
            'Content-Type': 'application/json'
        },
        auth: {
            username: ClientID,
            password: Secret
        },
    };

    axios(config)
        .then(function(response) {
            // console.log(JSON.stringify(response.data));
            return res.json(response.data);
        })
        .catch(function(error) {
            // console.log(error);
            return res.json(error);
        });
})


try {
    app.listen(PORT, () => {
        console.log("Server started on " + PORT);
    })
} catch (error) {
    console.log(error);
}
