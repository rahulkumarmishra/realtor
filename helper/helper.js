const path = require('path');
const { Validator } = require('node-input-validator');
const jwt = require('jsonwebtoken');
const db = require("../models");
const secret = process.env.SECRET;
const moment=require("moment")
const FCM = require('fcm-node')

module.exports = {

    // File uploading 

    fileUploader: async (file, folder = "/users") => {
        let file_name_string = file.name;
        var file_name_array = file_name_string.split(".");
        var file_extension = file_name_array[file_name_array.length - 1];
        var letters = "ABCDE1234567890FGHJK1234567890MNPQRSTUXY";
        var result = "";
        while (result.length < 28) {
            var rand_int = Math.floor(Math.random() * 19 + 1);
            var rand_chr = letters[rand_int];
            if (result.substr(-1, 1) != rand_chr) result += rand_chr;
        }
        let name = result + "." + file_extension;
        if (file_extension == "mp4") {
            var file_path = "/video" + folder + "/" + name;
            var type = 1;
        } else if (file_extension == "mp3") {
            var file_path = folder + "/" + name;
            var type = 2;
        } else {
            var type = 0;
            var file_path = folder + "/" + name;
        }

        file.mv(path.resolve(__dirname, "../public/") + file_path, function (err) {
            if (err) {
                throw err;
            }
        });

        var fileObj = {
            name: name,
            type: type,
        };
        return fileObj;
    },

    fileUploaderWithName: async (file, folder = "/users") => {
        let file_name_string = file.name;
        var file_name_array = file_name_string.split(".");
        var file_extension = file_name_array[file_name_array.length - 1];
        var letters = "ABCDE1234567890FGHJK1234567890MNPQRSTUXY";
        var result = "";
        while (result.length < 15) {
            var rand_int = Math.floor(Math.random() * 19 + 1);
            var rand_chr = letters[rand_int];
            if (result.substr(-1, 1) != rand_chr) result += rand_chr;
        }
        let name = `${file_name_array[0]}_${result}` + "." + file_extension;
        if (file_extension == "mp4") {
            var file_path =  folder + "/" + name;
            var type = 2;
        } else if (file_extension == "mp3") {
            var file_path = folder + "/" + name;
            var type = 3;
        } else {
            var type = 1;
            var file_path = folder + "/" + name;
        }

        file.mv(path.resolve(__dirname, "../public/") + file_path, function (err) {
            if (err) {
                throw err;
            }
        });

        var fileObj = {
            name: name,
            type: type,
        };
        return fileObj;
    },

    authenticateToken: async (req, res, next) => {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        if (token == null) {
            // return res.status(401).json({
            //     code: 401,
            //     message: "token is required",
            // });
            return res.json({
                code: 401,
                message: "token is required",
            })
        }

        jwt.verify(token, secret, { expiresIn: "365d", algorithms: ['RS256', 'RS384', 'RS512', 'HS256', 'HS384', 'HS512'] }, async (err, payload) => {
            if (err) {
                return res.status(401).json({
                    code: 401,
                    message: "invalid token",
                });
                // return res.json({
                //     code: 401,
                //     message: "invalid token",
                // })
            }
            var existingUser = await db.users.findOne({
                where: {
                    id: payload.id,
                    // login_time: payload.login_time,
                }
            });
            if (existingUser) {
                req.user = existingUser
                next()
            } else {
                return res.status(401).json({
                    code: 401,
                    message: "invalid token",
                });
                // return res.json({
                //     code: 401,
                //     message: "invalid token",
                // });
            }
        });
    },



    //messages
    success: function (res, message = "", body = {}) {
        return res.status(200).json({
            success: true,
            code: 200,
            message: message,
            body: body,
        });
    },

    success2: function (res, message = "", body = []) {
        return res.status(200).json({
            success: true,
            code: 200,
            message: message,
            body: body,
        });
    },

    failed: function (res, message = "", body = {}) {
        return res.status(400).json({
            success: false,
            code: 400,
            message: message,
            body: body,
        });
    },

    errorInString: function (validationErrors) {
        var errors = validationErrors;
        var getValues = Object.values(errors);
        var strErrors = "";
        getValues.forEach((element) => {
            strErrors += `${element.message}`;
        });
        return strErrors;
    },

    error: function (res, err, req) {
        let code = typeof err === "object" ? (err.code ? err.code : 403) : 403;
        let message =
            typeof err === "object" ? (err.message ? err.message : "") : err;
        if (req) {
            req.flash("flashMessage", { color: "error", message });

            const originalUrl = req.originalUrl.split("/")[1];
            return res.redirect(`/${originalUrl}`);
        }
        return res.status(code).json({
            success: false,
            message: message,
            code: code,
            body: {},
        });
    },



    checkValidation: async (v) => {
        var errorsResponse

        await v.check().then(function (matched) {
            if (!matched) {
                var valdErrors = v.errors;
                var respErrors = [];
                Object.keys(valdErrors).forEach(function (key) {
                    if (valdErrors && valdErrors[key] && valdErrors[key].message) {
                        respErrors.push(valdErrors[key].message);
                    }
                });
                errorsResponse = respErrors.join(', ');
            }
        });
        return errorsResponse;
    },

    // 'M' is statute miles (default) 
    // 'K' is kilometers  
    //'N' is nautical miles 

    distance(lat1, lon1, lat2, lon2, unit) {
        if (!lat2 || !lon2) {
            console.log('User or date idea lat long is null');
            return null;
        }

        if ((lat1 == lat2) && (lon1 == lon2)) {
            return '0 miles away';
        } else {
            var radlat1 = Math.PI * lat1 / 180;
            var radlat2 = Math.PI * lat2 / 180;
            var theta = lon1 - lon2;
            var radtheta = Math.PI * theta / 180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180 / Math.PI;
            dist = dist * 60 * 1.1515;
            if (unit == "K") { dist = dist * 1.609344; }
            if (unit == "N") { dist = dist * 0.8684; }
            dist = dist.toFixed(2);
            return `${dist} miles away`;
        }
    },

    filterBasedOnLatLong: ('distance', (latitude, longitude, distance, unit) => {
        const constant = unit == "km" ? 6371 : 3959;
        const haversine = `(
            ${constant} * acos(
                cos(radians(${latitude}))
                * cos(radians(latitude))
                * cos(radians(longitude) - radians(${longitude}))
                + sin(radians(${latitude})) * sin(radians(latitude))
            )
        )`;
        return {
            attributes: [
                [sequelize.literal(haversine), 'distance'],
            ],
            having: sequelize.literal(`distance <= ${distance}`)
        }
    }),



    chatDate: async (date) => {
        if (!moment.isMoment(date)) {
          date = moment(date); // ok for js date, milliseconds or string in ISO format
        }
    
        if (date.isSame(moment(), "day")) {
          // return date.format("hh:mm a");
          return "Today"
        } else if (date.isSame(moment().subtract(1, "d"), "day")) {
          return "Yesterday";
        } else if (date.isSame(moment(), "week")) {
          return date.format("dddd");
        } else {
          return date.format("D MMMM YYYY");
        }
      },

      timeAgo: async (input) => {
        const date = input instanceof Date ? input : new Date(input);
        const formatter = new Intl.RelativeTimeFormat("en");
        const ranges = {
          years: 3600 * 24 * 365,
          months: 3600 * 24 * 30,
          weeks: 3600 * 24 * 7,
          days: 3600 * 24,
          hours: 3600,
          minutes: 60,
          seconds: 1,
        };
        const secondsElapsed = (date.getTime() - Date.now()) / 1000;
        for (let key in ranges) {
          if (ranges[key] < Math.abs(secondsElapsed)) {
            const delta = secondsElapsed / ranges[key];
            return formatter.format(Math.round(delta), key);
          }
        }
      },

      send_push_notifications: async function (getNotiDataForMe) {
        try {
          if (getNotiDataForMe.device_token != "" && getNotiDataForMe.device_token != null) {
            var new_message = {
              to: getNotiDataForMe.device_token,
              notification: {
                title: getNotiDataForMe.title,
                body: getNotiDataForMe.message,
                priority: "high",
                notification_type: getNotiDataForMe.type,
              },
              data: {
                title: getNotiDataForMe.title,
                body: getNotiDataForMe.message,
                priority: "high",
                notification_type: getNotiDataForMe.type,
              }
            };
    
            var serverKey = 'AAAArRacJ-Y:APA91bHtjTRXAzxOhbtp1-uLP6LFmIE9omQ3vnm800Dh_ROol-rrlvPz7yiHEAhk6ZRLelG0bB5Bi71q5XxVNw8CTCirXaCFiNQuKiEnWv2fJ6dG6md6y8rzErbIhxKfHLougsszTb8k';
    
            var fcm = new FCM(serverKey);
    
            fcm.send(new_message, function (err, response) {
              if (err) {
                console.log("Something has gone wrong!");
                console.log(new_message, "new_message");
              } else {
                console.log(new_message, "new_message");
                console.log("Successfully sent with response: ", response);
              }
            });
          }
        } catch (error) {
            console.log("push error check",error)
          throw error
        }
    
      },

}