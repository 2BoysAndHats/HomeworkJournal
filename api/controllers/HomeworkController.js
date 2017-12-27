/**
 * HomeworkController
 *
 * @description :: Server-side logic for managing Homework
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var datejs = require('datejs'),
    async = require('async')

daysOfTheWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday'
]


module.exports = {
	getHomework: function (req,res){

        //pull config
        params = req.allParams()
        userConfig = params.userConfig;

        //get date
        date = Date.parse(params.date)

        //If weekend, return blank
        if (! (date.is().weekday())){
            res.json([])
            return;
        }

        //Ok. Now the tricky bit.

        //Pull the base class template
        BaseClass.findOne({
            'baseClassId': userConfig.baseClass
        }).exec(function (err, baseClass){
            if (err) throw err;

            //Decode template
            template = JSON.parse(baseClass.classes)
            
            //Find correct classes for the day
            currentDay = date.toString('dddd')
            classIndex = daysOfTheWeek.indexOf(currentDay)
            classes = template[classIndex]


            //Setup homework
            homework = {}
            classes.forEach(function (c){
                if (c.includes('-')){
                    homework[c] = '';
                } else {
                    d = userConfig[c]
                    homework[d] = '';
                }
            })

            //Lookup homework for those classes
            async.forEach(classes,function (item, callback){
                
                //Find the homework
                if (!item.includes('-')){
                    item = userConfig[item]
                }


                HomeworkEntry.findOne({classId: item, date: date}).exec(function (err, data){
                        if (err){
                            callback(err)
                        }

                        data = data || {homework:''}
                        homework[item] = data.homework;
                        callback()
                    })

            },
            function (err) {
                if (err) throw err.message;

                r = []
                //Turn the object into an array
                h = Object.keys(homework)
                h.forEach(function (c) {
                    r.push({subject: c, homework: homework[c]})
                })

                res.json(r)
            })
        })

    },

    editHomework: function (req,res){
        //Get the homework
        params = req.allParams()

        HomeworkEntry.findOrCreate({date: params.date, classId: params.subj}).exec(function (err,h){
            if (err) return res.serverError()

            h.homework = params.homework;

            h.save()
        }) 

        res.json()
    }
};

