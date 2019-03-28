angular.module('coachDashBoard', ['ngAnimate', 'ngSanitize', 'ui.bootstrap', 'smart-table', 'angular.filter'])
    .controller('MainCtrl', function($scope, $uibModal, $log, $document, $http) {
        var $ctrl = this;

        $scope.init = function() {

            /*placeholder value used in smart-table because users are loaded asynchorously*/
            $scope.users_placeholder = [];

            /*placeholder value used in smart-table because results are loaded asynchorously*/
            $scope.results_placeholder = [];

            /*pagination - items to display on each page*/
            $scope.itemsByPage = 15;

            /*enable angular animations*/
            $ctrl.animationsEnabled = true;

            $http.get("/get_users").then(function(response) {
                $scope.users = response.data;
                /*console.log($scope.users);*/
            });

            $http.get("/get_test_marks").then(function(response) {
                $scope.tests_marks = response.data;
                /*console.log($scope.tests_marks);*/
            });

            /*Get raw test responses*/
            $http.get("/get_responses").then(function(response) {
                /*Do some operations on the responses*/
                for (var i = response.data.length - 1; i >= 0; i--) {
                    /*Convert test dates to javascript dates to enable search by alphanumeric characters*/
                    response.data[i]["test_date"] = new Date(response.data[i]["test_date"])

                    /*Generate blocks of fifths for each response*/
                    generate_blocks($scope.tests_marks, response.data[i])

                    /*Get test name*/
                    get_test_name($scope.tests_marks, response.data[i])

                    /*Calculate the percent score*/
                    calculate_score($scope.tests_marks, response.data[i])
                };

                /*store the processed file as a scope variable*/
                $scope.results = response.data;

            });

            /*Get the tests count by month*/
            $http.get("/get_test_count").then(function(response) {
                $scope.tests_count = response.data;
            });



        }

        $ctrl.openModal = function(parentSelector) {
            var parentElem = parentSelector ?
                angular.element($document[0].querySelector('.modal-demo ' + parentSelector)) : undefined;
            var modalInstance = $uibModal.open({
                animation: $ctrl.animationsEnabled,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: 'passwordModalContent.html',
                controller: 'ModalInstanceCtrl',
                controllerAs: '$ctrl',
                backdrop: 'static',
                keyboard: false,
                appendTo: parentElem
            });

            /*console.log("modal loaded");*/
        };


        /*Calculate the score percent for a test*/
        var calculate_score = function(testMarks, testResponse) {
            /*get the maxscore from config*/
            var maxScore = get_test_max_score(testMarks, testResponse)

            /*get object values for all qs in the response*/
            var all_qvals = Object.values(get_all_qs(testResponse))

            /*get only the slice of the qvals for the test e.g get only the first 25 vals if the test is out of 25*/
            var qvals_for_test = all_qvals.slice(0, maxScore)

            /*get the sum of the values and calculate the percent score based on maxscore*/
            testResponse.score_pct = get_sum_of_array(qvals_for_test) / maxScore

        }


        /*Test Results into blocks of fifths*/
        /*Split an array into chunks of specific length*/
        var chunkArrayInGroups = function(arr, chunk_length) {
            return arr.reduce(function(r, v, i) {
                if (i % chunk_length == 0) r.push(arr.slice(i, i + chunk_length));
                return r;
            }, []);
        }


        /*helper function to get sum of array*/
        const reducer = (accumulator, currentValue) => accumulator + Number(currentValue);
        /*get sum of members of array*/
        /*total of members of dataArray*/
        var get_sum_of_array = function(dataArray) {
            /*if the input is a dataArray(an object), then get the total of its memebers*/
            if (typeof(dataArray) == "object") {
                total = dataArray.reduce(reducer, 0)
                return total
            }
            /*if not an object, return null*/
            else {
                return null
            }
        }


        /*Get the max score of a test by finding it in the testMarks config array based on test,course, and module*/
        var get_test_max_score = function(testMarks, testResponse) {
            var testDetails = testMarks.find(testMark => { return testMark.test_id == testResponse.test && testMark.course == testResponse.course && testMark.module == testResponse.module })
            /*if the testDetails are found get the maxscore*/
            if (testDetails) {
                /*return the testmaxscore property of the testDetails object*/
                return testDetails.testmaxscore
            }
            /*if the testDetails are not found, return null*/
            else {
                return null
            }
        }

        /*Get the test name of a user's test from config*/
        var get_test_name = function(testMarks, testResponse) {
            var testDetails = testMarks.find(testMark => { return testMark.test_id == testResponse.test && testMark.course == testResponse.course && testMark.module == testResponse.module })
            /*if the testDetails are found get the maxscore*/
            if (testDetails) {
                /*return the testmaxscore property of the testDetails object*/
                testResponse.test_name = testDetails.test_name
            }
            /*if the testDetails are not found, return null*/
            else {
                return null
            }
        }


        /*Get all answers for each question i.e q1 to q... as key,value pairs*/
        var get_all_qs = function(testResponse) {
            var all_qs = Object.keys(testResponse).filter(function(k) {
                /*get index of all object properties that begin with 'q'*/
                return k.indexOf('q') == 0;
            }).reduce(function(newObj, k) {
                newObj[k] = testResponse[k];
                /*place all these properites and their values into a new object*/
                return newObj;
            }, {});

            /*return an object with q1 to q.. as key,value pairs*/
            return all_qs;
        }


        /*Create obeject properties for fifths of each response*/
        var get_block_values = function(testResponse, testMaxScore, chunksArray) {
            var one_fifth = testMaxScore / 5
            /*assumptions*/
            /*each question has a maxscore of 1*/
            /*the number of questions in a tests = maxscore*/
            /*the maxscore is always divisible by 5 with no remainder*/

            /*create blocks of fifths based on the number of questions in a test*/
            var block_1_name = 'q1 to ' + 'q' + one_fifth
            var block_2_name = 'q' + (one_fifth + 1) + ' to q' + (one_fifth * 2)
            var block_3_name = 'q' + (one_fifth * 2 + 1) + ' to q' + (one_fifth * 3)
            var block_4_name = 'q' + (one_fifth * 3 + 1) + ' to q' + (one_fifth * 4)
            var block_5_name = 'q' + (one_fifth * 4 + 1) + ' to q' + (one_fifth * 5)

            /*assign the result property on each block to true or false based on whether the value is equal to the value of one fifth*/
            testResponse.block_1 = { name: block_1_name, result: chunksArray[0] == one_fifth }
            testResponse.block_2 = { name: block_2_name, result: chunksArray[1] == one_fifth }
            testResponse.block_3 = { name: block_3_name, result: chunksArray[2] == one_fifth }
            testResponse.block_4 = { name: block_4_name, result: chunksArray[3] == one_fifth }
            testResponse.block_5 = { name: block_5_name, result: chunksArray[4] == one_fifth }
        }


        /*Main function which puts everything together*/
        /*Modifies testresponse object and adds properties block_1 to block_5*/
        var generate_blocks = function(testMarks, testResponse) {
            var cuttoffPoint = get_test_max_score(testMarks, testResponse)
            var one_fifth = cuttoffPoint / 5

            var all_qvals = Object.values(get_all_qs(testResponse))

            var qvals_for_test = all_qvals.slice(0, cuttoffPoint)

            var qvals_chunks = chunkArrayInGroups(qvals_for_test, one_fifth)

            var qvals_chunk_totals = []

            for (var i = 0; i < qvals_chunks.length; i++) {
                qvals_chunk_totals.push(get_sum_of_array(qvals_chunks[i]))
            }

            get_block_values(testResponse, cuttoffPoint, qvals_chunk_totals)

        }


    })
    .controller('ModalInstanceCtrl', function($scope, $uibModalInstance) {
        $scope.coachPassword = "Ctrib3";
        $scope.wrongPassword = false;

        var $ctrl = this;


        $ctrl.cancel = function() {
            $uibModalInstance.dismiss();
        };

        $ctrl.checkPassword = function(password) {
            if (password == $scope.coachPassword) {
                $scope.wrongPassword = false;
                $uibModalInstance.dismiss();
            } else {
                $scope.wrongPassword = true;
            }
        };
    })
    /*element directive for navigation bar*/
    .directive('navigation', function() {
        return {
            restrict: 'E',
            templateUrl: 'navigation.html',
            controller: function($window) {
                this.tab = 0; /* initially set tab to 1*/
                this.selectTab = function(setTab) { /* Set tab to whatever tab user clicks*/
                    this.tab = setTab;
                    console.log(this.tab);
                };
                this.isSelected = function(checkTab) { /* Check which tab is selected to trigger show of selected tab */
                    return this.tab === checkTab;

                };

                /*function to refresh page when button clicked*/
                this.refresh = function() {
                    $window.location.reload();
                }
            },
            controllerAs: 'menu'
        };
    })
    /*element directive for learners tab*/
    .directive('learners', function() {
        return {
            restrict: 'E',
            templateUrl: 'learners.html',
            link: function(scope, element, attributes) {
                /*class for all elements in directive. used for scoped styling*/
                element.addClass('learners');
            }
        };
    })
    /*element directive for responses tab*/
    .directive('responses', function() {
        return {
            restrict: 'E',
            templateUrl: 'responses.html',
            link: function(scope, element, attributes) {
                /*class for all elements in directive. used for scoped styling*/
                element.addClass('responses');
            }
        };
    })
    /*element directive for responses by question tab(development only)*/
    .directive('questresponses', function() {
        return {
            restrict: 'E',
            templateUrl: 'responses_q.html',
            link: function(scope, element, attributes) {
                /*class for all elements in directive. used for scoped styling*/
                element.addClass('questresponses');
            }
        };
    })
    /*element directive for tests count tab*/
    .directive('testscount', function() {
        return {
            restrict: 'E',
            templateUrl: 'testscount.html',
            link: function(scope, element, attributes) {
                /*class for all elements in directive. used for scoped styling*/
                element.addClass('testscount');
            }
        };
    });