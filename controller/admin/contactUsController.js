const db = require("../../models");

db.contact_us.belongsTo(db.users, {
    "foreignKey": "user_id"
});

module.exports = {

    contactUsList: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const contactUs = await db.contact_us.findAll({
                include: [
                    {
                        attributes: ['name'],
                        model: db.users
                    }
                ],
                order: [['id', 'DESC']]
            });

            res.render('contact/contact', { msg: req.flash('msg'), title: 'contact', contactUs });

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    contactUsView: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const contactUsData = await db.contact_us.findOne({
                where: { id: req.params.id },
                raw: true,
                nest: true
            });
            res.render('contact/viewContact', { msg: req.flash('msg'), title: 'contact', contactUsData });

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    }

}