// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic'])

.run(function($ionicPlatform, $state, $rootScope) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });

  // $rootScope.myHost = 'http://192.168.1.103:8085/';
  // $rootScope.myHost = 'http://192.168.43.225:8085/';
  $rootScope.myHost = 'http://198.199.111.105:8085/';
  $state.transitionTo('login');


})

.config(['$stateProvider', function($stateProvider) {
    var main = {
            name: 'main',
            url: '/',
            templateUrl: 'templates/main.html',

        },
        status = {
            name: 'status',
            url: '/apvstatus',
            templateUrl: 'templates/apvstatus.html',
        },
        filter = {
            name: 'filter',
            url: '/filter',
            templateUrl: 'templates/filter.html',
        },
        detail = {
            name: 'detail',
            url: '/detail',
            templateUrl: 'templates/detail.html',
        },
        login = {
          name: 'login',
          url: '/login',
          templateUrl: 'templates/login.html'
        };

    $stateProvider.state(main);
    $stateProvider.state(status);
    $stateProvider.state(filter);
    $stateProvider.state(detail);
    $stateProvider.state(login);

}])

.controller('AppCtrl', function($scope, $q, $http, $state, $rootScope, $ionicActionSheet, $timeout, $ionicPopup){

  // $scope.userid = "";
  // $scope.userpass="";

  $scope.data = [];


  $scope.refreshData = function() {

        console.log('start refreshData()');

      var canceler = $q.defer();
      // $http.get($rootScope.myHost + 'approval/' + $scope.namauser, { timeout: canceler.promise })
      $http.get($rootScope.myHost + 'approval/' + 'chiara', { timeout: canceler.promise })
          .success(function(data) {
              $scope.messages = data;
          });
  };

  $scope.login = function(form) {

    //  $scope.loggedUser = form.userid;

      var canceler = $q.defer();
      $http.get($rootScope.myHost + 'login/' + form.userid + '/' + form.userpass, { timeout: canceler.promise })
          .success(function(data) {
              $scope.messages = data;
              $scope.namauser = form.userid;
              if ($scope.messages.length == 1) {

                  var today = new Date();
                  var expir = new Date(today);

                  expir.setMinutes(today.getMinutes() + 60);

                  $scope.refreshData();

                  // $cookies.put('userid', $scope.messages[0].UserCd, { 'expires': expir });
                  // $window.location.href = 'apv2.html';
                  $state.transitionTo('main');
                  // $location.path('/index.html');

                  // $scope.judul = $cookies.get('userid');
              }
              console.log($scope.messages);

              form.userid="";
              form.userpass="";


          });
  };

  $scope.selected = [];

  $scope.toggle = function(item, list) {
      var idx = list.indexOf(item);
      if (idx > -1) {
          list.splice(idx, 1);
      } else {
          // list.push(item.trno);
          list.push(item);
      }

      // console.log($scope.selected);
  };

  $scope.exists = function(item, list) {
      return list.indexOf(item) > -1;
  };

  $scope.tampilkan = function(item){
    // console.log(item.trno);
  };

  $scope.showaction = function(trno,trtpcd,deptcd) {

   // Show the action sheet
   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: 'View Details' },
       { text: 'View Approval Status' }
     ],
    //  destructiveText: 'Delete',
     titleText: 'Select an action',
    //  cancelText: 'Cancel',
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
       console.log("bottom sheet index: "+index);
       if (index==0) {
         console.log("index=0 "+trno)
         $scope.selectedTrno = trno;
         $scope.selectedTrtpcd = trtpcd;
         $scope.refreshDetail()
         $state.transitionTo("detail");
       }

       if (index==1) {
         $scope.selectedTrno = trno;
         $scope.selectedTrtpcd = trtpcd;
         $scope.selectedDeptcd = deptcd;
         $scope.refreshStatus();
         $state.transitionTo('status');
       }

       return true;
     }
   });

   // For example's sake, hide the sheet after two seconds
   $timeout(function() {
     hideSheet();
   }, 5000);

 };

 $scope.gotoLogin = function(){
    $state.transitionTo("login");
    $scope.userid="";
 };

 $scope.refreshDetail = function(item) {


     var canceler = $q.defer();
     $http.post($rootScope.myHost + 'detail/', {
             'trtpcd': $scope.selectedTrtpcd,
             'trno': $scope.selectedTrno
         })
         .success(function(data) {
             console.log(data);
             $scope.itemDetails = data;
         });
 };

 // A confirm dialog
 $scope.showConfirm = function(item) {
   var confirmPopup = $ionicPopup.confirm({
     title: 'Are you sure?',
     template: 'Approve selected item(s)'
   });

   confirmPopup.then(function(res) {
     if(res) {
       console.log('You are sure');
       $scope.doApprove(item);
     } else {
       console.log('You are not sure');
     }
   });
 };

 $scope.doApprove = function(item) {

     for (var i = 0; i < item.length; i++) {
         console.log(item[i]);
         var canceler = $q.defer();
         $http.post($rootScope.myHost + 'approve/', {
                 'trtpcd': item[i].trtpcd,
                 'lvl': item[i].lvl,
                 'trno': item[i].trno,
                 'notes': item[i].notes,
                 'userid': $scope.namauser
             })
             .success(function(data) {
                 $scope.sukses = "yes";
                 console.log('kiriman dari nodejs (approve): ' + data);
                 $scope.refreshData();
             });

     }
 };


 $scope.showPopupReturn = function(item) {
  $scope.data = {};

  // An elaborate, custom popup
  var myPopup = $ionicPopup.show({
    template: '<input type="text" ng-model="data.reason">',
    title: 'Returning selected item(s)?',
    subTitle: 'Give me a reason',
    scope: $scope,
    buttons: [
      { text: 'No' },
      {
        text: '<b>Yes</b>',
        type: 'button-positive',
        onTap: function(e) {
          if (!$scope.data.reason) {
            //don't allow the user to close unless he enters wifi password
            e.preventDefault();
          } else {
            // return $scope.data.reason;
            $scope.doReturn(item)

          }
        }
      }
    ]
  });

  myPopup.then(function(res) {
    console.log('Tapped!', res);
  });


 };

 $scope.doReturn = function(item) {

     for (var i = 0; i < item.length; i++) {
         console.log(item[i]);
         var canceler = $q.defer();
         $http.post($rootScope.myHost + 'return/', {
                 'trtpcd': item[i].trtpcd,
                 'lvl': item[i].lvl,
                 'trno': item[i].trno,
                 'notes': $scope.returnNotes,
                 'userid': $scope.namauser
             })
             .success(function(data) {
                 $scope.sukses = "yes";
                 console.log('kiriman dari nodejs (return): ' + data);
                 $scope.refreshData();
             });

     }
 };

 $scope.showPopupReject = function(item) {
  $scope.data = {};

  // An elaborate, custom popup
  var myPopup = $ionicPopup.show({
    template: '<input type="text" ng-model="data.reason">',
    title: 'Rejecting selected item(s)?',
    subTitle: 'Give me a reason',
    scope: $scope,
    buttons: [
      { text: 'No' },
      {
        text: '<b>Yes</b>',
        type: 'button-positive',
        onTap: function(e) {
          if (!$scope.data.reason) {
            //don't allow the user to close unless he enters wifi password
            e.preventDefault();
          } else {
            // return $scope.data.reason;
            $scope.doReject(item)

          }
        }
      }
    ]
  });

  myPopup.then(function(res) {
    console.log('Tapped!', res);
  });


 };


 $scope.doReject = function(item) {

     for (var i = 0; i < item.length; i++) {
         console.log(item[i]);
         var canceler = $q.defer();
         $http.post($rootScope.myHost + 'reject/', {
                 'trtpcd': item[i].trtpcd,
                 'lvl': item[i].lvl,
                 'trno': item[i].trno,
                 'notes': $scope.rejectNotes,
                 'userid': $scope.namauser
             })
             .success(function(data) {
                 $scope.sukses = "yes";
                 console.log('kiriman dari nodejs (reject): ' + data);
                 $scope.refreshData();

             });

     }
 };

 $scope.refreshStatus = function() {

     var canceler = $q.defer();
     $http.post($rootScope.myHost + 'status/', {
             'trno': $scope.selectedTrno,
             'trtpcd': $scope.selectedTrtpcd,
             'deptcd': $scope.selectedDeptcd
         })
         .success(function(data) {
             $scope.approvalStatus = data;
         });

 };


})
