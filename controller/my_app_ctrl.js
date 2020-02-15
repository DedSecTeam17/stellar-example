const jwt = require('jsonwebtoken');
const errors = require('restify-errors');
const restify_jwt = require('restify-jwt-community');
const axios = require('axios')


var StellarSdk = require('stellar-sdk');


module.exports.create = (async (req, res, next) => {
    try {
        const pair = StellarSdk.Keypair.random();
        pair.secret();
        pair.publicKey();


        const response = await axios.get(`https://friendbot.stellar.org?addr=${encodeURIComponent(pair.publicKey())}`);


        // const responseJSON = await response.json();


        sendJsonResponse(res, {"message": response.data, "puk": pair.publicKey(), "secret": pair.secret()}, 200);

    } catch (e) {
        sendJsonResponse(res, {"message": e.message}, 200);

    }
});


//loadAccount


module.exports.loadAccount = (async (req, res, next) => {
    try {
        const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");

        const account = await server.loadAccount(req.params['pk']);
        sendJsonResponse(res, {"balances": account.balances}, 200);

    } catch (e) {
        sendJsonResponse(res, {"message": e.message}, 200);

    }
});


module.exports.send = (async (req, res, next) => {
    try {

        const {r_pk, amount, secret} = req.body;

        let server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
        //
        let sourceKeys = StellarSdk.Keypair
            .fromSecret(secret);

        //
        let destinationId = r_pk;

        let transaction;

        server.loadAccount(destinationId)
        // If the account is not found, surface a nicer error message for logging.
            .catch(function (error) {
                if (error instanceof StellarSdk.NotFoundError) {
                    sendJsonResponse(res, {"message": error}, 200);

                    throw new Error('The destination account does not exist!');

                } else {
                    sendJsonResponse(res, {"message": error}, 200);
                    return error
                }
            })
            // If there was no error, load up-to-date information on your account.
            .then(function () {
                return server.loadAccount(sourceKeys.publicKey());
            })
            .then(function (sourceAccount) {
                // Start building the transaction.
                transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
                    fee: StellarSdk.BASE_FEE,
                    networkPassphrase: StellarSdk.Networks.TESTNET
                })
                    .addOperation(StellarSdk.Operation.payment({
                        destination: destinationId,
                        // Because Stellar allows transaction in many currencies, you must
                        // specify the asset type. The special "native" asset represents Lumens.
                        asset: StellarSdk.Asset.native(),
                        amount: amount.toString()
                    }))
                    // A memo allows you to add your own metadata to a transaction. It's
                    // optional and does not affect how Stellar treats the transaction.
                    .addMemo(StellarSdk.Memo.text('Test Transaction'))
                    // Wait a maximum of three minutes for the transaction
                    .setTimeout(180)
                    .build();
                // Sign the transaction to prove you are actually the person sending it.
                transaction.sign(sourceKeys);
                // And finally, send it off to Stellar!
                return server.submitTransaction(transaction);
            })
            .then(function (result) {
                // console.log('Success! Results:', result);

                sendJsonResponse(res, {"message": result}, 200);

            })
            .catch(function (error) {
                // console.error('Something went wrong!', error);

                sendJsonResponse(res, {"message": error}, 200);

                // If the result is unknown (no response body, timeout etc.) we simply resubmit
                // already built transaction:
                // server.submitTransaction(transaction);
            });

    } catch (e) {
        sendJsonResponse(res, {"message": e.message}, 200);

    }
});

// receive
module.exports.receive = (async (req, res, next) => {
    try {

        console.log("waiting  to changes")

        var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
        var accountId = "GCAWBOUPIU2FJP4MMFV4T4T4T7DZSDWXT5KK65WGNV4K47RAYET3QVPK";

// Create an API call to query payments involving the account.
        var payments = server.payments().forAccount(accountId);

// If some payments have already been handled, start the results from the
// last seen payment. (See below in `handlePayment` where it gets saved.)
        var lastToken = loadLastPagingToken();
        if (lastToken) {
            payments.cursor(lastToken);
        }

// `stream` will send each recorded payment, one by one, then keep the
// connection open and continue to send you new payments as they occur.
        payments.stream({
            onmessage: function (payment) {
                // Record the paging token so we can start from here next time.
                savePagingToken(payment.paging_token);

                // The payments stream includes both sent and received payments. We only
                // want to process received payments here.
                if (payment.to !== accountId) {
                    return;
                }

                // In Stellar’s API, Lumens are referred to as the “native” type. Other
                // asset types have more detailed information.
                var asset;
                if (payment.asset_type === 'native') {
                    asset = 'lumens';
                } else {
                    asset = payment.asset_code + ':' + payment.asset_issuer;
                }

                console.log(payment.amount + ' ' + asset + ' from ' + payment.from);
            },

            onerror: function (error) {
                console.error('Error in payment stream');
            }
        });
    } catch (e) {
        sendJsonResponse(res, {"message": e.message}, 200);

    }
});

function sendJsonResponse(res, data, status) {
    res.status(status);
    res.send(data);
}

function savePagingToken(token) {
    // In most cases, you should save this to a local database or file so that
    // you can load it next time you stream new payments.
}

function loadLastPagingToken() {
    // Get the last paging token from a local database or file
}
