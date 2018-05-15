angular.module('kite', ['ui.bootstrap'])
.controller('editResponse', ['$scope', '$uibModalInstance', 'response', function ($scope, $uibModalInstance, response) {

	$scope.type = 'text';
	$scope.text = '';

	if (response) {
		$scope.type = response.type;
		$scope.text = response.text;
	}

	$scope.save = function () {
		$uibModalInstance.close({
			type: $scope.type,
			text: $scope.text
		});
	}

	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	}

}])
.controller('editOption', ['$scope', '$uibModalInstance', 'option', function ($scope, $uibModalInstance, option) {

	$scope.label = '';
	$scope.triggers = '';

	if (option) {
		$scope.label = option.label;
		$scope.triggers = option.triggers;
	}

	$scope.save = function () {
		$uibModalInstance.close({
			label: $scope.label,
			triggers: $scope.triggers
		});
	}

	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	}

}])
.controller('mainController', ['$scope', '$uibModal', function ($scope, $uibModal) {

	$scope.json = {};
	$scope.json.name = '';
	$scope.json.events = [];
	$scope.json.entities = [];
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
		tool: '',
		entity: '',
		options: []
	}

	$scope.example = '';
	$scope.control = {};
	$scope.event = {};
	$scope.entity = {};

	$scope.getJson = function () {
		return JSON.stringify($scope.json, null, 2);
	}

	$scope.addOption = function () {
		$uibModal.open({
			controller: 'editOption',
			templateUrl: 'editOption.html',
			resolve: {
				option: null
			}
		}).result.then(function (opt) {
			$scope.control.options.push(opt);
		}, function (err) {
			console.log(err);
		});
	}

	$scope.editOption = function (option) {
		$uibModal.open({
			controller: 'editOption',
			templateUrl: 'editOption.html',
			resolve: {
				option: option
			}
		}).result.then(function (opt) {
			option.label = opt.label;
			option.triggers = opt.triggers;
		}, function (err) {
			console.log(err);
		});
	}

	$scope.removeOption = function (index) {
		$scope.control.options.splice(index, 1);
	}

	$scope.removeResponse = function (index) {
		$scope.event.responses.splice(index, 1);
	}

	$scope.addResponse = function () {
		$uibModal.open({
			controller: 'editResponse',
			templateUrl: 'editResponse.html',
			resolve: {
				response: null
			}
		}).result.then(function (res) {
			$scope.event.responses.push(res);
		}, function (err) {
			console.log(err);
		});
	}

	$scope.editResponse = function (response) {
		$uibModal.open({
			controller: 'editResponse',
			templateUrl: 'editResponse.html',
			resolve: {
				response: response
			}
		}).result.then(function (res) {
			response.type = res.type;
			response.text = res.text;
		}, function (err) {
			console.log(err);
		});
	}

	function generateFlow() {
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
		function getEntity(name) {
			var entity_to_find = $scope.json.entities.find(function (entity) {
				return entity.name === name;
			});
			if (entity_to_find) {
				return angular.copy(entity_to_find);
			} else {
				return entity_to_find;
			}
		}
		function getRow(event) {
			var nextrow = [];
			if (event.control) { // event
				if (event.control.type === 'options') {
					event.control.options.forEach(function (option) {
						var next = getEvent(option.triggers);
						if (next) {
							nextrow.push(next);
						}
					});
				} else if (event.control.type === 'entity') {
					var next = getEntity(event.control.entity);
					if (next) {
						nextrow.push(next);
					}
				}
			} else { // entity
				var next = getEvent(event.triggers);
				if (next) {
					nextrow.push(next);
				}
			}
			return nextrow;
		}
		function isInRow(row, name) {
			var exists = row.find(function (event) {
				return event.name === name;
			});
			return exists != undefined;
		}
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

	$scope.saveEvent = function () {
		var event_to_save = $scope.json.events.find(function (event) {
			return event.name === $scope.event.name;
		});
		if (event_to_save) {
			delete $scope.event.options;
			delete $scope.event.entity;
			delete $scope.event.tool;
			event_to_save.responses = angular.copy($scope.event.responses);
			if ($scope.control.type == 'entity') {
				event_to_save.control = {
					type: 'entity',
					entity: angular.copy($scope.control.entity)
				};
			} else if ($scope.control.type == 'options') {
				event_to_save.control = {
					type: 'options',
					options: angular.copy($scope.control.options)
				};
			} else if ($scope.control.type == 'tool') {
				event_to_save.control = {
					type: 'tool',
					tool: angular.copy($scope.control.tool)
				};
			}
		} else {
			if ($scope.control.type == 'entity') {
				$scope.event.control = {
					type: 'entity',
					entity: $scope.control.entity
				};
			} else if ($scope.control.type == 'options') {
				$scope.event.control = {
					type: 'options',
					options: $scope.control.options
				};
			} else if ($scope.control.type == 'tool') {
				$scope.event.control = {
					type: 'tool',
					tool: $scope.control.tool
				};
			}
			$scope.json.events.push(angular.copy($scope.event));
		}
		generateFlow();
		$scope.control = angular.copy(control);
		$scope.event = angular.copy(event);
	}

	$scope.editEvent = function (index) {
		var event_to_edit = $scope.json.events[index];
		$scope.event.name = event_to_edit.name;
		$scope.event.responses = event_to_edit.responses;
		if (event_to_edit.control) {
			if (event_to_edit.control.type == 'entity') {
				$scope.control.type = 'entity';
				$scope.control.entity = event_to_edit.control.entity;
			} else if (event_to_edit.control.type == 'options') {
				$scope.control.type = 'options';
				$scope.control.options = event_to_edit.control.options;
			} else if (event_to_edit.control.type == 'tool') {
				$scope.control.type == 'tool';
				$scope.control.tool = event_to_edit.control.tool;
			}
		}
	}

	$scope.removeEvent = function (index) {
		$scope.json.events.splice(index, 1);
		generateFlow();
	}

	$scope.removeEntity = function (index) {
		$scope.json.entities.splice(index, 1);
		generateFlow();
	}

	$scope.getRowClass = function (row) {
		if (row) {
			return 'row' + row.length;
		} else {
			return 'row1';
		}
	}

	$scope.addExample = function () {
		$scope.entity.examples.push($scope.example.slice(0));
	}

	$scope.addEntity = function () {
		$scope.json.entities.push(angular.copy($scope.entity));
		generateFlow();
		$scope.entity = angular.copy(entity);
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