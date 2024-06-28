const db = require("../../models");
const { Op } = require('sequelize');
const moment = require('moment');

module.exports = {

    earningList: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect("/login");

            const requestList = await db.requests.findAll({
                include: [
                    {
                        attributes: ['id', 'name'],
                        model: db.users
                    },
                    {
                        attributes: ['id', 'title'],
                        model: db.properties
                    }
                ],
                where: {
                    status: {
                        [Op.ne]: 2
                    }
                },
                order: [['id', 'DESC']]
            });

            const totalAmount = requestList.reduce((total, amount) => total + Number(amount.total_amount), 0)

            res.render('earning/earning_list', { msg: req.flash('msg'), title: 'earn', requestList, totalAmount, moment });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    filterEarning: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect("/login");
            const fromDate = req.body.fromDate;
            const toDate = req.body.toDate;

            const filterAmount = await db.requests.findAll({
                include: [
                    {
                        attributes: ['id', 'name'],
                        model: db.users
                    },
                    {
                        attributes: ['id', 'title'],
                        model: db.properties
                    }
                ],
                where: {
                    date: { [Op.between]: [fromDate, toDate] },
                    status: { [Op.ne]: 2 }
                }
            });

            const totalAmount = filterAmount.reduce((total, data) => total + Number(data.total_amount), 0)
            return res.json({ filterAmount, totalAmount });

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    }

}