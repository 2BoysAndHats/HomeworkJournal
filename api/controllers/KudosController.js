/**
 * KudosController
 *
 * @description :: Server-side logic for managing Kudos
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var datejs = require('datejs');

module.exports = {
	getTopThree: function (req,res) {

        //Get date for last week
        lastWeek = Date.parse('last week')

        contributors = {}

        HomeworkEntry.find({}).exec(function (err, records){
            if (err) return res.serverError(err)

            records.forEach(function (record){
                if ( Date.parse(record.date) > lastWeek ){
                    keys = Object.keys(record.homework)
                    keys.forEach(function (contributor) {
                        if (contributors[contributor]) {
                            contributors[contributor] += 1;
                        } else {
                            contributors[contributor] = 1;
                        }
                    })
                }
            })

            //Extract top 3
            c = Object.keys(contributors)
            d = []
            c.forEach(function (key) {
                d.push({user:key,contributions:contributors[key]})
            })

            d.sort(function(a, b){
                var keyA = a.contributions,
                    keyB = b.contributions;
                // Compare the 2 dates
                if(keyA < keyB) return 1;
                if(keyA > keyB) return -1;
                return 0;
            });

            d = d.slice(0,3)

            res.json(d)
        })
    }
};

