function dater (d){
    return d.toString('dddd') + ' the ' + d.toString('ddS of MMMM')
}


/* START DEFINE CLASSES */
schoolClasses = {
            years: [
                {name: '1st year', id: 'y1'}
            ],

            baseClasses: [
                {name: 'da Vinci', id: 'daVinci'}
            ],

            scienceClasses: [
                {name: 'Science - Leona (3.1)', id: '3.1'},
                {name: 'Science - Yvonne (3.2)', id: '3.2'},
                {name: 'Science - Niamh (3.3)', id: '3.3'},
                {name: 'Science - Alison (3.4)', id: '3.4'},
            ],

            optionFours: [
                {name: 'T.G. - Paddy C', id: '4.1'},
                {name: 'Art - Lynn', id: '4.2'},
                {name: 'Business - Mike', id: '4.3'},
                {name: 'Home Ec. - Aileen', id: '4.4'},
                {name: 'Music - Ann Marie', id: '4.5'},
                {name: 'Home Ec. - Olivia', id: '4.6'},
                {name: 'Technology - Adrian', id: '4.7'},
                {name: 'Art - Emma', id: '4.8'},
                {name: 'T.G. - Paddy W', id: '4.9'},
            ],

            optionSixes: [
                {name: 'T.G. - Adrian C', id: '6.1'},
                {name: 'Home Ec. - Olivia', id: '6.2'},
                {name: 'Music - Susan', id: '6.5'},
                {name: 'Business - Shauna', id: '6.6'},
                {name: 'Business - Lisa', id: '6.7'},
                {name: 'Art - Emma', id: '6.8'},
                {name: 'Technology - Paddy W', id: '6.9'},
                {name: 'Woodwork - Paddy C', id: '6.10'}
            ]
}
/* END DEFINE CLASSES */


//This takes internal class codes and turns them into capatilized names
function parseHomework (hw,uc){
    hw.forEach(function (h) {
        subject = h.subject;

        
        //Is it a base class subject, or a non-base class
        if (subject.includes('-')){
            //Backup code
            h.code = subject;

            //It's a base class subject, so split at hyphen, and capatilize first letter
            subject = (subject.split('-')[1])
            subject = subject.charAt(0).toUpperCase() + subject.slice(1)
            h.subject = subject;
        } else {
            //Lookup user code 
            //code = uc[subject];

            //Backup code
            //h.code = code;

            //Edit: now it returns the code, so 
            code = subject;
            h.code = code;

            //Loop through all possible ids
            groups = Object.keys(schoolClasses)
            groups.forEach(function (group) {
                g = schoolClasses[group]
                g.forEach(function (pair) {
                    if (pair.id == code){
                        h.subject = pair.name;
                    }
                })
            })
        }
    })
    return hw;
}

angular.module('homeworkJournal',[])
       .controller('TableController', function ($scope, $rootScope, $http){
            //Initilize with today's date
            $scope.displayDate = dater(Date.today());
            $scope.date = Date.today()

            //Attempt to recover config
            if (localStorage.getItem('userConfig')){
                $scope.userConfig = JSON.parse( localStorage.getItem('userConfig') );
            } else {   
                $scope.userConfig = {
                    year: schoolClasses.years[0],
                    baseClass: schoolClasses.baseClasses[0],
                    sci: schoolClasses.scienceClasses[0],
                    option4: schoolClasses.optionFours[0],
                    option6: schoolClasses.optionSixes[0],
                }
            }

            $scope.edit = function (code,subj,currentHw){
                hw = prompt ("Homework for " + subj,currentHw)

                if (hw != undefined){
                    data = {homework: hw, date: $scope.date, subj: code}

                    //Edit it!
                    $http.post('/homework/editHomework',data).then(function (res) {
                        //Refresh the table
                        $scope.pullHomework($scope.date)

                        alert ('Edited the homework successfully')
                    }, function (res) {
                        alert ('Error while editing homework')
                    });
                }
            }

            $scope.pullHomework = function (d) {
                
                //Make user config useable
                uc = {}
                keys = Object.keys($scope.userConfig)
                keys.forEach(function (k){
                    uc[k] = $scope.userConfig[k].id;
                })

                //Pull homework from server
                $http.post('/homework/getHomework', {userConfig: uc, date: d})
                     .then( function (res) {
                        $scope.homework = parseHomework(res.data,uc);
                     })
            }

            $scope.pullHomework(Date.today())

           $scope.$on('dateChange',function (event,message){
               $scope.displayDate = dater (message.date)
               $scope.date = message.date;
               $scope.pullHomework(message.date)
           })

           $scope.$on('refresh',function (e,m){
                $scope.userConfig = JSON.parse( localStorage.getItem('userConfig') );
                $scope.pullHomework($scope.date)
           })
       })
       //Navbar controller. Mostly for handling the date picker
       .controller('NavbarController', function ($scope,$rootScope){
           $scope.date = Date.today()
           $scope.dateChange = function (){
               $rootScope.$broadcast('dateChange',{date:$scope.date})
           }
       })
       .controller('ConfigController', function ($scope,$rootScope){

            //Attempt to recover config
            if (localStorage.getItem('userConfig')){
                $scope.userConfig = JSON.parse( localStorage.getItem('userConfig') );
            } else {   
                $scope.userConfig = {
                    year: schoolClasses.years[0],
                    baseClass: schoolClasses.baseClasses[0],
                    sci: schoolClasses.scienceClasses[0],
                    option4: schoolClasses.optionFours[0],
                    option6: schoolClasses.optionSixes[0],
                }
            }

            //Expose school classes to the scope
            $scope.years = schoolClasses.years;
            $scope.baseClasses = schoolClasses.baseClasses;
            $scope.scienceClasses = schoolClasses.scienceClasses;
            $scope.optionFours = schoolClasses.optionFours;
            $scope.optionSixes = schoolClasses.optionSixes;

            $scope.saveConfig = function () {
                localStorage.setItem('userConfig',JSON.stringify($scope.userConfig))
                //send the refresh signal
                $rootScope.$broadcast('refresh',{})
            }
       })