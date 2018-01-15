function dater (d){
    return d.toString('dddd') + ' the ' + d.toString('dS of MMMM')
}


schoolYears = [
    {name: '1st year', id: '1'},
    {name: '2nd year', id: '2'},
    {name: '3rd year', id: '3'},
    {name: 'TY', id: '4'},
    {name: '5th year', id: '5'},
    {name: '6th year', id: '6'},
]

haveShownAlert = false;

/* START DEFINE CLASSES */
schoolClasses = {
            baseClasses: [
                {name: 'da Vinci', id: 'daVinci'}
            ],

            scienceClasses: [
                {name: 'Science - Leona (3.1)', id: '3.1'},
            ],

            option1s: [
                {name: 'T.G. - Paddy C', id: '4.1'},
            ],

            option2s: [
                {name: 'T.G. - Adrian C', id: '6.1'},
            ]
}
/* END DEFINE CLASSES */


//This takes internal class codes and turns them into capatilized names
function parseHomework (hw,uc){
    hw.forEach(function (h) {

        //Wiki style: show the most recent contribution
        contributors = Object.keys(h.homework)
        contributors.sort(function (a,b) {
            aDate = h.homework[a].date;
            bDate = h.homework[b].date;

            if (aDate < bDate) {
                return 1;
            }
            if (aDate > bDate) {
                return -1;
            }
            if (aDate == bDate) {
                return 0;
            }      
        });

        //before we override it, create a backup oldHomework object in order
        a = {}
        contributors.forEach(function (c) {
            a[c] = h.homework[c];
        })

        h.oldHomework = a;
        
        if (h.homework[contributors[0]]) {
           h.homework = h.homework[contributors[0]].homework;
        }
    

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
            groups = Object.keys(window.schoolClasses)
            groups.forEach(function (group) {
                g = window.schoolClasses[group]
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
        //Make sure our requests have the auth code
       .config(function ($httpProvider) {
            $httpProvider.defaults.withCredentials = true;
            //rest of route code
        })
       .service('ServerService', function ($http){
            this.pullHomework = function (d,userConfig,cb) {
                //Make user config useable
                uc = {}
                keys = Object.keys(userConfig)
                keys.forEach(function (k){
                    uc[k] = userConfig[k].id;
                })

                //Pull homework from server
                $http.post('/homework/getHomework', {userConfig: uc, date: d})
                     .then( function (res) {
                        cb(res.data,uc)
                     })
            }

            this.getYearClasses = function (num,cb){
                $http.get('/year/?number=' + num)
                     .then(function (res) {
                        //0, as number should be unique!
                        cb(res.data[0])
                     })
            }
        })
       .service('ConfigService', function () {
           this.getUserConfig = function () {
                //Attempt to recover config
                if (localStorage.getItem('userConfig')){
                    return JSON.parse( localStorage.getItem('userConfig') );
                } else {

                    if (!haveShownAlert){
                        haveShownAlert = true;
                        setTimeout(function (){
                            bootbox.alert('Hi! If this is your first time, please tell me what classes you have by clicking the "Settings" button.')
                        },200);
                    }

                    return {
                        year: schoolYears[0],
                        baseClass: schoolClasses.baseClasses[0],
                        sci: schoolClasses.scienceClasses[0],
                        option1: schoolClasses.option1s[0],
                        option2: schoolClasses.option2s[0],
                    }
                }
           }
       })
       .controller('TableController', function ($scope, $rootScope, $http, ServerService, ConfigService){

            $scope.userConfig = ConfigService.getUserConfig()
            
            //Initilize with today's date
            $scope.displayDate = dater(Date.today());
            $scope.date = Date.today()

            $scope.edit = function (item){

                code = item.code;
                subj = item.subject;
                currentHw = item.homework;

                bootbox.prompt ({
                    title: "Enter homework for " + subj,
                    size: 'small',
                    value: currentHw,
                    callback: function (res){
                        if (res != null){

                            data = {homework: res, date: $scope.date, subj: code}
                            //Edit it!
                            $http.post('/homework/editHomework',data).then(function (res) {
                                //Refresh the table
                                setTimeout(function (){
                                    $scope.pullHomework($scope.date)
                                },100)
                            }, function (res) {
                                bootbox.alert ('Error while editing homework')
                            });
                        }
                    }
                })
            }

            $scope.setModal = function (m) {
                $scope.modalSelected = m;
            }

            $scope.pullHomework = function (d) {
                ServerService.pullHomework(d,$scope.userConfig,function (hw,uc){
                    $scope.homework = parseHomework(hw,uc);
                })
            }

            
            //Make sure schoolClasses have loaded
            setTimeout(function () {
                $scope.pullHomework(Date.today())
            },100);

            $scope.$on('dateChange',function (event,message){
                $scope.displayDate = dater (message.date)
                $scope.date = message.date;
                $scope.pullHomework(message.date)
            })

            $scope.$on('refresh',function (e,m){
                    $scope.userConfig = ConfigService.getUserConfig()
                    $scope.pullHomework($scope.date)
            })
        })
       //Navbar controller. Mostly for handling the date picker
       .controller('NavbarController', function ($scope, $rootScope, ConfigService){
           $scope.date = Date.today()

           $scope.userConfig = ConfigService.getUserConfig()

           $scope.$on('refresh', function (e) {
               $scope.userConfig = ConfigService.getUserConfig()
           })

           $scope.dateChange = function (){
               $rootScope.$broadcast('dateChange',{date:$scope.date})
           }
       })
       .controller('ConfigController', function ($scope, $rootScope, ServerService, ConfigService){

            $scope.userConfig = ConfigService.getUserConfig()

            //Load year classses from server
            ServerService.getYearClasses($scope.userConfig.year.id, function (yearInfo) {
                //window.schoolClasses = yearInfo;
                window.schoolClasses.baseClasses = yearInfo.baseClasses;
                window.schoolClasses.scienceClasses = yearInfo.scienceClasses;
                window.schoolClasses.option1s = yearInfo.option1s;
                window.schoolClasses.option2s = yearInfo.option2s;

                //Expose school classes to the scope
                $scope.years = schoolYears;
                $scope.baseClasses = schoolClasses.baseClasses;
                $scope.scienceClasses = schoolClasses.scienceClasses;
                $scope.option1s = schoolClasses.option1s;
                $scope.option2s = schoolClasses.option2s;
            
            });

            $scope.onYearChange = function () {
                //Load year classses from server
                ServerService.getYearClasses($scope.userConfig.year.id, function (yearInfo) {
                    //window.schoolClasses = yearInfo;
                    window.schoolClasses.baseClasses = yearInfo.baseClasses;
                    window.schoolClasses.scienceClasses = yearInfo.scienceClasses;
                    window.schoolClasses.option1s = yearInfo.option1s;
                    window.schoolClasses.option2s = yearInfo.option2s;

                    $scope.userConfig = {
                        year: $scope.userConfig.year,
                        baseClass: schoolClasses.baseClasses[0],
                        sci: schoolClasses.scienceClasses[0],
                        option1: schoolClasses.option1s[0],
                        option2: schoolClasses.option2s[0],
                    }

                    //Expose school classes to the scope
                    $scope.years = schoolYears;
                    $scope.baseClasses = schoolClasses.baseClasses;
                    $scope.scienceClasses = schoolClasses.scienceClasses;
                    $scope.option1s = schoolClasses.option1s;
                    $scope.option2s = schoolClasses.option2s;

                    $scope.saveConfig()

                });
            }


            $scope.saveConfig = function () {
                localStorage.setItem('userConfig',JSON.stringify($scope.userConfig))
                //send the refresh signal
                $rootScope.$broadcast('refresh',{})
            }
       })
       .controller('KudosController', function ($scope, $http){
           $http.get('/kudos/getTopThree').then (function (res) {
                $scope.topThree = res.data;
           })
       })