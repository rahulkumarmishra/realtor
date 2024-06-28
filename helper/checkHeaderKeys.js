const { Validator } = require('node-input-validator');
const helper = require('../helper/helper');

module.exports = {
    authenticateHeader: async function (req, res, next) {
        // console.log(req.headers,'--------in header check------------'); return
        const v = new Validator(req.headers, {
            secret_key: 'required|string',
            publish_key: 'required|string'
        });

        let errorsResponse = await helper.checkValidation(v)

        if (errorsResponse) {
            return helper.failed(res, errorsResponse)
        }

        if ((req.headers.secret_key !== 'mobile_secret_Realtor360_#123@321#') || (req.headers.publish_key !== 'mobile_publish_Realtor360_#123@321#')) {
            return helper.failed(res, 'Key not matched!')

        }
        next();
    }
}