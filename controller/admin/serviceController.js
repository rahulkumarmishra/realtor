const helper = require('../../helper/helper');
const db = require('../../models');
const path = require('path');
const fs = require('fs');

module.exports = {


    addService: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');
            res.render('services/add_service', { msg: req.flash('msg'), title: 'service' });

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    addServicePost: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const createService = await db.services.create({
                service_name: req.body.title,
                price: req.body.price,
            });

            if (!createService) {
                req.flash('msg', 'Unable to add service');
                return res.redirect('/service/add');
            }

            req.flash('msg', 'Service added successfully');
            return res.redirect('/service/list');


        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    serviceListing: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const service = await db.services.findAll({
                order: [
                    ['id', 'DESC']
                ]
            });

            res.render('services/service_list', { msg: req.flash('msg'), service, title: 'service' });

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    editService: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const serviceDetails = await db.services.findOne({
                where: {
                    id: req.params.id
                }
            });

            res.render('services/edit_service', { msg: req.flash('msg'), serviceDetails, title: 'service' });

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    serviceUpdate: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const updateService = await db.services.update({
                service_name: req.body.title,
                price: req.body.price,
            }, {
                where: {
                    id: req.body.id
                }
            });

            if (!updateService) {
                req.flash('msg', 'Unable to update service');
                return res.redirect(`/interest/edit/${req.body.id}`);
            }

            req.flash('msg', 'Service updated successfully');
            return res.redirect('/service/list');


        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    deleteService: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const id = req.body.id;

            let deleteServices = await db.services.destroy({
                where: {
                    id: req.body.id
                }
            })

            return res.redirect('/service/list');
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    serviceStatus: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/');
            let update = await db.services.update(
                {
                    status: req.body.status,
                },
                {
                    where: {
                        id: req.body.id,
                    },
                }
            );
            if (update) {
                req.flash('msg', 'Status updated successfully')
                res.json(1);
            } else {
                req.flash('msg', 'Unable to update status')
                res.json(0);
            }
        } catch (err) {
            throw err;
        }
    },

}