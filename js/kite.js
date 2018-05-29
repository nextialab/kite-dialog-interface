angular.module('kite', ['ui.bootstrap'])
.component('sigmaJs', {
	templateUrl: 'sigma.html',
	bindings: {
		graph: '<'
	},
	controller: function () {

		var $ctrl = this;
		$ctrl.sigma = null;

		$ctrl.$onInit = function () {
			$ctrl.sigma = new sigma('graph');
		    $ctrl.sigma.configNoverlap({
		    	nodeMargin: 3.0,
		    	scaleNodes: 1.3
			});
		}

		$ctrl.$onChanges = function (changes) {
			if ($ctrl.sigma) {
				$ctrl.sigma.graph.clear();
				$ctrl.sigma.graph.read(changes.graph.currentValue);
				$ctrl.sigma.refresh();
				if (!changes.graph.currentValue.start) {
					$ctrl.sigma.startNoverlap();
				}
			}
		}

	}
})
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
.controller('mainController', ['$scope', '$uibModal', '$timeout', function ($scope, $uibModal, $timeout) {

	$scope.json = {};
	$scope.json.name = '';
	$scope.json.events = [];
	$scope.json.entities = [];
	$scope.message = '';
	$scope.flow = {
		nodes: [],
		edges: []
	};

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

	$scope.responseDown = function (index) {
		var temp = $scope.event.responses[index];
		$scope.event.responses[index] = $scope.event.responses[index + 1];
		$scope.event.responses[index + 1] = temp;
	}

	$scope.responseUp = function (index) {
		var temp = $scope.event.responses[index];
		$scope.event.responses[index] = $scope.event.responses[index - 1];
		$scope.event.responses[index - 1] = temp;
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

	function getItem(name) {
		var event_to_found = $scope.json.events.find(function (event) {
			return event.name === name;
		});
		var entity_to_found = $scope.json.entities.find(function (entity) {
			return entity.name === name;
		});
		return event_to_found || entity_to_found || undefined;
	}

	function checkBranch(branch, node) {
		if (branch.name === node.name) {
			return {
				depth: 0,
				found: true
			};
		} else {
			if (branch.control) { // branch is event
				if (branch.control.type === 'options') {
					var checks = branch.control.options.map(function (option) {
						var next = getItem(option.triggers);
						if (next) {
							return checkBranch(next, node);
						} else {
							return {
								found: false
							};
						}
					});
					var founds = checks.filter(function (check) {
						return check.found;
					});
					if (founds.length > 0) {
						var max = founds.reduce(function (acc, found) {
							if (found.depth > acc.depth) {
								return found;
							} else {
								return acc;
							}
						});
						return {
							depth: max.depth + 1,
							found: max.found || false
						};
					} else {
						return {
							depth: 0,
							found: false
						};
					}
				} else if (branch.control.type === 'entity') {
					var check = checkBranch(getItem(branch.control.entity), node);
					return {
						depth: check.depth + 1,
						found: check.found || false
					};
				} else { // control is tool
					var check = checkBranch(getItem(branch.control.tool), node);
					return {
						depth: check.depth + 1,
						found: check.found || false
					};
				}
			} else if (branch.triggers) { // branch is entity
				var check = checkBranch(getItem(branch.triggers), node);
				return {
					depth: check.depth + 1,
					found: check.found || false
				};
			} else { // branch is final
				return {
					depth: 0,
					found: false
				};
			}
		}
	}

	function generateFlow() {
		var start = getItem('start');
		var flow = {
			nodes: [],
			edges: [],
			start: start ? true : false
		}
		var id = 0;
		$scope.json.events.forEach(function (event) {
			var triggers = [];
			if (event.control) {
				if (event.control.type == 'options') {
					triggers = event.control.options.map(function (option) {
						return option.triggers;
					});
				} else if (event.control.type == 'entity') {
					triggers.push(event.control.entity);
				} else if (event.control.type == 'tool') {
					triggers.push(event.control.tool);
				}
			}
			var y = 0;
			if (start) {
				var depth = checkBranch(start, event);
				if (depth.found) {
					y = depth.depth;
				}
			}
			flow.nodes.push({
				id: 'n' + id,
				label: event.name,
				x: 0,
				y: y,
				triggers: triggers,
				size: 1,
				color: '#f00'
			});
			id = id + 1;
		});
		$scope.json.entities.forEach(function (entity) {
			var y = 0;
			if (start) {
				var depth = checkBranch(start, entity);
				if (depth.found) {
					y = depth.depth;
				}
			}
			flow.nodes.push({
				id: 'n' + id,
				label: entity.name,
				x: 0,
				y: y,
				triggers: [entity.triggers],
				size: 1,
				color: '#0f0'
			});
			id = id + 1;
		});
		if (start) {
			for (var i = 0; i < flow.nodes.length; i++) {
				var same_depth = flow.nodes.filter(function (node) {
					return node.y == i;
				});
				if (same_depth.length > 0) {
					var from = 0;
					if (same_depth.length % 2 == 0) {
						from = -1 * same_depth.length / 2 + 0.5;
					} else {
						from = -1 * (same_depth.length - 1) / 2;
					}
					for (var j = 0; j < same_depth.length; j++) {
						same_depth[j].x = from + j;
					}
				}
			}
		}
		id = 0;
		flow.nodes.forEach(function (node) {
			node.triggers.forEach((function (next) {
				var node_to_find = flow.nodes.find(function (_node) {
					return _node.label === next;
				});
				if (node_to_find) {
					flow.edges.push({
						id: 'e' + id,
						source: node.id,
						target: node_to_find.id
					});
					id = id + 1;
				}
			}));
		});
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
		generateFlow();
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
		$scope.message = 'Copied!';
		$timeout(function () {
			$scope.message = '';
		}, 1000);
	}

	$scope.loadJson = function () {
		$uibModal.open({
			templateUrl: 'loadJson.html',
			controller: 'loadJson'
		}).result.then(function (json) {
			$scope.json = json;
			generateFlow();
		}, function (err) {
			console.log(err);
		});
	}

	$scope.control = angular.copy(control);
	$scope.event = angular.copy(event);
	$scope.entity = angular.copy(entity);

}]);