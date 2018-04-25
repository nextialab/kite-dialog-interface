angular.module('kite', []).controller('mainController', ['$scope', function ($scope) {

	$scope.json = {};
	$scope.json.name = '';
	$scope.json.events = [];
	$scope.json.entities = [];

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
		if ($scope.control.type == 'entity') {
			$scope.event.control = {
				type: 'entity',
				entity: $scope.control.entity
			}
		} else if ($scope.control.type == 'options') {
			$scope.event.control = {
				type: 'options',
				entity: $scope.control.options
			}
		}
		$scope.json.events.push(angular.copy($scope.event));
		$scope.control = angular.copy(control);
		$scope.event = angular.copy(event);
	}

	$scope.addExample = function () {
		$scope.entity.examples.push($scope.example.slice(0));
	}

	$scope.addEntity = function () {
		$scope.json.entities.push(angular.copy($scope.entity));
		$scope.entity = angular.copy(entity);
	}

	$scope.control = angular.copy(control);
	$scope.event = angular.copy(event);
	$scope.entity = angular.copy(entity);

}]);