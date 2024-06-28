const { Validator } = require('node-input-validator');
const helper = require('../../helper/helper');
const db = require('../../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const randomToken = require('random-token');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');

const salt = 10;
const secret = process.env.SECRET;

db.users.hasMany(db.properties, {
    'foreignKey': 'user_id'
});

module.exports = {

    login: async (req, res) => {
        try {

            const v = new Validator(req.body, {
                mobile: ['required', 'regex:^\\+?[0-9]+$', 'maxLength:15', 'minLength:10'],
                device_token: 'required',
                device_type: 'required',
                country_code: 'required'
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }

            const findUser = await db.users.findOne({
                where: {
                    mobile: req.body.mobile,
                    country_code: req.body.country_code,
                    role: 1
                },
                raw: true,
                nest: true
            });

            if (!findUser) {
                return helper.failed(res, 'This mobile number is not registered with us.');
            }

            if (findUser.status == 0) {
                return helper.failed(res, 'Blocked by admin.');
            }

            const otp = Math.floor(1000 + Math.random() * 9000);

            const updateOtp = await db.users.update({
                otp,
                device_token: req.body.device_token,
                device_type: req.body.device_type
            }, { where: { id: findUser.id } });

            if (!updateOtp) {
                console.log('Error while updating otp');
            }

            const userData = await db.users.findOne({
                attributes: ['id', 'name', 'email', 'image', 'country_code', 'mobile', 'location', 'password', 'role', 'status', 'is_verified', 'otp'],
                where: { id: findUser.id }
            });

            const token = jwt.sign({
                id: findUser.id,
                email: findUser.email,
                name: findUser.name
            }, secret, { expiresIn: '24h' });

            userData.dataValues.token = token;

            return helper.success(res, 'User login successfully', userData);

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    signup: async (req, res) => {
        try {

            const v = new Validator({ ...req.body, ...req.files }, {
                name: 'required',
                email: 'required|email',
                country_code: 'required',
                mobile: ['required', 'regex:^\\+?[0-9]+$', 'maxLength:15', 'minLength:10'],
                location: 'required',
                image: 'required'
            });

            let errorsResponse = await helper.checkValidation(v);
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse);
            }

            const checkUser = await db.users.findOne({
                where: {
                    [Op.or]: [
                        { email: req.body.email },
                        { mobile: req.body.mobile }
                    ]
                },
                raw: true,
                nest: true
            });

            if (checkUser) {
                if (req.body.email == checkUser.email) {
                    return helper.failed(res, 'Email already exists.');
                }

                if (req.body.mobile == checkUser.mobile && req.body.country_code == checkUser.country_code) {
                    return helper.failed(res, 'This number is registered with another user.');
                }
            }

            var image = await helper.fileUploader(req.files.image, '/uploads');

            const otp = Math.floor(1000 + Math.random() * 9000);

            const createUser = await db.users.create({
                name: req.body.name,
                email: req.body.email,
                country_code: req.body.country_code,
                mobile: req.body.mobile,
                location: req.body.location,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                image: image.name,
                otp: otp,
                device_token: req.body.device_token,
                device_type: req.body.device_type
            });

            if (!createUser) {
                return helper.failed(res, 'Unable to register user.');
            }

            const token = jwt.sign({
                id: createUser.id,
                email: createUser.email,
                name: createUser.name
            }, secret, { expiresIn: '24h' });

            createUser.dataValues.token = token;

            return helper.success(res, 'User registered successfully.', createUser);

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    verifyOtp: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                otp: 'required',
            });

            let errorsResponse = await helper.checkValidation(v);
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse);
            }

            const id = req.user.id;
            const otp = req.body.otp;

            let userData = await db.users.findByPk(id);

            if (!userData) {
                return helper.failed(res, 'User not found.');
            }

            if (userData.otp == otp) {
                const updateOtp = await db.users.update({
                    otp: null,
                    is_verified: '1'
                }, {
                    where: {
                        id: userData.id
                    }
                });

                if (!updateOtp) {
                    return helper.failed(res, 'Something went wrong');
                }

                userData = await db.users.findByPk(id, {
                    attributes: { exclude: ['forgot_password_token', 'createdAt', 'updatedAt', 'deletedAt', 'social_id', 'social_type', 'is_notification', 'device_type', 'device_token', 'password'] }
                });

                return helper.success(res, 'Otp verified successfully', userData);
            }

            return helper.failed(res, 'Invalid otp');

        } catch (error) {
            console.log(error);
            helper.error(res, error);
        }
    },

    resendOtp: async (req, res) => {
        try {
            const otp = Math.floor(1000 + Math.random() * 9000);

            let update_otp = await db.users.update({
                otp: otp
            }, {
                where: { id: req.user.id }
            });

            if (!update_otp) {
                return helper.failed(res, "something went wrong");
            }

            return helper.success(res, 'Otp sent successfully', otp);

        } catch (error) {
            console.log(error);
            return helper.failed(res, error);
        }
    },

    logout: async (req, res) => {
        try {
            const update_token = await db.users.update({
                device_token: ''
            },
                { where: { id: req.user.id } }
            );

            return helper.success(res, "User logout successfully.")

        } catch (error) {
            return helper.failed(res, error);
        }
    },

    userProfile: async (req, res) => {
        try {
            const userData = await db.users.findOne({
                attributes: ['id', 'name', 'email', 'country_code', 'mobile', 'image', 'location'],
                where: { id: req.user.id },
            });

            const properties = await db.properties.findAll({
                attributes: ['id', 'user_id', 'property_type', 'location', 'area'],
                include: [{
                    attributes: ['id', 'property_id', 'image'],
                    model: db.property_images,
                    limit: 1
                }],
                where: { user_id: userData.id }
            });

            userData.dataValues.properties = properties;
            return helper.success(res, 'User details with properties list', userData);
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    }

}