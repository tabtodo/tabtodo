// Standard Google Universal Analytics code
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-61679448-2']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();



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
    
    this.getTabs = function (callback){
        chrome.storage.sync.get('tabsList', function (value) {
            if (value && value.tabsList)
                callback(value.tabsList);
            else
            callback(null);
        })

    }
    this.saveTabs = function (tabsList) {
        chrome.storage.sync.set({'tabsList': tabsList}, function() {
          // Notify that we saved.
          //message('Settings saved');
        });
    }

    this.getClosedTabs = function (callback){
        chrome.storage.sync.get('closedTabsList2', function (value) {
            if (value && value.closedTabsList2)
                callback(value.closedTabsList2);
            else
                callback(null);
        })
    }



    this.saveClosedTasks = function (tabsList) {
        chrome.storage.sync.set({'closedTabsList2': tabsList}, function() {
          // Notify that we saved.
          //message('Settings saved');
        });
    }

    this.getUnCompletedClosedTasks = function (callback){
        chrome.storage.sync.get('unCompletedclosedTabsList2', function (value) {
            if (value && value.closedTabsList2)
                callback(value.closedTabsList2);
            else
                callback(null);
        })
    }

    this.saveUnCompletedClosedTasks = function (tabsList) {
        chrome.storage.sync.set({'unCompletedclosedTabsList2': tabsList}, function() {
          // Notify that we saved.
          //message('Settings saved');
        });
    }//saveUnCompletedClosedTasks
    
    this.getSettings = function (callback) {
        chrome.storage.sync.get('tabtodoSettings' , function (value) {
          if (value && value.tabtodoSettings)
                callback(value.tabtodoSettings);
            else
            callback(null);  
        })
    }

    this.showTutorial = function(showTutorialFlag) {
        chrome.storage.sync.get('tutorialShowned' , function (value) {
          if (value && value.tutorialShowned)
          {
            console.log("tutorial Already showed");
            showTutorialFlag(false);
            }
          else {
            console.log("tutorial new");
            chrome.storage.sync.set({'tutorialShowned': true}, function() {
          
            });
            showTutorialFlag(true);
          }  
        });   
    }

    this.saveSettings = function (tabtodoSettings) {
        chrome.storage.sync.set({'tabtodoSettings': tabtodoSettings}, function() {
          // Notify that we saved.
          //message('Settings saved');
        });
    }

});

myApp.factory('settingsFactory', ['tabsStorageService' ,function (tabsStorageService) {
    var settings = new Object();
    return {
        initSettingsObject : function () {
            tabsStorageService.getSettings(function (settingsCallback) {
                if (settingsCallback) {
                    settings = settingsCallback;
                    console.log("loading settings from object");
                    console.log(settings);

                }
                else { // set defaultvalues
                    console.log("loading settings from default");
                    settings.autoSortTabs =  false;
                    settings.autoCloseCompletedTask =  false;
                    settings.showCloseCompletedTask= true;
                    settings.showCloseUnCompletedTask=  true;
                    settings.showClosedTaskFor= 86400000;
                }
            });
        },
        getSettings: function () {
            return settings;
        },

        saveSettings : function (newSettings) {
            settings = newSettings;
            console.log("saving values to");
            console.log(settings);
            tabsStorageService.saveSettings(settings);
            } 

    };
}]);


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

    this.moveTab = function(tabId, tabIndex) {
        chrome.tabs.move(tabId, { index: tabIndex},  function () {})
    }

    this.getCurrentTab = function(tabCallback) { 
        chrome.tabs.query(
            { currentWindow: true, active: true },
            function (tabArray) { tabCallback(tabArray[0]); }
        );
    }
     this.refreshTab = function(tabCallback) { 
        // remove popup by selecting the tab
     
        chrome.tabs.query(
            { currentWindow: true, active: true },
            function (tab) { 
                chrome.tabs.update(tab[0].id, {selected: true});
             }
        );
    }


    this.moveTab = function(tabId, newIndex) {
        chrome.tabs.move(tabId, {index:newIndex}, function () {});

    }

    this.createTab = function(tabUrl) {
        chrome.tabs.create({ url : tabUrl }, function () {});
    }

    chrome.extension.onMessage.addListener(
        function(request,sender,sendResponse) {
            if (request.to == "background") {
                activateLock(request.title, request.relTabID);
            }
        }
    );


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
                //console.log("faviconis: "+tabs[i].favIconUrl);
                if (model.favIconUrl === "")
                {
                    // use our default image
                    model.favIconUrl = 'http://tabtodo.com/images/tabtodo.png';
                }
                model.tabId = tabs[i].id;
                model.originalIndex = i;
                model.editing = false;
                
                chrome.tabs.sendMessage(tabs[i].id, { 'action': 'PageInfo' }, function (response) {
                    model.pageInfos = response;
                });

                reponseArray.push(model);
            }
            callback(reponseArray);
        });
    };   
});


myApp.controller("PageController", function ($scope, $timeout, ngDialog, pageInfoService, tabsInfoService, tabsStorageService , settingsFactory) {

    $scope.tasksArray = [];
    $scope.closedTabArray = [];
    $scope.hasClosedCompletedTabs = false;

    $scope.closedUnCompletedTabArray = [];
    $scope.hasClosedUnCompletedTabs = false;

    $scope.editorEnabled = false;
  
    settingsFactory.initSettingsObject();
    
    
    $scope.sortableOptions = {
        stop: function(e, ui) {
          var item = ui.item.scope().item;
          var toIndex = ui.item.index();
          tabsInfoService.moveTab(item.tabId, toIndex);
        }
    };

   
   $scope.IsCompletedInSettings = function () {
        return settingsFactory.getSettings().showCloseCompletedTask;
   };

   $scope.IsUnCompletedInSettings = function () {
        return settingsFactory.getSettings().showCloseUnCompletedTask;
   };


   
    $scope.changeTabPage = function (tabId){
        tabsInfoService.changeTab(tabId);

    };

    $scope.closeTabPage = function (tabId, index){
        
        // check if completed task.
        if ($scope.content[index].type == 'completeTask')
        {
            //86400000
            var task = $scope.content[index];
            task.closedDate = Date.now();

            $scope.closedTabArray.push(task);    
            saveClosedTasks();
            $scope.hasClosedCompletedTabs = true;
        }

        if ($scope.content[index].type == 'openTask') {
            var task = $scope.content[index];
            
            $scope.closedUnCompletedTabArray.push(task);    
            saveClosedTasks();
            $scope.hasClosedUnCompletedTabs = true;
        }

        // remove from list
        $scope.content.splice(index,1);
        // close teh tab
        tabsInfoService.closeTab(tabId);
    };


    $scope.makeTaskPage = function (tabId, index){
        // change state
        $scope.content[index] = changeState($scope.content[index], "openTask");
        saveTasksArray(index);
        
        // var element = $scope.content[index];
        // $scope.content.splice(index, 1);
        // $scope.content.splice(0, 0, element);
        // tabsInfoService.moveTab(tabId, 0);

        
    };

    //unTabPage
    $scope.untaskTabPage = function (tabId, index){
        // change state
        $scope.content[index] = changeState($scope.content[index], "tab");
        saveTasksArray(index);

        //move logic
        // var element = $scope.content[index];
        // var originalIndex = element.originalIndex;
        // $scope.content.splice(index, 1);
        // $scope.content.splice(originalIndex, 0, element);
        // tabsInfoService.moveTab(tabId, originalIndex);

        
    };

    $scope.completeTaskPage = function (tabId, index){
        // change state
        $scope.content[index] = changeState($scope.content[index], "completeTask");
        $scope.content[index].closedDate = Date.now();
        saveTasksArray(index);
        if (settingsFactory.getSettings().autoCloseCompletedTask){
            $scope.closeTabPage(tabId, index);
        }
    };

    $scope.renameTabPage = function (tabId, index) {
        
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

    function saveClosedTasks(){
        tabsStorageService.saveClosedTasks($scope.closedTabArray);
        tabsStorageService.saveUnCompletedClosedTasks($scope.closedUnCompletedTabArray);
    }

    function changeState(tabItemModel, newState){
            var model = {};
                model.type = newState;
                model.title = tabItemModel.title;
                model.url = tabItemModel.url;
                model.favIconUrl = tabItemModel.favIconUrl;
                model.tabId = tabItemModel.tabId;
                model.originalIndex = tabItemModel.index;
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

    $scope.clearCompletedTask = function(index) {
        var tabTask = $scope.closedTabArray[index];
        // remove it from the task array if exists
        if ($scope.tasksArray[tabTask.tabId]) {
            console.log("removing from task array");
            $scope.tasksArray.splice(tabTask.tabId, 1);
        }
        
        tabsStorageService.saveTabs($scope.tasksArray);
        $scope.closedTabArray.splice(index, 1);
        saveClosedTasks();

        if ($scope.closedTabArray.length == 0)
        {
            $scope.hasClosedCompletedTabs = false;
        }
    }

    $scope.clearUnCompletedTask = function(index) {
        // we need to remove it from the task list to prevent it from reoccuring
        var tabTask = $scope.closedUnCompletedTabArray[index];
        if ($scope.tasksArray[tabTask.tabId]) {
            console.log("removing from task array");
            $scope.tasksArray.splice(tabTask.tabId, 1);
        }
        tabsStorageService.saveTabs($scope.tasksArray);
        
        $scope.closedUnCompletedTabArray.splice(index, 1);
        
        saveClosedTasks();
        if ($scope.closedUnCompletedTabArray.length == 0)
        {
            $scope.hasClosedUnCompletedTabs = false;
        }
    }

    $scope.reopenClosedTab = function(index, completedTask) {
        
        $scope.clearCompletedTask(index);
        tabsInfoService.createTab(completedTask.url);

    }

    $scope.reopenClosedUnCopletedTab = function(index, completedTask) {
        
        $scope.clearUnCompletedTask(index);
        tabsInfoService.createTab(completedTask.url);

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
                    var newTaskArray = [];
                    var found=false;
                    for (var i=0;i<tabsInfos.length;i++) {
                        
                         var tabId = tabsInfos[i].tabId;
                         if (tasksArray[tabId]){
                             console.log("found tab in stroage array");
                             console.log(tasksArray[tabId]);
                             tabsInfos[i] = tasksArray[tabId];
                             // we regenrate the task array inorder to remove old closed tabs
                             newTaskArray[tabId] = tasksArray[tabId];
                             found = true;
                         }
                    }
                    var dayBeforeTime = Date.now() - settingsFactory.getSettings().showClosedTaskFor ;  
                    tasksArray.forEach(function (task) {
                        if (task && !newTaskArray[task.tabId]) {
                            
                       
                            if (!IsExistsInListTab($scope.closedTabArray, task.tabId) && task.closedDate && dayBeforeTime< task.closedDate) {
                                console.log("found completed task to show");
                                console.log(task);
                                $scope.closedTabArray.push(task);
                                $scope.hasClosedCompletedTabs = true;
                                saveClosedTasks();
                            }
                            // This means that the uncompleted task was closed 
                            // We just check if it wasn't because already in the lists
                            else if (!IsExistsInListTab($scope.closedTabArray, task.tabId) && !IsExistsInListTab($scope.closedUnCompletedTabArray, task.tabId)) {
                                console.log("found uncompleted task to show");
                                console.log(task);
                                $scope.closedUnCompletedTabArray.push(task);
                                $scope.hasClosedUnCompletedTabs = true;
                                saveClosedTasks();
                            }


                        }
                     });

                    if (found)
                       $scope.tasksArray =  newTaskArray;
                    else
                       $scope.tasksArray = [];


                }

                $scope.content = tabsInfos;

                $scope.$apply();
                
            });    
        });
        
           // get Closed tabs
        tabsStorageService.getClosedTabs(function (closedTabsInfos) {
            var tasksArray;
            debugger;
             if (closedTabsInfos){
                 tasksArray = closedTabsInfos;
                 //3600000 - `1 hour
                 //86400000 - 24 hours
                 // 604800000 - one week
                var dayBeforeTime = Date.now() - settingsFactory.getSettings().showClosedTaskFor ;  

                for (var i=0;i<tasksArray.length;i++) {
                    var tabId = tasksArray[i].tabId;
                    if (tasksArray[i].closedDate > dayBeforeTime) {
                        $scope.closedTabArray.push(tasksArray[i]);
                        //$scope.closedTabArray[''+tasksArray[i].tabId]= tasksArray[i];
                        $scope.hasClosedCompletedTabs = true;
                    }        
                }

            }
        });
       

    };

    $scope.getTabsInfo = (function () {
        // We get tasks info from storage.
        
        $scope.reload();
        


    })();
    
    tabsStorageService.showTutorial(function (showTutorial) {
        if (showTutorial) {
              // See if tutorial was not loaded and load it for the first time
            $timeout(function() {
                ngDialog.open({ 
                    template: 'tut.html',
                    className: 'ngdialog-theme-plain', 
                    controller: 'settinsContoller'

                });
            }, 700);
        }
    });
  
        
    function findTab(tabId) {
        //search array for key
        var items = $scope.content;
        for(var i = 0; i < items.length; ++i) {
            //if the name is what we are looking for return it
            if(items[i].tabId === tabId)
                return items[i];
        }
    }

    function IsExistsInListTab(list,tabId) {
        //search array for key
        if (list)
        {
            for(var i = 0; i < list.length; ++i) {
                //if the name is what we are looking for return it
                if(list[i] && list[i].tabId === tabId)
                    return true;
            }
        }
        return false;
    };
   
});

myApp.directive('contentItem', function ($compile) {
    var closeButton='';
    
    var undoTaskButton= '<button  ng-class="{\'add icon-return\' : !editing, \'add icon-return none\' : editing}" title="Un-Task" ng-click="untaskTab({tabToChange:content.tabId})"></button>';
    var addTaskButton = '<button ng-class="{\'add icon-add\' : !editing, \'add icon-add none\' : editing}" title="Add a Task" ng-click="makeTask({tabToChange:content.tabId})"></button>';
    var closeButton = '<button class="close icon-close" ng-click="closeTab({tabToChange:content.tabId})" title="Close Tab"></button>';
    //var editNameButton = '<button class="edit icon-edit"></button><button class="edit icon-tick none" ng-click="renameTab({tabToChange:content.tabId})"></button>';
    var editNameButton = '<button ng-class="{\'edit icon-edit none\' : editing , \'edit icon-edit\' : !editing}" ng-click="editing = true" title = "Rename Tab"></button><button ng-class="{\'edit icon-tick\' : editing, \'edit icon-tick none\' : !editing}" ng-click="editing = false ; renameTab({tabToChange:content.tabId})" title="Done"></button>';

    var tabLink = '<span ng-click="changeTab({tabToChange:content.tabId})"><span><img ng-src="{{content.favIconUrl}}" class="tab_favicon" alt=""></span><span><span ng-class="{\'none\' : editing}"><p class="tab_link">{{content.title}}</p></span><input ng-model="content.title" ng-enter="editing = false ; renameTab({tabToChange:content.tabId})" ng-class="{\'tab_link_rename block width358px\' : editing, \'tab_link_rename\' : !editing }" type="text" placeholder="{{content.title}}" focus-me="editing" autofocus></span></span>';
    var tabActions = '<span ng-class="{\'tab_actions\' : !editing, \'tab_actions width72px\' : editing} ">' + closeButton +editNameButton + addTaskButton+'</span>';
    var taskTabActions = '<span ng-class="{\'tab_actions tasked\' : !editing, \'tab_actions tasked width72px\' : editing} ">' + closeButton +editNameButton + undoTaskButton+'</span>';

    var tabTemplate = tabLink + tabActions;
    var taskTempalte = '<span class="check_uncheck Xplus6px"><button class="uncheck icon-tick"></button><div class="check"  ng-click="completeTask({tabToChange:content.tabId})" title="Complete Task"></div></span>'+tabLink + taskTabActions;
    var completeTempalte = '<span class="check_uncheck Xplus6px check_background"><button class="uncheck icon-tick visible"></button><div class="check hidden" ng-click="makeTask({tabToChange:content.tabId})" title="Reopen"></div></span>'+tabLink + taskTabActions;
    
    var getTemplate = function(contentType) {
        var template = '';
        console.log("setting from teplate"+ contentType);
        switch(contentType) {
            case 'tab':
                template = tabTemplate;
                break;
            case 'openTask':
                template = taskTempalte;
                break;
            case 'completeTask':
                template = completeTempalte;
                break;
            case 'closedCompleteTask':
                template = completeTempalte;
                break;
        }

        return template;
    };

    var linker = function(scope, element, attrs) {
        //scope.rootDirectory = 'images/';
        element.html(getTemplate(scope.content.type)).show();
        
        $compile(element.contents())(scope);

        element.on('mouseenter', function() {
            if ($(this).find(".tab_actions").hasClass("tasked")) {
                    $(this).find(".check_uncheck, img, p, input").toggleClass("Xplus48px");
                    $(this).find("p").toggleClass("width-minus-54px");
                    $(this).find("input").toggleClass("width-minus-54px");
                }

            });

        element.on('mouseleave', function() {
                
                if ($(this).find(".tab_actions").hasClass("tasked")) {
                    $(this).find(".check_uncheck, img, p").toggleClass("Xplus48px");
                    $(this).find("p").toggleClass("width-minus-54px");
                }
            });


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
            renameTab:'&',

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

myApp.directive('focusMe', function($timeout, $parse) {
  return {
    //scope: true,   // optionally create a child scope
    link: function(scope, element, attrs) {
      var model = $parse(attrs.focusMe);
      scope.$watch(model, function(value) {
        if(value === true) { 
          $timeout(function() {
            element[0].focus(); 
          });
        }
      });
      // to address @blesh's comment, set attribute value to 'false'
      // on blur event:
      element.bind('blur', function() {
         scope.$apply(model.assign(scope, false));
      });
    }
  };
});



myApp.controller("settinsContoller" ,  function($scope, settingsFactory, ngDialog, tabsStorageService) {
    
    $scope.settingsObject  = settingsFactory.getSettings();

    $scope.currentTutIndex = 1;

    $scope.GetNext = function () {

        $scope.currentTutIndex =  $scope.currentTutIndex +1 ;        
    }

    $scope.GetPrev = function () {
        $scope.currentTutIndex =  $scope.currentTutIndex -1;        
    }

    $scope.Save = function () {
        settingsFactory.saveSettings($scope.settingsObject);
    }
    /* settings.autoSortTabs =  false;
    settings.autoCloseCompletedTask =  false;
    settings.showCloseCompletedTask= true;
    settings.showCloseUnCompletedTask=  true;
    settings.showClosedTaskFor= 0;*/
  

    $scope.enterValidation = function(){
        return true;
    };

    $scope.exitValidation = function(){
        return true;
    };
     $scope.finished = function() {
            alert("Wizard finished :)");
        }

        $scope.logStep = function() {
            console.log("Step continued");
        }

    $scope.ChangeToTutorial = function () {

        ngDialog.close('this');
        ngDialog.open({ 
           template: 'tut.html',
           className: 'ngdialog-theme-plain', 
           controller: 'settinsContoller'

        });
    }
});


myApp.controller("MgmController", function ($scope, $window, ngDialog, tabsInfoService) {
    $scope.openSettings = function () {
        ngDialog.open({ 
            template: 'settings.html', 
            className: 'ngdialog-theme-plain',
            controller: 'settinsContoller'

        });
    };

    $scope.openTutorial = function () {
        ngDialog.open({ 
            template: 'tut.html',
            className: 'ngdialog-theme-plain', 
            controller: 'settinsContoller'

        });
    };

    $scope.closeMe = function () {
        $window.close();
    };

    $scope.feedback = function () {

       $window.open("http://www.tabtodo.com/#!contact/cvrh"); 
      
    };

});



