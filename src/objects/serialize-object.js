$.fn.serializeObject = function () {
  let data = {};
  input = this.serializeArray();
  for (item of input) {
    data[item.name] = item.value;
  }
  return data;
};
