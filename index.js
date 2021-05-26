const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;
var paypal = require('paypal-rest-sdk');

const ClientID = "AZtCEjlNFsR7sagb40kBOr-K61purCS5n6kAHnhCOEAHwt3G24ZfJYYQTbIiKRdilkfYAriQsY5y8PbJ";
const Secret = "EOF0JxedgHtLy4xzSEk_ZX51lTqOgjmB-mGrQQ5LAtqBO4FuE1B5VPbmLR01akKaXrV6wFdrFjIRDENS"

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


try {
    app.listen(PORT, () => {
        console.log("Server started on " + PORT);
    })
} catch (error) {
    console.log(error);
}