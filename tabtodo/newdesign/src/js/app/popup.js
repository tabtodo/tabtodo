
myApp.service('pageInfoService', function() {
    this.getInfo = function(callback) {
        var model = {};

        chrome.tabs.query({'active': true},
        function (tabs) {
            if (tabs.length > 0)
            {
                model.title = tabs[0].title;
                model.url = tabs[0].url;

                chrome.tabs.sendMessage(tabs[0].id, { 'action': 'PageInfo' }, function (response) {
                    model.pageInfos = response;
                    callback(model);
                });
            }

        });
    };
});


myApp.service('tabsStorageService', function () {
    this.saveTabs = function (tabsList) {
        chrome.storage.sync.set({'tabsList': tabsList}, function() {
          // Notify that we saved.
          //message('Settings saved');
        });
    }

    this.getTabs = function (callback){
        chrome.storage.sync.get('tabsList', function (value) {
            if (value && value.tabsList)
                callback(value.tabsList);
            callback(null);
        })

    }

});


myApp.service('tabsInfoService', function() {

    this.changeTab = function (tabId) {
        chrome.tabs.update(tabId, {selected: true});
    };

     this.closeTab = function (tabId) {
        chrome.tabs.remove(tabId, function () {})
    };

    this.renameTab = function(tabID, setTitle) {
    chrome.extension.sendMessage(
        {to:"background", relTabID:tabID, title:setTitle});
    }

    this.getCurrentTab = function(tabCallback) { 
        chrome.tabs.query(
            { currentWindow: true, active: true },
            function (tabArray) { tabCallback(tabArray[0]); }
        );
    }

    chrome.extension.onMessage.addListener(
        function(request,sender,sendResponse) {
            if (request.to == "background") {
                activateLock(request.title, request.relTabID);
            }
        }
) ;
    this.getTabsInfo = function(callback) {
        
        var reponseArray = [];

        chrome.tabs.query(new Object() ,
        function (tabs) {
            for (var i=0;i<tabs.length;i++)
            {
                var model = {};
                model.type = 'tab';
                model.title = tabs[i].title;
                model.url = tabs[i].url;
                model.favIconUrl = tabs[i].favIconUrl;
                model.tabId = tabs[i].id;
                
                
                chrome.tabs.sendMessage(tabs[i].id, { 'action': 'PageInfo' }, function (response) {
                    model.pageInfos = response;
                });

                reponseArray.push(model);
            }
            callback(reponseArray);
        });
    };   
});


myApp.controller("PageController", function ($scope, pageInfoService, tabsInfoService, tabsStorageService) {

    $scope.tasksArray = [];
        
    $scope.editorEnabled = false;
    $scope.title = 'title';
    $scope.message = "TabToDo First demo";

    
   
    $scope.changeTabPage = function (tabId){
        tabsInfoService.changeTab(tabId);

    };

    $scope.closeTabPage = function (tabId, index){
        // get current tab
        // tabsInfoService.getCurrentTab(function (tab) {
        //     if (tab.id = tabId)
        //     {
        //         // need to change tab.
        //         // check if next tab is avialabe.
        //         if ($scope.content[index +1]) {
        //             $scope.changeTabPage($scope.content[index +1].tabId);
        //         } else if ($scope.content[0]) {
        //             $scope.changeTabPage($scope.content[0].tabId);
        //         } // else no other tabs - so we will close as well
        //     }
        // });

        // remove from list
        $scope.content.splice(index,1);
        // close teh tab
        tabsInfoService.closeTab(tabId);
    };

    $scope.makeTaskPage = function (tabId, index){
        // change state
        $scope.content[index] = changeState($scope.content[index], "openTask");
        saveTasksArray(index);
    };

    //unTabPage
    $scope.untaskTabPage = function (tabId, index){
        // change state
        $scope.content[index] = changeState($scope.content[index], "tab");
        saveTasksArray(index);
    };

    $scope.completeTaskPage = function (tabId, index){
        // change state
        $scope.content[index] = changeState($scope.content[index], "completeTask");
        saveTasksArray(index);
    };

    $scope.renameTabPage = function (tabId, index) {
        debugger;
        $scope.content[index].editing = false;

        if ($scope.tasksArray[''+$scope.content[index].tabId])
        {
            console.log("active task");
            $scope.tasksArray[''+$scope.content[index].tabId].title =  $scope.content[index].title;
            saveTasksArray(index);
        }

        tabsInfoService.renameTab(tabId, $scope.content[index].title);
    }

    $scope.changeDueTaskPage = function (tabId){
        // change state
        alert(tabId);
    };

    function saveTasksArray(index) {
        $scope.tasksArray[''+$scope.content[index].tabId] = $scope.content[index];
        
        tabsStorageService.saveTabs($scope.tasksArray);
    }

    function changeState(tabItemModel, newState){
            var model = {};
                model.type = newState;
                model.title = tabItemModel.title;
                model.url = tabItemModel.url;
                model.favIconUrl = tabItemModel.favIconUrl;
                model.tabId = tabItemModel.tabId;
            return model;
    };



    pageInfoService.getInfo(function (info) {
        $scope.title = info.title;
        $scope.url = info.url;
        $scope.pageInfos = info.pageInfos;
        
        $scope.$apply();
    });
    $scope.testLoad = function () {
        debugger;

        tabsStorageService.getTabs(function (storageTabInfos){
            console.log(storageTabInfos);
        });
    }

    $scope.testSave = function () {
        debugger;
        console.log("Saving tasks array : "+ tasksArray);
        tabsStorageService.saveTabs(tasksArray);
        //};
    }


    $scope.reload = function () {
      //  alert('reload');
        var tasksArray;
        tabsStorageService.getTabs(function (storageTabInfos){
            if (storageTabInfos){
                tasksArray = storageTabInfos;
            }
            tabsInfoService.getTabsInfo(function (tabsInfos) {
                if (tasksArray)
                {
                    var found=false;
                    for (var i=0;i<tabsInfos.length;i++) {
                        
                         var tabId = tabsInfos[i].tabId;
                         if (tasksArray[tabId]){
                             console.log("found tab in stroage array");
                             console.log(tasksArray[tabId]);
                             tabsInfos[i] = tasksArray[tabId];
                             found = true;
                         }
                    }

                    if (found)
                       $scope.tasksArray =  tasksArray;
                    else
                       $scope.tasksArray = [];
                }

                $scope.content = tabsInfos;

                $scope.$apply();
                
            });    
        });

    };
    $scope.getTabsInfo = (function () {
        // We get tasks info from storage.
        
        $scope.reload();
        
    })();
    
    function findTab(tabId) {
        //search array for key
        var items = $scope.content;
        for(var i = 0; i < items.length; ++i) {
            //if the name is what we are looking for return it
            if(items[i].tabId === tabId)
                return items[i];
        }
    }
   
});

myApp.directive('contentItem', function ($compile) {

    var contentTitle = '<span ng-hide="content.editing">{{content.title}}<a ng-hide="content.editing" class="inline" href="#" ng-click="content.editing = true" title="rename tab"><img src="img/edit-icon.png" /></a></span><span ng-show="content.editing"><input ng-model="content.title" ng-enter="renameTab({tabToChange:content.tabId}) style="vertical-align:middle;" /><a class="inline" href="#" ng-click="renameTab({tabToChange:content.tabId})">Done editing?</a></span>'
    var closeButton = '<span class="closeTab" ng-click="closeTab({tabToChange:content.tabId})" title="Close this tab"><img src="img/x.png" /> </span>';
    var untaskButton = '<span class="closeTab" ng-click="untaskTab({tabToChange:content.tabId})" title="un-task"><img src="img/undo-icon.png" /> </span>';
    var makeTaskButton = '<button class="btn btn-primary btn-small" ng-click="makeTask({tabToChange:content.tabId})">Make task</button>';
    var completeTaskButton = '<input type="checkbox" ng-click="completeTask({tabToChange:content.tabId})" title="Mark as Done" style="cursor:pointer; vertical-align:middle;">';
    var reopnTaskButton = '<input type="checkbox" ng-click="makeTask({tabToChange:content.tabId})" checked title="Reopen task" style="cursor:pointer; vertical-align:middle;">';
    //var linkTabTemplate = '<a href="#" ng-click="changeTab({tabToChange:content.tabId})"><span class="listItemThumnail"><img ng-src={{content.favIconUrl}} style="height: 20px; vertical-align:middle;" /></span><span class="listItemTitle" title={{content.title}} > {{content.title}}</span></a>'
    var linkTabTemplate = '<a href="#" ng-click="changeTab({tabToChange:content.tabId})"><span class="listItemThumnail"><img ng-src={{content.favIconUrl}} style="height: 20px; vertical-align:middle;" /></span><span class="listItemTitle" title={{content.title}} >'+ contentTitle+'</span></a>';
    //var datePicker= '<timepicker ng-model="content.duetime" ng-change="changeDue({tabToChange:content.duetime})"></timepicker>';
    var datePicker= '<input type="text" size="8" ng-model="content.duetime" name="time" bs-timepicker data-time-format="HH:mm" data-length="1" data-minute-step="1" data-arrow-behavior="picker">';
    

    var tabTemplate = '<li><span class="listItemButtons">'+ makeTaskButton + closeButton + '</span>' + linkTabTemplate +'</li>';
    var highlightedTabTemplate = '<li class="active"><span class="listItemButtons">'+ makeTaskButton + closeButton + '</span>' + linkTabTemplate +'</li>';
    var openTaskTemplate = '<li class="task"><span class="listItemButtons">' + completeTaskButton + untaskButton +'</span>' + linkTabTemplate +'</li>';
    var completeTaskTemplate = '<li class="completeTask"><span class="listItemButtons">' + reopnTaskButton + closeButton + '</span>' + linkTabTemplate +'</li>';

    var getTemplate = function(contentType) {
        var template = '';
        console.log("setting from teplate"+ contentType);
        switch(contentType) {
            case 'tab':
                template = tabTemplate;
                break;
            case 'highlightedTab':
                templte = highlightedTabTemplate;
                break;
            case 'openTask':
                template = openTaskTemplate;
                break;
            case 'completeTask':
                template = completeTaskTemplate;
                break;
        }

        return template;
    };

    var linker = function(scope, element, attrs) {
        //scope.rootDirectory = 'images/';
        element.html(getTemplate(scope.content.type)).show();
        
        $compile(element.contents())(scope);

        
    }

     return {
        restrict: "E",
        link: linker,
        scope: {
            content:'=',
            changeTab:'&',
            closeTab:'&',
            makeTask:'&',
            untaskTab:'&',
            completeTask:'&',
            changeDue:'&',
            renameTab:'&'
        }
        
       
        
    };
});

myApp.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});





