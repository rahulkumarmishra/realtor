const db = require("../../models");

db.properties.hasMany(db.property_images, {
    'foreignKey': 'property_id'
});

// db.user_interests.belongsTo(db.interests, {
//     'foreignKey': 'interest_id'
// });

// db.users.hasMany(db.user_bsdms, {
//     'foreignKey': 'user_id'
// });

// db.user_bsdms.belongsTo(db.sub_category, {
//     'foreignKey': 'bsdm_id'
// });

// db.users.hasOne(db.users_other_info, {
//     'foreignKey': 'user_id'
// })

// db.users_other_info.belongsTo(db.users, {
//     'foreignKey': 'user_id'
// });

module.exports = {

    userListing: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const users = await db.users.findAll({
                where: {
                    role: 1
                },
                order: [
                    ['id', 'DESC']
                ]
            })

            res.render('users/user_listing', { msg: req.flash('msg'), users, title: 'user' });

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    userView: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const userDetails = await db.users.findOne({
                where: {
                    id: req.params.id
                },
            })
            res.render('users/user_view', { msg: req.flash('msg'), userDetails, title: 'user' });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    userStatus: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/');
            let update = await db.users.update(
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

    propertyList: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const list = await db.properties.findAll({
                where: { user_id: req.params.id },
                order: [['id', 'DESC']]
            });

            res.render('users/property_list', { msg: req.flash('msg'), list, title: 'user' });

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    propertyView: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const list = await db.properties.findOne({
                include: [
                    {
                        attributes: ['id', 'image'],
                        model: db.property_images
                    }
                ],
                where: { id: req.params.id }
            });

            res.render('users/property_view', { msg: req.flash('msg'), list, title: 'user' });

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    }

}