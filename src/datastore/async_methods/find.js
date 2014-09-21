var DSUtils = require('../../utils');
var DSErrors = require('../../errors');

function find(resourceName, id, options) {
  var _this = this;
  var definition = _this.definitions[resourceName];
  var resource = _this.store[resourceName];

  return new DSUtils.Promise(function (resolve, reject) {
    options = options || {};

    if (!definition) {
      reject(new DSErrors.NER(resourceName));
    } else if (!DSUtils.isString(id) && !DSUtils.isNumber(id)) {
      reject(new DSErrors.IA('"id" must be a string or a number!'));
    } else if (!DSUtils.isObject(options)) {
      reject(new DSErrors.IA('"options" must be an object!'));
    } else {
      if (!('cacheResponse' in options)) {
        options.cacheResponse = true;
      }
      if (options.bypassCache || !options.cacheResponse) {
        delete resource.completedQueries[id];
      }
      if (id in resource.completedQueries) {
        resolve(_this.get(resourceName, id));
      } else {
        resolve();
      }
    }
  }).then(function (item) {
      if (!(id in resource.completedQueries)) {
        if (!(id in resource.pendingQueries)) {
          resource.pendingQueries[id] = _this.getAdapter(definition, options).find(definition, id, options)
            .then(function (data) {
              if (options.cacheResponse) {
                // Query is no longer pending
                delete resource.pendingQueries[id];
                resource.completedQueries[id] = new Date().getTime();
                return _this.inject(resourceName, data, options);
              } else {
                return _this.createInstance(resourceName, data, options);
              }
            });
        }
        return resource.pendingQueries[id];
      } else {
        return item;
      }
    }).catch(function (err) {
      delete resource.pendingQueries[id];
      throw err;
    });
}

module.exports = find;
