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
.controller('editExample', ['$scope', '$uibModalInstance', 'example', function ($scope, $uibModalInstance, example) {

	$scope.example = '';

	if (example) {
		$scope.example = example;
	}

	$scope.save = function () {
		$uibModalInstance.close($scope.example);
	}

	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	}

}])
.controller('loadJson', ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {

	$scope.json = '';

	$scope.load = function () {
		$uibModalInstance.close(JSON.parse($scope.json));
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

	$scope.control = {};
	$scope.event = {};
	$scope.entity = {};

	$scope.getJson = function () {
		var json = angular.copy($scope.json);
		return JSON.stringify(json, null, 2);
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
		//generateFlow();
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
		//generateFlow();
	}

	$scope.removeEntity = function (index) {
		$scope.json.entities.splice(index, 1);
		//generateFlow();
	}

	$scope.getRowClass = function (row) {
		if (row) {
			return 'row' + row.length;
		} else {
			return 'row1';
		}
	}

	$scope.addExample = function () {
		$uibModal.open({
			templateUrl: 'editExample.html',
			controller: 'editExample',
			resolve: {
				example: null
			}
		}).result.then(function (exm) {
			$scope.entity.examples.push(exm);
		}, function (err) {
			console.log(err);
		});
	}

	$scope.editExample = function (index, example) {
		$uibModal.open({
			templateUrl: 'editExample.html',
			controller: 'editExample',
			resolve: {
				example: function () {
					return example;
				}
			}
		}).result.then(function (exm) {
			$scope.entity.examples[index] = exm;
		}, function (err) {
			console.log(err);
		});
	}

	$scope.removeExample = function (index) {
		$scope.entity.examples.splice(index, 1);
	}

	$scope.saveEntity = function () {
		var entity_to_save = $scope.json.entities.find(function (entity) {
			return entity.name === $scope.entity.name;
		});
		if (entity_to_save) {
			entity_to_save.examples = $scope.entity.examples;
			entity_to_save.triggers = $scope.entity.triggers;
		} else {
			$scope.json.entities.push(angular.copy($scope.entity));
		}
		//generateFlow();
		$scope.entity = angular.copy(entity);
	}

	$scope.editEntity = function (index) {
		var entity_to_edit = $scope.json.entities[index];
		$scope.entity.name = entity_to_edit.name;
		$scope.entity.examples = entity_to_edit.examples;
		$scope.entity.triggers = entity_to_edit.triggers;
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

	$scope.loadJson = function () {
		$uibModal.open({
			templateUrl: 'loadJson.html',
			controller: 'loadJson'
		}).result.then(function (json) {
			$scope.json = json;
		}, function (err) {
			console.log(err);
		});
	}

	$scope.control = angular.copy(control);
	$scope.event = angular.copy(event);
	$scope.entity = angular.copy(entity);

}]);