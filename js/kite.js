angular.module('kite', []).controller('mainController', ['$scope', function ($scope) {

	$scope.json = {};
	$scope.json.name = '';
	$scope.json.events = [];
	$scope.json.entities = [];
	$scope.floating = [];
	$scope.flow = [];

	var event = {
		name: '',
		responses: []
	};
	var entity = {
		name: '',
		examples: [],
		triggers: ''
	}
	var control = {
		type: 'entity',
		entity: '',
		options: []
	}

	$scope.response = {
		type: 'text',
		text: ''
	};
	$scope.option = {
		label: '',
		triggers: ''
	};
	$scope.example = '';
	$scope.control = {};
	$scope.event = {};
	$scope.entity = {};

	$scope.getJson = function () {
		return JSON.stringify($scope.json, null, 2);
	}

	$scope.addOption = function () {
		$scope.control.options.push(angular.copy($scope.option));
	}

	$scope.removeOption = function (index) {
		$scope.control.options.splice(index, 1);
	}

	$scope.removeResponse = function (index) {
		$scope.event.responses.splice(index, 1);
	}

	$scope.addResponse = function () {
		$scope.event.responses.push(angular.copy($scope.response));
	}

	$scope.addEvent = function () {
		function getEvent(name) {
			var event_to_find = $scope.json.events.find(function (event) {
				return event.name === name;
			});
			if (event_to_find) {
				return angular.copy(event_to_find);
			} else {
				return event_to_find;
			}
		}
		function getRow(event) {
			var nextrow = [];
			if (event.control.type === 'options') {
				event.control.options.forEach(function (option) {
					var next = getEvent(option.triggers);
					if (next) {
						nextrow.push(next);
					}
				});
			}
			return nextrow;
		}
		function isInRow(row, name) {
			var exists = row.find(function (event) {
				return event.name === name;
			});
			return exists != undefined;
		}
		function generateFlow() {
			var flow = [];
			var next = [getEvent('start')];
			if (next.length > 0) { 
				flow.push(next);
			}
			while (next.length > 0) {
				var nextrow = [];
				next.forEach(function (event) {
					var row = getRow(event);
					row.forEach(function (elem) {
						if (!isInRow(nextrow, elem.name)) {
							nextrow.push(elem);
						}
					});
				});
				if (nextrow.length > 0) {
					flow.push(nextrow);
				}
				next = nextrow;
			}
			$scope.flow = flow;
		}
		if ($scope.control.type == 'entity') {
			$scope.event.control = {
				type: 'entity',
				entity: $scope.control.entity
			}
		} else if ($scope.control.type == 'options') {
			$scope.event.control = {
				type: 'options',
				options: $scope.control.options
			}
		}
		$scope.json.events.push(angular.copy($scope.event));
		generateFlow();
		$scope.control = angular.copy(control);
		$scope.event = angular.copy(event);
	}

	$scope.getRowClass = function (row) {
		return 'row' + row.length;
	}

	$scope.addExample = function () {
		$scope.entity.examples.push($scope.example.slice(0));
	}

	$scope.addEntity = function () {
		$scope.json.entities.push(angular.copy($scope.entity));
		$scope.entity = angular.copy(entity);
	}

	$scope.getFloatingEvents = function () {
		return $scope.floating;
	}

	$scope.copyJson = function () {
		var el = document.createElement('textarea');
		el.value = $scope.getJson();
		el.setAttribute('readonly', '');
		el.style.position = 'absolute';
		el.style.left = '-9999px';
		document.body.appendChild(el);
		var selected = document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false;
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);
		if (selected) {
			document.getSelection().removeAllRanges();
			document.getSelection().addRange(selected);
		}
	}

	$scope.control = angular.copy(control);
	$scope.event = angular.copy(event);
	$scope.entity = angular.copy(entity);

}]);